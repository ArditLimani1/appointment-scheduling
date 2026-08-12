import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import Icon from '@/Components/Icon';
import TimeSelect from '@/Components/TimeSelect';
import useLockBodyScroll from '@/hooks/useLockBodyScroll';
import { useT } from '@/i18n/useT';
import { appointmentStatusValue, formatAppointmentDate, formatTimeHm, patchSqMonthName, sqWeekdayName } from '@/utils/appointmentDate';

const DAY_OFF_MODAL_STATUS_BG = {
    pending: 'bg-surface-container-highest text-on-surface-variant',
    confirmed: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
    cancelled: 'bg-error-container text-on-error-container',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toYMD(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function toWeekMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
}

function shiftWeek(ymd, weeks) {
    const d = new Date(ymd + 'T00:00:00');
    d.setDate(d.getDate() + weeks * 7);
    return toYMD(toWeekMonday(d));
}

function formatWeekRange(dateFrom, dateTo, locale) {
    const isSq = String(locale || '').toLowerCase().startsWith('sq');
    const monthStyle = isSq ? 'long' : 'short';
    const opts = { month: monthStyle, day: 'numeric' };
    const from = new Date(dateFrom + 'T00:00:00');
    const to = new Date(dateTo + 'T00:00:00');
    let fromStr = from.toLocaleDateString(locale, opts);
    let toStr = to.toLocaleDateString(locale, { ...opts, year: 'numeric' });
    if (isSq) {
        fromStr = patchSqMonthName(fromStr, from, monthStyle);
        toStr = patchSqMonthName(toStr, to, monthStyle);
    }
    return `${fromStr} – ${toStr}`;
}

function formatDayHeader(dateStr, dayLabel, locale) {
    const isSq = String(locale || '').toLowerCase().startsWith('sq');
    const date = new Date(`${dateStr}T12:00:00`);
    const weekdayPart = isSq
        ? sqWeekdayName(date, 'long')
        : (dayLabel || formatAppointmentDate(dateStr, { weekday: 'long' }, locale));
    const datePart = formatAppointmentDate(dateStr, { day: 'numeric', month: 'long' }, locale);
    return `${weekdayPart}, ${datePart}`;
}

function isEndAfterStart(start, end) {
    if (!start || !end) return false;
    return String(end) > String(start);
}

/** "09:30" → "9:30" for compact break display (read-only). */
function formatTimeShort(hm) {
    if (!hm || typeof hm !== 'string') return '';
    const [hs, ms] = hm.split(':');
    const h = parseInt(hs, 10);
    const m = (ms ?? '00').slice(0, 2).padStart(2, '0');
    if (Number.isNaN(h)) return hm;
    return `${h}:${m}`;
}

// ─── Add Break Modal ──────────────────────────────────────────────────────────

function AddBreakModal({ dayLabel, onSave, onClose }) {
    const t = useT();
    useLockBodyScroll(true);
    const [form, setForm] = useState({ start_time: '12:00', end_time: '13:00' });
    const [error, setError] = useState('');
    useEffect(() => {
        setForm({ start_time: '12:00', end_time: '13:00' });
        setError('');
    }, [dayLabel]);


    const inputClass = 'rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-surface-tint';

    const handleSave = () => {
        if (form.start_time >= form.end_time) {
            setError(t('employee.schedule.end_after_start'));
            return;
        }
        onSave(form);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h3 className="font-headline text-lg font-bold text-on-surface">{t('employee.schedule.add_break_title')}</h3>
                        <p className="text-xs text-on-surface-variant mt-0.5">{dayLabel}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                        <Icon name="close" size="text-xl" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-on-surface-variant">{t('employee.schedule.start_time')}</label>
                            <TimeSelect
                                value={form.start_time}
                                onChange={(next) => {
                                    setForm((f) => ({ ...f, start_time: next }));
                                    setError('');
                                }}
                                className={`w-full ${inputClass}`}
                                ariaLabel={t('employee.schedule.start_time')}
                            />
                        </div>
                        <span className="mt-5 text-on-surface-variant">–</span>
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-on-surface-variant">{t('employee.schedule.end_time')}</label>
                            <TimeSelect
                                value={form.end_time}
                                onChange={(next) => {
                                    setForm((f) => ({ ...f, end_time: next }));
                                    setError('');
                                }}
                                className={`w-full ${inputClass}`}
                                ariaLabel={t('employee.schedule.end_time')}
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-xs text-error font-medium">{error}</p>
                    )}
                </div>

                <div className="mt-6 flex items-center gap-3 justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                        {t('employee.schedule.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="primary-gradient rounded-xl px-5 py-2 text-sm font-semibold text-white shadow"
                    >
                        {t('employee.schedule.save_break')}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Day off (has appointments) ─────────────────────────────────────────────

function DayOffBlockingModal({ dayLabel, appointments, onConfirm, onClose }) {
    const t = useT();
    useLockBodyScroll(true);
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-2xl">
                <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container">
                        <Icon name="event_busy" size="text-lg" className="text-on-secondary-container" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-headline text-lg font-bold text-on-surface">{t('employee.schedule.day_off_blocking_title')}</h3>
                        <p className="mt-0.5 text-xs font-medium text-on-surface-variant">{dayLabel}</p>
                        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{t('employee.schedule.day_off_blocking_intro')}</p>
                        <p className="mt-2 text-sm font-semibold text-error">{t('employee.schedule.day_off_blocking_auto_cancel')}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container transition-colors"
                        aria-label={t('employee.schedule.cancel')}
                    >
                        <Icon name="close" size="text-xl" />
                    </button>
                </div>

                <ul className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-outline-variant/30 bg-surface-container-low/50 p-3">
                    {appointments.map((apt) => {
                        const st = appointmentStatusValue(apt.status);
                        const bg = DAY_OFF_MODAL_STATUS_BG[st] || DAY_OFF_MODAL_STATUS_BG.pending;
                        return (
                            <li
                                key={apt.id}
                                className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2.5 text-sm shadow-sm"
                            >
                                <p className="font-semibold text-on-surface">{apt.client_name || '—'}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-on-surface-variant">
                                    <span className="font-medium text-outline">{t('employee.schedule.day_off_blocking_th_time')}:</span>
                                    <span className="tabular-nums font-medium text-on-surface">{formatTimeHm(apt.start_time)}</span>
                                    <span className="text-outline">·</span>
                                    <span className="min-w-0">
                                        <span className="font-medium text-outline">{t('employee.schedule.day_off_blocking_th_service')}: </span>
                                        {apt.service_name || '—'}
                                    </span>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${bg}`}>
                                        {t(`common.status.${st}`)}
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>

                <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                        {t('employee.schedule.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-xl bg-on-surface px-5 py-2.5 text-sm font-bold text-surface shadow-sm transition-opacity hover:opacity-90"
                    >
                        {t('employee.schedule.day_off_blocking_confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ValidationNoticeModal({ message, onClose }) {
    const t = useT();
    useLockBodyScroll(true);
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                        <Icon name="error" size="text-lg" className="text-red-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-headline text-lg font-bold text-on-surface">{t('employee.schedule.invalid_time_title')}</h3>
                        <p className="mt-1 text-sm text-on-surface-variant">{t('employee.schedule.invalid_time_intro')}</p>
                        <p className="mt-2 text-sm font-semibold text-error">{message}</p>
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl bg-on-surface px-5 py-2.5 text-sm font-bold text-surface transition-opacity hover:opacity-90"
                    >
                        {t('common.actions.close')}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Day Card ─────────────────────────────────────────────────────────────────

function DayCard({ day, locale, dayError, onToggle, onUpdateDay, onUpdateBreak, onOpenBreakModal, onRemoveBreak }) {
    const t = useT();
    const inputClass = 'w-full rounded-xl border-0 bg-surface-container-low px-3 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-surface-tint md:w-auto md:py-2';

    const shellClass =
        day.is_active
            ? 'border-outline-variant bg-surface-container-lowest'
            : 'border-outline-variant/50 bg-surface-container-low opacity-60';

    return (
        <div className={`rounded-2xl border p-4 shadow-sm transition-all md:rounded-3xl md:px-5 md:py-4 ${shellClass}`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
                <div className="flex min-w-0 items-center gap-3 md:w-[210px] md:shrink-0">
                    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                        <input
                            type="checkbox"
                            checked={day.is_active}
                            onChange={(e) => onToggle(day.date, e.target.checked)}
                            className="peer sr-only"
                        />
                        <div className="peer relative h-6 w-11 shrink-0 rounded-full bg-surface-container-high after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all after:content-[''] peer-checked:bg-black peer-checked:after:translate-x-full" />
                    </label>
                    <div className="min-w-0 flex-1">
                        <p className={`font-headline text-sm font-bold leading-tight ${day.is_active ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                            {formatDayHeader(day.date, day.day_label, locale)}
                        </p>
                        {!day.is_active && (
                            <p className="mt-0.5 text-xs text-on-surface-variant">{t('employee.schedule.day_off')}</p>
                        )}
                    </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-3 border-t border-outline-variant/25 pt-4 md:border-t-0 md:pt-0 md:items-center">
                    {day.is_active && (
                        <div className="grid w-full grid-cols-2 gap-3 md:flex md:flex-wrap md:justify-center md:gap-2">
                            <div className="min-w-0">
                                <label className="mb-1 block text-xs text-on-surface-variant">{t('employee.schedule.from')}</label>
                                <TimeSelect
                                    value={day.start_time}
                                    onChange={(next) => onUpdateDay(day.date, { start_time: next })}
                                    className={inputClass}
                                    ariaLabel={t('employee.schedule.from')}
                                />
                            </div>
                            <div className="min-w-0">
                                <label className="mb-1 block text-xs text-on-surface-variant">{t('employee.schedule.to')}</label>
                                <TimeSelect
                                    value={day.end_time}
                                    onChange={(next) => onUpdateDay(day.date, { end_time: next })}
                                    className={inputClass}
                                    ariaLabel={t('employee.schedule.to')}
                                />
                            </div>
                        </div>
                    )}

                    {day.is_active && (day.breaks ?? []).length > 0 && (
                        <div className="flex w-full flex-col gap-2 md:w-auto md:max-w-[560px] md:items-center">
                            {day.breaks.map((brk, bi) => (
                                <div
                                    key={bi}
                                    className="flex w-full items-center gap-2 rounded-xl border border-outline-variant/25 bg-surface-container-low/50 px-2 py-1.5 md:w-auto"
                                >
                                    <div className="flex shrink-0 items-center gap-1.5 px-1 text-on-surface-variant">
                                        <Icon name="free_breakfast" size="text-sm" />
                                        <span className="whitespace-nowrap text-xs font-semibold">{t('employee.schedule.break')}</span>
                                    </div>
                                    <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
                                        <TimeSelect
                                            value={brk.start_time}
                                            onChange={(next) => onUpdateBreak(day.date, bi, { start_time: next })}
                                            className={inputClass}
                                            ariaLabel={t('employee.schedule.break_from')}
                                        />
                                        <TimeSelect
                                            value={brk.end_time}
                                            onChange={(next) => onUpdateBreak(day.date, bi, { end_time: next })}
                                            className={inputClass}
                                            ariaLabel={t('employee.schedule.break_to')}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveBreak(day.date, bi)}
                                        className="shrink-0 rounded-xl bg-surface-container p-2 text-on-surface transition-colors hover:bg-surface-container-high"
                                        aria-label={t('employee.schedule.remove_break')}
                                    >
                                        <Icon name="delete" size="text-sm" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t border-outline-variant/25 pt-3 md:w-[140px] md:shrink-0 md:border-t-0 md:pt-0 md:flex md:justify-end">
                    {day.is_active && (
                        <button
                            type="button"
                            onClick={() => onOpenBreakModal(day.date)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant px-4 py-2.5 text-xs font-bold text-on-surface-variant transition-colors hover:bg-surface-container md:w-auto md:py-2"
                        >
                            <Icon name="add" size="text-sm" /> {t('employee.schedule.add_break')}
                        </button>
                    )}
                </div>
            </div>
            {dayError ? (
                <p className="mt-2 text-xs font-semibold text-error">{dayError}</p>
            ) : null}
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Index({ days: initialDays, dateFrom, dateTo }) {
    const t = useT();
    const { localeBcp47, days: pageDaysProp } = usePage().props;
    const dateLocale = localeBcp47 ?? 'en-GB';

    const [days, setDays] = useState(initialDays);
    const [breakModalDate, setBreakModalDate] = useState(null); // date string of the day being edited
    const [dayOffModal, setDayOffModal] = useState(null); // { date, dayLabel, appointments }
    const [dayErrors, setDayErrors] = useState({});
    const [validationModalMessage, setValidationModalMessage] = useState('');

    useEffect(() => { setDays(initialDays); }, [initialDays]);

    // ── Navigation ────────────────────────────────────────────────────────

    const navigate = useCallback((newFrom) => {
        router.get(route('employee.schedule.index'), { date_from: newFrom }, {
            preserveState: false,
            preserveScroll: false,
        });
    }, []);

    const prevWeek = () => navigate(shiftWeek(dateFrom, -1));
    const nextWeek = () => navigate(shiftWeek(dateFrom, 1));
    const prevMonth = () => navigate(shiftWeek(dateFrom, -4));
    const nextMonth = () => navigate(shiftWeek(dateFrom, 4));

    // ── Auto-save ─────────────────────────────────────────────────────────

    const autoSave = useCallback((updatedDays, successContext) => {
        setDays(updatedDays);
        router.put(
            route('employee.schedule.overrides.update'),
            { days: updatedDays, success_context: successContext },
            {
                preserveScroll: true,
                // Reload props from server so each day keeps `appointments` (needed for day-off warnings).
                preserveState: false,
            }
        );
    }, []);

    // ── Toggle day ────────────────────────────────────────────────────────

    const handleToggle = useCallback((date, isActive) => {
        if (!isActive) {
            // Prefer server `days` (includes `appointments`); local state can lag after autosaves.
            const pageDays = Array.isArray(pageDaysProp) ? pageDaysProp : [];
            const pageDay = pageDays.find((d) => d.date === date);
            const localDay = days.find((d) => d.date === date);
            const day = pageDay ?? localDay;
            const raw = pageDay?.appointments ?? localDay?.appointments ?? [];
            const blocking = raw.filter((a) => appointmentStatusValue(a.status) !== 'cancelled');
            if (blocking.length > 0) {
                const dayLabel = day ? formatDayHeader(day.date, day.day_label, dateLocale) : date;
                setDayOffModal({ date, dayLabel, appointments: blocking });
                return;
            }
        }
        const updated = days.map((d) =>
            (d.date === date ? { ...d, is_active: isActive, is_overridden: true } : d),
        );
        autoSave(updated, isActive ? 'day_on' : 'day_off');
    }, [days, pageDaysProp, autoSave, dateLocale]);

    const confirmDayOffDespiteAppointments = useCallback(() => {
        if (!dayOffModal) return;
        const { date } = dayOffModal;
        const updated = days.map((d) =>
            (d.date === date ? { ...d, is_active: false, is_overridden: true } : d),
        );
        setDayOffModal(null);
        autoSave(updated, 'day_off');
    }, [dayOffModal, days, autoSave]);

    const handleUpdateDay = useCallback((date, patch) => {
        const updated = days.map((d) =>
            (d.date === date ? { ...d, ...patch, is_overridden: true } : d),
        );
        const target = updated.find((d) => d.date === date);
        if (target && !isEndAfterStart(target.start_time, target.end_time)) {
            const message = t('employee.schedule.end_after_start');
            setDayErrors((prev) => ({ ...prev, [date]: message }));
            setValidationModalMessage(message);
            return;
        }
        setDayErrors((prev) => {
            const next = { ...prev };
            delete next[date];
            return next;
        });
        autoSave(updated, 'day_time_updated');
    }, [days, autoSave, t]);

    // ── Add break (via modal) ─────────────────────────────────────────────

    const handleSaveBreak = useCallback((brk) => {
        if (!breakModalDate) return;
        const updated = days.map((d) =>
            (d.date === breakModalDate
                ? {
                    ...d,
                    breaks: [...(d.breaks ?? []), brk],
                    is_overridden: true,
                }
                : d),
        );
        setBreakModalDate(null);
        autoSave(updated, 'break_added');
    }, [days, breakModalDate, autoSave]);

    const handleUpdateBreak = useCallback((date, breakIndex, patch) => {
        const updated = days.map((d) => {
            if (d.date !== date) return d;
            const breaks = (d.breaks ?? []).map((existing, i) => (i === breakIndex ? { ...existing, ...patch } : existing));
            return { ...d, breaks, is_overridden: true };
        });
        const target = updated.find((d) => d.date === date);
        const invalidBreak = (target?.breaks ?? []).some((b) => !isEndAfterStart(b.start_time, b.end_time));
        if (invalidBreak) {
            const message = t('employee.schedule.break_end_after_start');
            setDayErrors((prev) => ({ ...prev, [date]: message }));
            setValidationModalMessage(message);
            return;
        }
        setDayErrors((prev) => {
            const next = { ...prev };
            delete next[date];
            return next;
        });
        autoSave(updated, 'break_updated');
    }, [days, autoSave, t]);


    // ── Remove break ──────────────────────────────────────────────────────

    const handleRemoveBreak = useCallback((date, breakIndex) => {
        const updated = days.map((d) =>
            (d.date === date
                ? { ...d, breaks: d.breaks.filter((_, i) => i !== breakIndex), is_overridden: true }
                : d),
        );
        autoSave(updated, 'break_removed');
    }, [days, autoSave]);

    // ─────────────────────────────────────────────────────────────────────

    const breakModalDay = breakModalDate ? days.find((d) => d.date === breakModalDate) : null;

    return (
        <EmployeeLayout>
            <Head title={t('employee.schedule.head_title')} />

            <div className="mb-6">
                <h1 className="text-3xl font-black font-headline tracking-tight text-on-surface">{t('employee.schedule.availability')}</h1>
                <p className="mt-1 text-sm text-on-surface-variant">
                    {t('employee.schedule.availability_sub')}
                </p>
            </div>

            {/* ── Week navigation bar ───────────────────────────────── */}
            <div className="mb-6 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-3 sm:p-4">
                <div className="flex flex-col gap-3 md:hidden">
                    <p className="text-center text-sm font-bold text-on-surface">{formatWeekRange(dateFrom, dateTo, dateLocale)}</p>
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1">
                            <button type="button" onClick={prevMonth} className="flex items-center gap-1 rounded-xl border border-outline-variant px-2.5 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container" title={t('employee.schedule.previous_month')}>
                                <Icon name="keyboard_double_arrow_left" size="text-sm" /> {t('employee.schedule.month')}
                            </button>
                            <button type="button" onClick={prevWeek} className="flex items-center gap-1 rounded-xl border border-outline-variant px-2.5 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container" title={t('employee.schedule.previous_week')}>
                                <Icon name="chevron_left" size="text-sm" /> {t('employee.schedule.week')}
                            </button>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-1">
                            <button type="button" onClick={nextWeek} className="flex items-center gap-1 rounded-xl border border-outline-variant px-2.5 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container" title={t('employee.schedule.next_week')}>
                                {t('employee.schedule.week')} <Icon name="chevron_right" size="text-sm" />
                            </button>
                            <button type="button" onClick={nextMonth} className="flex items-center gap-1 rounded-xl border border-outline-variant px-2.5 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container" title={t('employee.schedule.next_month')}>
                                {t('employee.schedule.month')} <Icon name="keyboard_double_arrow_right" size="text-sm" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="hidden items-center gap-3 md:flex">
                    <div className="flex items-center gap-1">
                        <button type="button" onClick={prevMonth} className="flex items-center gap-1 rounded-xl border border-outline-variant px-3 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container" title={t('employee.schedule.previous_month')}>
                            <Icon name="keyboard_double_arrow_left" size="text-sm" /> {t('employee.schedule.month')}
                        </button>
                        <button type="button" onClick={prevWeek} className="flex items-center gap-1 rounded-xl border border-outline-variant px-3 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container" title={t('employee.schedule.previous_week')}>
                            <Icon name="chevron_left" size="text-sm" /> {t('employee.schedule.week')}
                        </button>
                    </div>

                    <div className="flex-1 text-center">
                        <p className="text-sm font-bold text-on-surface">{formatWeekRange(dateFrom, dateTo, dateLocale)}</p>
                    </div>

                    <div className="flex items-center gap-1">
                        <button type="button" onClick={nextWeek} className="flex items-center gap-1 rounded-xl border border-outline-variant px-3 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container" title={t('employee.schedule.next_week')}>
                            {t('employee.schedule.week')} <Icon name="chevron_right" size="text-sm" />
                        </button>
                        <button type="button" onClick={nextMonth} className="flex items-center gap-1 rounded-xl border border-outline-variant px-3 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container" title={t('employee.schedule.next_month')}>
                            {t('employee.schedule.month')} <Icon name="keyboard_double_arrow_right" size="text-sm" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Day cards ─────────────────────────────────────────── */}
            <div className="space-y-3">
                {days.map((day) => (
                    <DayCard
                        key={day.date}
                        day={day}
                        locale={dateLocale}
                        dayError={dayErrors[day.date]}
                        onToggle={handleToggle}
                        onUpdateDay={handleUpdateDay}
                        onUpdateBreak={handleUpdateBreak}
                        onOpenBreakModal={(date) => {
                            setBreakModalDate(date);
                        }}
                        onRemoveBreak={handleRemoveBreak}
                    />
                ))}
            </div>

            {/* ── Add Break Modal ───────────────────────────────────── */}
            {breakModalDay && (
                <AddBreakModal
                    dayLabel={formatDayHeader(breakModalDay.date, breakModalDay.day_label, dateLocale)}
                    onSave={handleSaveBreak}
                    onClose={() => {
                        setBreakModalDate(null);
                    }}
                />
            )}

            {dayOffModal ? (
                <DayOffBlockingModal
                    dayLabel={dayOffModal.dayLabel}
                    appointments={dayOffModal.appointments}
                    onConfirm={confirmDayOffDespiteAppointments}
                    onClose={() => setDayOffModal(null)}
                />
            ) : null}
            {validationModalMessage ? (
                <ValidationNoticeModal
                    message={validationModalMessage}
                    onClose={() => setValidationModalMessage('')}
                />
            ) : null}

        </EmployeeLayout>
    );
}
