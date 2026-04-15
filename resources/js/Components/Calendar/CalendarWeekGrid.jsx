import { useEffect, useMemo, useRef, useState } from 'react';
import {
    DndContext,
    PointerSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import Icon from '@/Components/Icon';
import { getEmployeeSlotStyles } from '@/utils/employeeCalendarColor';
import { appointmentStatusValue, formatTimeHm, minutesToTimeHm, timeToMinutes } from '@/utils/appointmentDate';

/** Busy / invalid slot while dragging — same for column bands and drop preview (matches hover feedback). */
const BUSY_CONFLICT_OVERLAY_CLASS =
    'rounded-lg bg-red-400/25 shadow-inner ring-2 ring-inset ring-red-500/60';

/** Supports API shapes `{ start, end }` and `{ start_time, end_time }`. */
function breakIntervalToMinutes(br) {
    const startRaw = br?.start ?? br?.start_time;
    const endRaw = br?.end ?? br?.end_time;
    return { bs: timeToMinutes(startRaw), be: timeToMinutes(endRaw) };
}

function rangeOverlapsAnyBreak(startMin, endMin, breaks) {
    if (!breaks?.length) {
        return false;
    }
    for (const br of breaks) {
        const { bs, be } = breakIntervalToMinutes(br);
        if (startMin < be && endMin > bs) {
            return true;
        }
    }
    return false;
}

/** ~130px per hour — total grid height scales with visible minutes. */
const PX_PER_HOUR = 130;
const DEFAULT_CALENDAR_HOURS = { start: '08:00', end: '20:00' };
const DEFAULT_SLOT_MINUTES = 30;

function clampSlotMinutes(raw) {
    const n = Number(raw);
    if (!Number.isFinite(n)) {
        return DEFAULT_SLOT_MINUTES;
    }
    return Math.min(120, Math.max(5, Math.round(n)));
}

/**
 * Row lines follow the business default slot step only (e.g. 30 → :00, :30). Drag snap can be finer per appointment.
 * @returns {{ startMin: number, endMin: number, minutes: number }[]}
 */
function buildTimeSegments(rangeStartMin, rangeEndMin, slotMinutes) {
    const segments = [];
    let t = rangeStartMin;
    while (t < rangeEndMin) {
        const end = Math.min(t + slotMinutes, rangeEndMin);
        segments.push({
            startMin: t,
            endMin: end,
            minutes: end - t,
        });
        t = end;
    }
    return segments;
}

function resolveCalendarRange(calendarHours, gridLineMinutesRaw) {
    const gridLineMinutes = clampSlotMinutes(gridLineMinutesRaw);
    const src =
        calendarHours && calendarHours.start && calendarHours.end ? calendarHours : DEFAULT_CALENDAR_HOURS;
    let rangeStartMin = timeToMinutes(src.start);
    let rangeEndMin = timeToMinutes(src.end);
    if (rangeEndMin <= rangeStartMin) {
        rangeStartMin = timeToMinutes(DEFAULT_CALENDAR_HOURS.start);
        rangeEndMin = timeToMinutes(DEFAULT_CALENDAR_HOURS.end);
    }
    const minutesInView = rangeEndMin - rangeStartMin;
    const hourSlotCount = minutesInView / 60;
    const gridMinHeight = Math.max(PX_PER_HOUR, hourSlotCount * PX_PER_HOUR);
    const gridWithHeaderMinHeight = gridMinHeight + 68;
    const segments = buildTimeSegments(rangeStartMin, rangeEndMin, gridLineMinutes);
    return {
        rangeStartMin,
        rangeEndMin,
        minutesInView,
        gridMinHeight,
        gridWithHeaderMinHeight,
        segments,
        gridLineMinutes,
    };
}

/**
 * While dragging, snap to the finer of: business grid step vs service length (e.g. 30 vs 15 → 15).
 */
function dragSnapMinutes(gridLineMinutes, serviceDurationMinutes) {
    const g = clampSlotMinutes(gridLineMinutes);
    const d = Number(serviceDurationMinutes);
    if (!Number.isFinite(d) || d < 1) {
        return g;
    }
    const svc = Math.min(120, Math.max(5, Math.round(d)));
    return Math.min(g, svc);
}

function dayLabel(d) {
    return d.toLocaleDateString('en-GB', { weekday: 'short' });
}

function dayNum(d) {
    return d.getDate();
}

function statusIconName(status) {
    const s = appointmentStatusValue(status);
    if (s === 'confirmed') return 'check';
    if (s === 'cancelled') return 'close';
    return 'schedule';
}

/** Outer slot outline: confirmed / cancelled use CSS keyword colors and a thick border (no tinted padding). */
function statusOuterBorderStyle(status) {
    const s = appointmentStatusValue(status);
    if (s === 'confirmed') {
        return { border: '2px solid green' };
    }
    if (s === 'cancelled') {
        return { border: '2px solid red' };
    }
    return { border: '2px solid rgb(203 213 225)' };
}

/**
 * @param {Array<{ id: number, apt: object, startMin: number, endMin: number }>} items
 */
function layoutOverlapping(items) {
    const sorted = [...items].sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);
    const laneEnds = [];

    for (const ev of sorted) {
        let lane = 0;
        while (lane < laneEnds.length && laneEnds[lane] > ev.startMin) {
            lane += 1;
        }
        if (lane === laneEnds.length) {
            laneEnds.push(ev.endMin);
        } else {
            laneEnds[lane] = ev.endMin;
        }
        ev.lane = lane;
    }

    for (const ev of sorted) {
        const overlapping = sorted.filter((o) => o.startMin < ev.endMin && o.endMin > ev.startMin);
        const maxLane = Math.max(...overlapping.map((o) => o.lane));
        const cols = maxLane + 1;
        ev.widthPct = 100 / cols;
        ev.leftPct = (ev.lane / cols) * 100;
    }

    return sorted;
}

