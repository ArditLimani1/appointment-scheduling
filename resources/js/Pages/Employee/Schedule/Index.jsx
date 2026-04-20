import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import Icon from '@/Components/Icon';
import { useT } from '@/i18n/useT';
import { formatAppointmentDate } from '@/utils/appointmentDate';

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
    const opts = { month: 'short', day: 'numeric' };
    const from = new Date(dateFrom + 'T00:00:00');
    const to = new Date(dateTo + 'T00:00:00');
    return `${from.toLocaleDateString(locale, opts)} – ${to.toLocaleDateString(locale, { ...opts, year: 'numeric' })}`;
}

function formatDayHeader(dateStr, dayLabel, locale) {
    const datePart = formatAppointmentDate(dateStr, { day: 'numeric', month: 'long' }, locale);
    return `${dayLabel}, ${datePart}`;
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
    const [form, setForm] = useState({ start_time: '12:00', end_time: '13:00' });
    const [error, setError] = useState('');

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
                            <input
                                type="time"
                                value={form.start_time}
                                onChange={(e) => {
                                    setForm((f) => ({ ...f, start_time: e.target.value }));
                                    setError('');
                                }}
                                className={`w-full ${inputClass}`}
                            />
                        </div>
                        <span className="mt-5 text-on-surface-variant">–</span>
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-on-surface-variant">{t('employee.schedule.end_time')}</label>
                            <input
                                type="time"
                                value={form.end_time}
                                onChange={(e) => {
                                    setForm((f) => ({ ...f, end_time: e.target.value }));
                                    setError('');
                                }}
                                className={`w-full ${inputClass}`}
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

// ─── Day Card ─────────────────────────────────────────────────────────────────

function DayCard({ day, locale, onToggle, onOpenBreakModal, onRemoveBreak }) {
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
                                <input type="time" value={day.start_time} readOnly className={inputClass} />
                            </div>
                            <div className="min-w-0">
                                <label className="mb-1 block text-xs text-on-surface-variant">{t('employee.schedule.to')}</label>
                                <input type="time" value={day.end_time} readOnly className={inputClass} />
                            </div>
                        </div>
                    )}

                    {day.is_active && (day.breaks ?? []).length > 0 && (
                        <div className="flex w-full flex-col gap-2 md:items-center">
                            {day.breaks.map((brk, bi) => (
                                <div
                                    key={bi}
                                    className="flex min-w-0 w-full items-center gap-1 overflow-x-auto rounded-xl border border-outline-variant/40 bg-surface-container-low/90 px-3 py-2.5 md:w-auto md:max-w-full md:flex-nowrap md:items-center md:justify-center md:gap-2 md:overflow-visible md:border-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none"
                                >
                                    {/* Mobile: flex-1 sides center the time; desktop (md): flat row like before */}
                                    <div className="flex min-w-0 flex-1 basis-0 items-center justify-start md:contents">
                                        <div className="flex shrink-0 items-center gap-1.5 text-on-surface-variant">
                                            <Icon name="free_breakfast" size="text-sm" />
                                            <span className="whitespace-nowrap text-xs font-semibold">{t('employee.schedule.break')}</span>
                                        </div>
                                    </div>
                                    <span className="shrink-0 whitespace-nowrap px-1 text-center text-sm font-semibold tabular-nums text-on-surface md:rounded-xl md:border-0 md:bg-surface-container-low md:px-3 md:py-2 md:text-left md:text-on-surface">
                                        {formatTimeShort(brk.start_time)}
                                        <span className="mx-0.5 font-normal text-on-surface-variant">–</span>
                                        {formatTimeShort(brk.end_time)}
                                    </span>
                                    <div className="flex min-w-0 flex-1 basis-0 items-center justify-end md:contents">
                                        <button
                                            type="button"
                                            onClick={() => onRemoveBreak(day.date, bi)}
                                            className="shrink-0 rounded-xl bg-error-container p-2 text-on-error-container transition-opacity hover:opacity-80"
                                            aria-label={t('employee.schedule.remove_break')}
                                        >
                                            <Icon name="close" size="text-sm" />
                                        </button>
                                    </div>
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
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Index({ days: initialDays, dateFrom, dateTo }) {
    const t = useT();
    const { localeBcp47 } = usePage().props;
    const dateLocale = localeBcp47 ?? 'en-GB';

    const [days, setDays] = useState(initialDays);
    const [breakModalDate, setBreakModalDate] = useState(null); // date string of the day being edited

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
                preserveState: true,
            }
        );
    }, []);

    // ── Toggle day ────────────────────────────────────────────────────────

    const handleToggle = useCallback((date, isActive) => {
        const updated = days.map((d) =>
            (d.date === date ? { ...d, is_active: isActive, is_overridden: true } : d),
        );
        autoSave(updated, isActive ? 'day_on' : 'day_off');
    }, [days, autoSave]);

    // ── Add break (via modal) ─────────────────────────────────────────────

    const handleSaveBreak = useCallback((brk) => {
        const updated = days.map((d) =>
            (d.date === breakModalDate
                ? { ...d, breaks: [...(d.breaks ?? []), brk], is_overridden: true }
                : d),
        );
        setBreakModalDate(null);
        autoSave(updated, 'break_added');
    }, [days, breakModalDate, autoSave]);

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
                        onToggle={handleToggle}
                        onOpenBreakModal={setBreakModalDate}
                        onRemoveBreak={handleRemoveBreak}
                    />
                ))}
            </div>

            {/* ── Add Break Modal ───────────────────────────────────── */}
            {breakModalDay && (
                <AddBreakModal
                    dayLabel={formatDayHeader(breakModalDay.date, breakModalDay.day_label, dateLocale)}
                    onSave={handleSaveBreak}
                    onClose={() => setBreakModalDate(null)}
                />
            )}

        </EmployeeLayout>
    );
}
