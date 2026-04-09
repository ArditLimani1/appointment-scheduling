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
import { appointmentStatusValue, minutesToTimeHm, timeToMinutes } from '@/utils/appointmentDate';

const START_HOUR = 8;
const END_HOUR = 20;
const SNAP_MINUTES = 15;
/** Total scrollable grid height; divided across (END_HOUR - START_HOUR) hour rows (~130px/hour so 15min slots stay readable). */
const GRID_MIN_HEIGHT = 1560;
/** Rounded up using the taller (sm) day header so the time ruler stays aligned at all breakpoints. */
const GRID_WITH_HEADER_MIN_HEIGHT = GRID_MIN_HEIGHT + 68;

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

function DraggableEvent({ apt, layout, rangeStartMin, minutesInView, dayDateStr, onOpen, disabled, readOnly, employeeColorMap }) {
    const id = `appt-${apt.id}`;
    const startMin = timeToMinutes(apt.start_time);
    const endMin = timeToMinutes(apt.end_time);
    const topPct = ((startMin - rangeStartMin) / minutesInView) * 100;
    const heightPct = ((endMin - startMin) / minutesInView) * 100;

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id,
        disabled: readOnly || disabled,
        data: {
            type: 'appointment',
            appointment: apt,
            startMin,
            dayDateStr,
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
            {...(readOnly ? {} : listeners)}
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

function DayColumn({ dateStr, dateObj, isToday, children, setGridBodyRef }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `calendar-day-${dateStr}`,
        data: { type: 'day', date: dateStr },
    });

    const hours = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
        hours.push(h);
    }

    const combinedRef = (el) => {
        setNodeRef(el);
        setGridBodyRef(dateStr, el);
    };

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
                className={`relative flex-1 ${isOver ? 'bg-sky-50/20' : 'bg-white'}`}
                style={{ minHeight: GRID_MIN_HEIGHT }}
            >
                <div className="pointer-events-none absolute inset-0 flex flex-col">
                    {hours.map((h) => (
                        <div key={h} className="flex-1 border-b border-slate-100/90" style={{ flex: '1 1 0' }} />
                    ))}
                </div>
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
}) {
    const rangeStartMin = START_HOUR * 60;
    const rangeEndMin = END_HOUR * 60;
    const minutesInView = rangeEndMin - rangeStartMin;

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

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
    );

    const handleDragEnd = (event) => {
        if (readOnly) {
            return;
        }
        const { active, over, delta } = event;
        if (!over || !active.data.current?.appointment) {
            return;
        }
        const apt = active.data.current.appointment;
        const startMin = active.data.current.startMin;
        const targetDate = over.data.current?.date;
        if (!targetDate || typeof targetDate !== 'string') {
            return;
        }

        const gridEl = gridBodyRefs.current[targetDate];
        const h = gridEl?.offsetHeight || GRID_MIN_HEIGHT;
        const pxPerMinute = h / minutesInView;

        let newStartMin = startMin + delta.y / pxPerMinute;
        newStartMin = Math.round(newStartMin / SNAP_MINUTES) * SNAP_MINUTES;

        const duration = Math.max(5, timeToMinutes(apt.end_time) - timeToMinutes(apt.start_time));
        newStartMin = Math.max(rangeStartMin, Math.min(newStartMin, rangeEndMin - duration));

        const start_time = minutesToTimeHm(newStartMin);
        onAppointmentMove(apt, { date: targetDate, start_time });
    };

    const nowLinePct = useMemo(() => {
        if (!columnDates.includes(todayStr)) {
            return null;
        }
        const now = new Date();
        const m = now.getHours() * 60 + now.getMinutes();
        if (m < rangeStartMin || m > rangeEndMin) {
            return null;
        }
        return ((m - rangeStartMin) / minutesInView) * 100;
    }, [columnDates, todayStr, minutesInView, rangeStartMin, rangeEndMin, nowTick]);

    const hourRows = useMemo(
        () => Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i),
        [],
    );

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm ring-1 ring-slate-100">
                <div
                    className="w-9 shrink-0 border-r border-slate-100 bg-slate-50/50 pt-[56px] sm:w-12 sm:pt-[68px]"
                    style={{ minHeight: GRID_WITH_HEADER_MIN_HEIGHT }}
                >
                    {hourRows.map((h) => (
                        <div
                            key={h}
                            className="flex items-start justify-end pr-1 text-[9px] font-medium tabular-nums text-slate-400 sm:pr-2 sm:text-[11px]"
                            style={{ height: GRID_MIN_HEIGHT / hourRows.length }}
                        >
                            {String(h).padStart(2, '0')}:00
                        </div>
                    ))}
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex w-full min-w-0" style={{ minHeight: GRID_WITH_HEADER_MIN_HEIGHT }}>
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

                            return (
                                <DayColumn
                                    key={dateStr}
                                    dateStr={dateStr}
                                    dateObj={dateObj}
                                    isToday={isToday}
                                    setGridBodyRef={setGridBodyRef}
                                >
                                    <div className="pointer-events-none absolute inset-0">
                                        {nowLinePct != null && isToday && (
                                            <div
                                                className="absolute right-0 left-0 z-20 border-t-2 border-red-500"
                                                style={{ top: `${nowLinePct}%` }}
                                            />
                                        )}
                                    </div>
                                    <div className="relative h-full w-full" style={{ minHeight: GRID_MIN_HEIGHT }}>
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