function DraggableEvent({
    apt,
    layout,
    rangeStartMin,
    minutesInView,
    dayDateStr,
    onOpen,
    disabled,
    readOnly,
    employeeColorMap,
    gridLineMinutes,
}) {
    const cancelled = appointmentStatusValue(apt.status) === 'cancelled';
    const id = `appt-${apt.id}`;
    const startMin = timeToMinutes(apt.start_time);
    const endMin = timeToMinutes(apt.end_time);
    const topPct = ((startMin - rangeStartMin) / minutesInView) * 100;
    const heightPct = ((endMin - startMin) / minutesInView) * 100;

    const serviceDuration = apt.service?.duration != null ? Number(apt.service.duration) : null;
    const dragSnapMinutesValue = dragSnapMinutes(gridLineMinutes, serviceDuration);

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id,
        disabled: readOnly || disabled || cancelled,
        data: {
            type: 'appointment',
            appointment: apt,
            startMin,
            dayDateStr,
            dragSnapMinutes: dragSnapMinutesValue,
            gridLineMinutes,
        },
    });

    const style = {
        top: `${topPct}%`,
        height: `${Math.max(heightPct, 1.6)}%`,
        width: `${layout.widthPct}%`,
        left: `${layout.leftPct}%`,
        position: 'absolute',
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.92 : 1,
        boxSizing: 'border-box',
        ...statusOuterBorderStyle(apt.status),
    };

    const colors = getEmployeeSlotStyles(employeeColorMap, apt.employee_id);
    const title = apt.service?.name || 'Appointment';

    return (
        <button
            type="button"
            ref={setNodeRef}
            style={style}
            className="absolute box-border overflow-hidden rounded-lg text-left shadow-sm"
            {...(readOnly || cancelled ? {} : listeners)}
            {...attributes}
            onClick={(e) => {
                e.stopPropagation();
                onOpen(apt);
            }}
        >
            <span
                className="pointer-events-none flex h-full min-h-0 flex-col justify-between rounded-md border-l-[3px] px-1.5 py-1.5 sm:py-2"
                style={{
                    backgroundColor: colors.bg,
                    borderLeftColor: colors.border,
                    color: colors.text,
                }}
            >
                <span className="flex items-start justify-between gap-0.5">
                    <span className="min-w-0 truncate text-[8px] font-bold leading-tight sm:text-[10px]">{title}</span>
                    <Icon name={statusIconName(apt.status)} size="text-[10px]" className="shrink-0 opacity-90 sm:text-xs" />
                </span>
            </span>
        </button>
    );
}

/**
 * @param {import('@dnd-kit/core').DragMoveEvent | import('@dnd-kit/core').DragEndEvent} event
 * @returns {{ dateStr: string, startMin: number, endMin: number } | null}
 */
function computeDropPreviewFromEvent(event, { gridBodyRefs, gridMinHeight, minutesInView, rangeStartMin, rangeEndMin, gridLineMinutes }) {
    const { active, over, delta } = event;
    if (!active?.data?.current?.appointment || !over?.data?.current?.date) {
        return null;
    }
    const apt = active.data.current.appointment;
    const startMin = active.data.current.startMin;
    const targetDate = over.data.current.date;
    if (typeof targetDate !== 'string') {
        return null;
    }

    const snapMinutes =
        active.data.current.dragSnapMinutes ??
        dragSnapMinutes(gridLineMinutes, apt.service?.duration != null ? Number(apt.service.duration) : null);

    const gridEl = gridBodyRefs.current[targetDate];
    const h = gridEl?.offsetHeight || gridMinHeight;
    const pxPerMinute = h / minutesInView;

    let newStartMin = startMin + delta.y / pxPerMinute;
    newStartMin = Math.round(newStartMin / snapMinutes) * snapMinutes;

    const duration = Math.max(5, timeToMinutes(apt.end_time) - timeToMinutes(apt.start_time));
    newStartMin = Math.max(rangeStartMin, Math.min(newStartMin, rangeEndMin - duration));

    return {
        dateStr: targetDate,
        startMin: newStartMin,
        endMin: newStartMin + duration,
    };
}

/**
 * Scheduled breaks — z above invalid-slot bands so amber stays visible (not covered by red).
 */
function BreakIntervalLayers({ breaks, rangeStartMin, rangeEndMin, minutesInView }) {
    if (!breaks?.length) {
        return null;
    }
    return breaks.map((br, i) => {
        const { bs: s, be: e } = breakIntervalToMinutes(br);
        const top = Math.max(s, rangeStartMin);
        const bottom = Math.min(e, rangeEndMin);
        if (bottom <= top) {
            return null;
        }
        const topPct = ((top - rangeStartMin) / minutesInView) * 100;
        const heightPct = ((bottom - top) / minutesInView) * 100;
        const keyStart = br.start ?? br.start_time ?? i;
        const keyEnd = br.end ?? br.end_time ?? i;
        return (
            <div
                key={`${keyStart}-${keyEnd}-${i}`}
                className="pointer-events-none absolute right-0 left-0 z-[14] border-y border-dashed border-amber-300/80 bg-amber-100/50"
                style={{ top: `${topPct}%`, height: `${Math.max(heightPct, 0.25)}%` }}
                aria-hidden
            />
        );
    });
}

/**
 * Full-column markers for API-invalid start times (e.g. resource conflict).
 * Same look as invalid DropSlotPreview. Skips breaks and is not used on day-off columns.
 */
function UnavailableSlotBands({ allowedSet, rangeStartMin, rangeEndMin, minutesInView, durationMin, snapMin, breaks }) {
    const bands = useMemo(() => {
        if (!allowedSet || snapMin < 1 || durationMin < 1) {
            return [];
        }
        const out = [];
        const lastStart = rangeEndMin - durationMin;
        for (let t = rangeStartMin; t <= lastStart; t += snapMin) {
            if (!allowedSet.has(minutesToTimeHm(t))) {
                const blockEnd = t + durationMin;
                if (rangeOverlapsAnyBreak(t, blockEnd, breaks)) {
                    continue;
                }
                out.push(t);
            }
        }
        return out;
    }, [allowedSet, rangeStartMin, rangeEndMin, durationMin, snapMin, breaks]);

    if (!bands.length) {
        return null;
    }

    return (
        <>
            {bands.map((t) => {
                const topPct = ((t - rangeStartMin) / minutesInView) * 100;
                const heightPct = (durationMin / minutesInView) * 100;
                return (
                    <div
                        key={t}
                        className={`pointer-events-none absolute right-0.5 left-0.5 z-[5] ${BUSY_CONFLICT_OVERLAY_CLASS}`}
                        style={{ top: `${topPct}%`, height: `${Math.max(heightPct, 0.2)}%` }}
                        aria-hidden
                    />
                );
            })}
        </>
    );
}

/** Inset ring + tinted fill at the pre-drag slot, using the same employee palette as the appointment card. */
function DragOriginGhost({ apt, layout, rangeStartMin, minutesInView, startMin, endMin, employeeColorMap }) {
    const colors = getEmployeeSlotStyles(employeeColorMap, apt.employee_id);
    const topPct = ((startMin - rangeStartMin) / minutesInView) * 100;
    const heightPct = ((endMin - startMin) / minutesInView) * 100;
    return (
        <div
            className="pointer-events-none absolute z-[15] box-border rounded-lg"
            style={{
                top: `${topPct}%`,
                height: `${Math.max(heightPct, 1.6)}%`,
                width: `${layout.widthPct}%`,
                left: `${layout.leftPct}%`,
                backgroundColor: colors.bg,
                opacity: 0.42,
                boxShadow: `inset 0 0 0 2px ${colors.border}`,
            }}
            aria-hidden
        />
    );
}

function DropSlotPreview({ dateStr, dropPreview, rangeStartMin, minutesInView, variant }) {
    if (!dropPreview || dropPreview.dateStr !== dateStr) {
        return null;
    }
    const topPct = ((dropPreview.startMin - rangeStartMin) / minutesInView) * 100;
    const heightPct = ((dropPreview.endMin - dropPreview.startMin) / minutesInView) * 100;
    if (variant === 'invalid') {
        return (
            <div
                className={`pointer-events-none absolute right-0.5 left-0.5 z-[18] ${BUSY_CONFLICT_OVERLAY_CLASS}`}
                style={{ top: `${topPct}%`, height: `${Math.max(heightPct, 1.6)}%` }}
                aria-hidden
            />
        );
    }
    const cls =
        variant === 'loading' ? 'border-slate-500 bg-slate-300/30' : 'border-sky-600 bg-sky-400/25';
    return (
        <div
            className={`pointer-events-none absolute right-0.5 left-0.5 z-[18] rounded-lg border-2 border-dashed shadow-inner ${cls}`}
            style={{ top: `${topPct}%`, height: `${Math.max(heightPct, 1.6)}%` }}
            aria-hidden
        />
    );
}

function DayColumn({
    dateStr,
    dateObj,
    isToday,
    children,
    setGridBodyRef,
    segments,
    gridMinHeight,
    breaks,
    isDayOff,
    rangeStartMin,
    rangeEndMin,
    minutesInView,
    /**
     * When showing API conflict bands during drag, avoid `bg-sky-100/50` on hover — it washes out
     * semi-transparent red markers; use ring-only drop feedback instead.
     */
    droppableHoverOutlineOnly = false,
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: `calendar-day-${dateStr}`,
        data: { type: 'day', date: dateStr },
    });

    const combinedRef = (el) => {
        setNodeRef(el);
        setGridBodyRef(dateStr, el);
    };

    const droppableBodyClass =
        isOver && droppableHoverOutlineOnly
            ? 'bg-white ring-2 ring-inset ring-sky-500/50'
            : isOver
              ? 'bg-sky-100/50 ring-2 ring-inset ring-sky-500/40'
              : 'bg-white';

    return (
        <div className="relative flex min-w-0 flex-1 flex-col border-l border-slate-100 first:border-l-0">
            <div
                className={`flex min-h-[56px] flex-col items-center justify-center border-b border-slate-100 px-0.5 py-1.5 sm:min-h-[68px] sm:py-2 ${
                    isToday ? 'bg-red-50/40' : 'bg-white'
                }`}
            >
                <span className="max-w-full truncate text-[9px] font-bold uppercase leading-tight tracking-tight text-on-surface-variant sm:text-[11px] sm:tracking-wide">
                    {dayLabel(dateObj)}
                </span>
                <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[11px] font-extrabold sm:mt-1 sm:h-8 sm:w-8 sm:text-sm ${
                        isToday ? 'rounded-full bg-red-500 text-white' : 'text-on-surface'
                    }`}
                >
                    {dayNum(dateObj)}
                </span>
            </div>
            <div
                ref={combinedRef}
                className={`relative flex-1 transition-colors duration-150 ${droppableBodyClass}`}
                style={{ minHeight: gridMinHeight }}
            >
                <div className="pointer-events-none absolute inset-0 flex flex-col">
                    {segments.map((seg) => (
                        <div
                            key={`${seg.startMin}-${seg.endMin}`}
                            className="min-h-0 shrink-0 border-b border-slate-100/90"
                            style={{ flex: `${seg.minutes} 1 0` }}
                        />
                    ))}
                </div>
                <BreakIntervalLayers
                    breaks={breaks}
                    rangeStartMin={rangeStartMin}
                    rangeEndMin={rangeEndMin}
                    minutesInView={minutesInView}
                />
                {isDayOff && (
                    <div
                        className="pointer-events-none absolute inset-0 z-[16] border-y border-dashed border-amber-300/90 bg-amber-100/45"
                        aria-hidden
                    />
                )}
                {children}
            </div>
        </div>
    );
}

export default function CalendarWeekGrid({
    columnDates = [],
    appointments,
    employeeColorMap,
    onEventClick,
    onAppointmentMove,
    dragSavingId,
    readOnly = false,
    calendarHours = null,
    slotDurationMinutes = DEFAULT_SLOT_MINUTES,
    calendarDayBreaks = {},
    calendarDayOffs = [],
    /**
     * `admin`: GET admin.appointments.slots (employee + service + date + exclude).
     * `employee`: GET employee.appointments.slots/{id} (date + service_id) — same rules as edit modal.
     * `none`: no client-side slot check on drag.
     */
    slotValidationMode = 'none',
}) {
    const { rangeStartMin, rangeEndMin, minutesInView, gridMinHeight, gridWithHeaderMinHeight, segments, gridLineMinutes } = useMemo(
        () => resolveCalendarRange(calendarHours, slotDurationMinutes),
        [calendarHours?.start, calendarHours?.end, slotDurationMinutes],
    );

    const gridBodyRefs = useRef({});

    const setGridBodyRef = (dateStr, el) => {
        if (el) {
            gridBodyRefs.current[dateStr] = el;
        } else {
            delete gridBodyRefs.current[dateStr];
        }
    };

    const [nowTick, setNowTick] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setNowTick((n) => n + 1), 60000);
        return () => clearInterval(t);
    }, []);

    const todayStr = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, [nowTick]);

    const appointmentsByDay = useMemo(() => {
        const map = new Map();
        for (const d of columnDates) {
            map.set(d, []);
        }
        for (const apt of appointments) {
            const raw = apt.date ? String(apt.date).slice(0, 10) : '';
            if (map.has(raw)) {
                map.get(raw).push(apt);
            }
        }
        return map;
    }, [appointments, columnDates]);

    const [dropPreview, setDropPreview] = useState(null);
    const [slotSetsByDate, setSlotSetsByDate] = useState(null);
    const [slotSetsLoading, setSlotSetsLoading] = useState(false);
    /** Set on drag start when validating; drives invalid time bands + snap step. */
    const [dragOverlaySpec, setDragOverlaySpec] = useState(null);
    /** Original slot while an appointment is being dragged (ghost marker). */
    const [dragOrigin, setDragOrigin] = useState(null);
    /** When drag-move runs before React applies drag-start preview state, use this for `next ?? prev`. */
    const dragPreviewFallbackRef = useRef(null);
    const dragSlotFetchGen = useRef(0);

    const dragLayoutCtx = useMemo(
        () => ({
            gridBodyRefs,
            gridMinHeight,
            minutesInView,
            rangeStartMin,
            rangeEndMin,
            gridLineMinutes,
        }),
        [gridMinHeight, minutesInView, rangeStartMin, rangeEndMin, gridLineMinutes],
    );

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
    );

    const updateDropPreview = (event) => {
        if (readOnly) {
            return;
        }
        // When `over` is briefly null (between columns, first frame of drag), keep the last
        // preview — otherwise the dashed outline clears until the pointer enters a day again.
        setDropPreview((prev) => {
            const next = computeDropPreviewFromEvent(event, dragLayoutCtx);
            if (next !== null) {
                return next;
            }
            if (prev !== null) {
                return prev;
            }
            return dragPreviewFallbackRef.current;
        });
    };

    const resetDragSlotFetch = () => {
        dragSlotFetchGen.current += 1;
        setSlotSetsByDate(null);
        setSlotSetsLoading(false);
        setDragOverlaySpec(null);
    };

    const handleDragStart = (event) => {
        resetDragSlotFetch();
        setDropPreview(null);
        setDragOrigin(null);
        dragPreviewFallbackRef.current = null;

        if (readOnly) {
            return;
        }

        const ctx = event.active?.data?.current;
        const apt = ctx?.appointment;
        if (apt?.id) {
            const dayDateStr = ctx?.dayDateStr;
            const dateStrForOrigin = dayDateStr ?? (apt.date ? String(apt.date).slice(0, 10) : null);
            const startM = ctx?.startMin != null ? ctx.startMin : timeToMinutes(apt.start_time);
            const endM = timeToMinutes(apt.end_time);
            if (dateStrForOrigin != null) {
                setDragOrigin({ aptId: apt.id, dateStr: dateStrForOrigin, startMin: startM, endMin: endM });
                dragPreviewFallbackRef.current = {
                    dateStr: dateStrForOrigin,
                    startMin: startM,
                    endMin: endM,
                };
            }
        }

        if (slotValidationMode === 'none') {
            return;
        }
        if (!apt?.service_id) {
            return;
        }
        if (slotValidationMode === 'admin' && !apt?.employee_id) {
            return;
        }

        const startMin = event.active?.data?.current?.startMin;
        const dayDateStr = event.active?.data?.current?.dayDateStr;
        const durationMin = Math.max(5, timeToMinutes(apt.end_time) - timeToMinutes(apt.start_time));
        const dragSnap =
            event.active?.data?.current?.dragSnapMinutes ??
            dragSnapMinutes(gridLineMinutes, apt.service?.duration != null ? Number(apt.service.duration) : null);

        const dateStrForPreview =
            dayDateStr ?? (apt.date ? String(apt.date).slice(0, 10) : null);
        const startMinResolved = startMin != null ? startMin : timeToMinutes(apt.start_time);
        if (dateStrForPreview != null && startMinResolved != null) {
            setDropPreview({
                dateStr: dateStrForPreview,
                startMin: startMinResolved,
                endMin: startMinResolved + durationMin,
            });
            setDragOverlaySpec({ durationMin, snapMin: dragSnap });
        }

        const gen = dragSlotFetchGen.current;
        setSlotSetsLoading(true);
        setSlotSetsByDate(null);

        const fetchSlotsForDate = (date) => {
            if (slotValidationMode === 'admin') {
                const params = new URLSearchParams({
                    employee_id: String(apt.employee_id),
                    service_id: String(apt.service_id),
                    date,
                    exclude_id: String(apt.id),
                });
                return fetch(route('admin.appointments.slots') + '?' + params.toString(), {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                })
                    .then((r) => r.json())
                    .then((data) => ({ date, slots: data.slots ?? [] }));
            }
            const params = new URLSearchParams({
                date,
                service_id: String(apt.service_id),
            });
            return fetch(route('employee.appointments.slots', apt.id) + '?' + params.toString(), {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            })
                .then((r) => r.json())
                .then((data) => ({ date, slots: data.slots ?? [] }));
        };

        Promise.all(columnDates.map((date) => fetchSlotsForDate(date)))
            .then((results) => {
                if (gen !== dragSlotFetchGen.current) {
                    return;
                }
                const map = {};
                for (const { date, slots } of results) {
                    map[date] = new Set((slots || []).map((s) => formatTimeHm(s)));
                }
                setSlotSetsByDate(map);
                setSlotSetsLoading(false);
            })
            .catch(() => {
                if (gen !== dragSlotFetchGen.current) {
                    return;
                }
                setSlotSetsByDate(null);
                setSlotSetsLoading(false);
            });
    };

    const handleDragMove = (event) => {
        updateDropPreview(event);
    };

    const handleDragEnd = (event) => {
        setDropPreview(null);
        setDragOrigin(null);
        dragPreviewFallbackRef.current = null;
        resetDragSlotFetch();
        if (readOnly) {
            return;
        }
        const { active, over } = event;
        if (!over || !active.data.current?.appointment) {
            return;
        }
        const preview = computeDropPreviewFromEvent(event, dragLayoutCtx);
        if (!preview) {
            return;
        }
        const apt = active.data.current.appointment;
        const start_time = minutesToTimeHm(preview.startMin);
        onAppointmentMove(apt, { date: preview.dateStr, start_time });
    };

    const handleDragCancel = () => {
        setDropPreview(null);
        setDragOrigin(null);
        dragPreviewFallbackRef.current = null;
        resetDragSlotFetch();
    };

    const dropPreviewVariant = useMemo(() => {
        if (!dropPreview || slotValidationMode === 'none') {
            return 'valid';
        }
        if (calendarDayOffs.includes(dropPreview.dateStr)) {
            return 'valid';
        }
        if (rangeOverlapsAnyBreak(dropPreview.startMin, dropPreview.endMin, calendarDayBreaks[dropPreview.dateStr] ?? [])) {
            return 'valid';
        }
        if (slotSetsLoading) {
            return 'loading';
        }
        if (!slotSetsByDate) {
            return 'valid';
        }
        const key = minutesToTimeHm(dropPreview.startMin);
        const allowed = slotSetsByDate[dropPreview.dateStr];
        if (!allowed) {
            return 'valid';
        }
        return allowed.has(key) ? 'valid' : 'invalid';
    }, [dropPreview, slotValidationMode, slotSetsLoading, slotSetsByDate, calendarDayOffs, calendarDayBreaks]);

    const nowLinePct = useMemo(() => {
        if (!columnDates.includes(todayStr)) {
            return null;
        }
        const now = new Date();
        const m = now.getHours() * 60 + now.getMinutes();
        if (m < rangeStartMin || m >= rangeEndMin) {
            return null;
        }
        return ((m - rangeStartMin) / minutesInView) * 100;
    }, [columnDates, todayStr, minutesInView, rangeStartMin, rangeEndMin, nowTick]);

    const droppableHoverOutlineOnly = Boolean(dragOverlaySpec && slotSetsByDate);

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="flex w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm ring-1 ring-slate-100">
                <div
                    className="flex w-9 shrink-0 flex-col border-r border-slate-100 bg-slate-50/50 pt-[56px] sm:w-12 sm:pt-[68px]"
                    style={{ minHeight: gridWithHeaderMinHeight }}
                >
                    <div className="flex flex-col" style={{ height: gridMinHeight, width: '100%' }}>
                        {segments.map((seg) => (
                            <div
                                key={`${seg.startMin}-${seg.endMin}`}
                                className="flex min-h-0 shrink-0 items-start justify-end pr-1 text-[9px] font-medium tabular-nums text-slate-400 sm:pr-2 sm:text-[11px]"
                                style={{ flex: `${seg.minutes} 1 0` }}
                            >
                                {minutesToTimeHm(seg.startMin)}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex w-full min-w-0" style={{ minHeight: gridWithHeaderMinHeight }}>
                        {columnDates.map((dateStr) => {
                            const [y, mo, da] = dateStr.split('-').map(Number);
                            const dateObj = new Date(y, mo - 1, da);
                            const isToday = dateStr === todayStr;
                            const dayApts = appointmentsByDay.get(dateStr) || [];

                            const forLayout = dayApts.map((apt) => ({
                                id: apt.id,
                                apt,
                                startMin: timeToMinutes(apt.start_time),
                                endMin: timeToMinutes(apt.end_time),
                            }));
                            const laid = layoutOverlapping(forLayout);
                            const originLayoutItem =
                                dragOrigin && dateStr === dragOrigin.dateStr
                                    ? laid.find((x) => x.id === dragOrigin.aptId)
                                    : null;

                            return (
                                <DayColumn
                                    key={dateStr}
                                    dateStr={dateStr}
                                    dateObj={dateObj}
                                    isToday={isToday}
                                    setGridBodyRef={setGridBodyRef}
                                    segments={segments}
                                    gridMinHeight={gridMinHeight}
                                    breaks={calendarDayBreaks[dateStr] ?? []}
                                    isDayOff={calendarDayOffs.includes(dateStr)}
                                    rangeStartMin={rangeStartMin}
                                    rangeEndMin={rangeEndMin}
                                    minutesInView={minutesInView}
                                    droppableHoverOutlineOnly={droppableHoverOutlineOnly}
                                >
                                    <div className="pointer-events-none absolute inset-0">
                                        {nowLinePct != null && isToday && (
                                            <div
                                                className="absolute right-0 left-0 z-20 border-t-2 border-red-500"
                                                style={{ top: `${nowLinePct}%` }}
                                            />
                                        )}
                                    </div>
                                    <div className="relative h-full w-full" style={{ minHeight: gridMinHeight }}>
                                        {dragOverlaySpec &&
                                            slotSetsByDate?.[dateStr] &&
                                            !calendarDayOffs.includes(dateStr) && (
                                                <UnavailableSlotBands
                                                    allowedSet={slotSetsByDate[dateStr]}
                                                    rangeStartMin={rangeStartMin}
                                                    rangeEndMin={rangeEndMin}
                                                    minutesInView={minutesInView}
                                                    durationMin={dragOverlaySpec.durationMin}
                                                    snapMin={dragOverlaySpec.snapMin}
                                                    breaks={calendarDayBreaks[dateStr] ?? []}
                                                />
                                            )}
                                        {originLayoutItem && (
                                            <DragOriginGhost
                                                apt={originLayoutItem.apt}
                                                layout={originLayoutItem}
                                                rangeStartMin={rangeStartMin}
                                                minutesInView={minutesInView}
                                                startMin={dragOrigin.startMin}
                                                endMin={dragOrigin.endMin}
                                                employeeColorMap={employeeColorMap}
                                            />
                                        )}
                                        <DropSlotPreview
                                            dateStr={dateStr}
                                            dropPreview={dropPreview}
                                            rangeStartMin={rangeStartMin}
                                            minutesInView={minutesInView}
                                            variant={dropPreviewVariant}
                                        />
                                        {laid.map((item) => (
                                            <DraggableEvent
                                                key={item.id}
                                                apt={item.apt}
                                                layout={item}
                                                rangeStartMin={rangeStartMin}
                                                minutesInView={minutesInView}
                                                dayDateStr={dateStr}
                                                employeeColorMap={employeeColorMap}
                                                onOpen={onEventClick}
                                                readOnly={readOnly}
                                                disabled={dragSavingId === item.apt.id}
                                                gridLineMinutes={gridLineMinutes}
                                            />
                                        ))}
                                    </div>
                                </DayColumn>
                            );
                        })}
                    </div>
                </div>
            </div>
        </DndContext>
    );
}
