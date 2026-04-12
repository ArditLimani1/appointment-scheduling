import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import Icon from '@/Components/Icon';

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

function formatWeekRange(dateFrom, dateTo) {
    const opts = { month: 'short', day: 'numeric' };
    const from = new Date(dateFrom + 'T00:00:00');
    const to   = new Date(dateTo   + 'T00:00:00');
    return `${from.toLocaleDateString('en-GB', opts)} – ${to.toLocaleDateString('en-GB', { ...opts, year: 'numeric' })}`;
}

function formatDayHeader(dateStr, dayLabel) {
    const d = new Date(dateStr + 'T00:00:00');
    return `${dayLabel}, ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }) {
    useEffect(() => {
        const t = setTimeout(onDismiss, 3000);
        return () => clearTimeout(t);
    }, [onDismiss]);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-on-surface px-5 py-3 text-sm font-semibold text-surface shadow-xl">
            <Icon name="check_circle" size="text-lg" filled />
            {message}
        </div>
    );
}

// ─── Add Break Modal ──────────────────────────────────────────────────────────

function AddBreakModal({ dayLabel, onSave, onClose }) {
    const [form, setForm] = useState({ start_time: '12:00', end_time: '13:00' });
    const [error, setError] = useState('');

    const inputClass = 'rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-surface-tint';

    const handleSave = () => {
        if (form.start_time >= form.end_time) {
            setError('End time must be after start time.');
            return;
        }
        onSave(form);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h3 className="font-headline text-lg font-bold text-on-surface">Add Break</h3>
                        <p className="text-xs text-on-surface-variant mt-0.5">{dayLabel}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                        <Icon name="close" size="text-xl" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-on-surface-variant">Start time</label>
                            <input
                                type="time"
                                value={form.start_time}
                                onChange={e => { setForm(f => ({ ...f, start_time: e.target.value })); setError(''); }}
                                className={`w-full ${inputClass}`}
                            />
                        </div>
                        <span className="mt-5 text-on-surface-variant">–</span>
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-on-surface-variant">End time</label>
                            <input
                                type="time"
                                value={form.end_time}
                                onChange={e => { setForm(f => ({ ...f, end_time: e.target.value })); setError(''); }}
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
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="primary-gradient rounded-xl px-5 py-2 text-sm font-semibold text-white shadow"
                    >
                        Save Break
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Day Card ─────────────────────────────────────────────────────────────────

function DayCard({ day, onToggle, onOpenBreakModal, onRemoveBreak }) {
    const inputClass = 'rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-surface-tint';

    return (
        <div className={`rounded-3xl border px-5 py-4 transition-all ${
            day.is_active
                ? 'bg-surface-container-lowest border-outline-variant'
                : 'bg-surface-container-low border-outline-variant/50 opacity-60'
        }`}>
            <div className="flex items-center gap-4">

                {/* Left: toggle + label */}
                <div className="flex items-center gap-3 w-[210px] shrink-0">
                    <label className="relative inline-flex cursor-pointer items-center">
                        <input
                            type="checkbox"
                            checked={day.is_active}
                            onChange={e => onToggle(day.date, e.target.checked)}
                            className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-surface-container-high after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full" />
                    </label>
                    <div>
                        <p className={`font-bold font-headline text-sm leading-tight ${day.is_active ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                            {formatDayHeader(day.date, day.day_label)}
                        </p>
                        {!day.is_active && (
                            <p className="text-xs text-on-surface-variant mt-0.5">Day off</p>
                        )}
                    </div>
                </div>

                {/* Center: hours + breaks */}
                <div className="flex-1 flex flex-col items-center gap-3">
                    {day.is_active && (
                        <div className="flex items-center gap-2 flex-wrap justify-center">
                            <label className="text-xs text-on-surface-variant">From</label>
                            <input type="time" value={day.start_time} readOnly className={inputClass} />
                            <span className="text-on-surface-variant">–</span>
                            <label className="text-xs text-on-surface-variant">To</label>
                            <input type="time" value={day.end_time} readOnly className={inputClass} />
                        </div>
                    )}

                    {day.is_active && (day.breaks ?? []).length > 0 && (
                        <div className="flex flex-col items-center gap-2 w-full">
                            {day.breaks.map((brk, bi) => (
                                <div key={bi} className="flex items-center gap-2 flex-wrap justify-center">
                                    <Icon name="free_breakfast" size="text-sm" className="text-on-surface-variant" />
                                    <span className="text-xs text-on-surface-variant">Break</span>
                                    <input type="time" value={brk.start_time} readOnly className={inputClass} />
                                    <span className="text-on-surface-variant text-xs">–</span>
                                    <input type="time" value={brk.end_time} readOnly className={inputClass} />
                                    <button
                                        type="button"
                                        onClick={() => onRemoveBreak(day.date, bi)}
                                        className="rounded-xl bg-error-container p-1.5 text-on-error-container hover:opacity-80 transition-opacity"
                                    >
                                        <Icon name="close" size="text-sm" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Add Break */}
                <div className="w-[140px] shrink-0 flex justify-end">
                    {day.is_active && (
                        <button
                            type="button"
                            onClick={() => onOpenBreakModal(day.date)}
                            className="flex items-center gap-1 rounded-xl border border-outline-variant px-3 py-2 text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                        >
                            <Icon name="add" size="text-sm" /> Add Break
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Index({ days: initialDays, dateFrom, dateTo }) {
    const [days, setDays]             = useState(initialDays);
    const [toast, setToast]           = useState(null);
    const [breakModalDate, setBreakModalDate] = useState(null); // date string of the day being edited

    useEffect(() => { setDays(initialDays); }, [dateFrom]);

    // ── Navigation ────────────────────────────────────────────────────────

    const navigate = useCallback((newFrom) => {
        router.get(route('employee.schedule.index'), { date_from: newFrom }, {
            preserveState: false,
            preserveScroll: false,
        });
    }, []);

    const prevWeek  = () => navigate(shiftWeek(dateFrom, -1));
    const nextWeek  = () => navigate(shiftWeek(dateFrom,  1));
    const prevMonth = () => navigate(shiftWeek(dateFrom, -4));
    const nextMonth = () => navigate(shiftWeek(dateFrom,  4));

    // ── Auto-save ─────────────────────────────────────────────────────────

    const showToast = useCallback((msg) => {
        setToast(null);
        // Tiny delay so React re-mounts the Toast (resets its timer)
        setTimeout(() => setToast(msg), 10);
    }, []);

    const autoSave = useCallback((updatedDays, msg) => {
        setDays(updatedDays);
        router.put(
            route('employee.schedule.overrides.update'),
            { days: updatedDays },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => showToast(msg),
            }
        );
    }, [showToast]);

    // ── Toggle day ────────────────────────────────────────────────────────

    const handleToggle = useCallback((date, isActive) => {
        const updated = days.map(d =>
            d.date === date ? { ...d, is_active: isActive, is_overridden: true } : d
        );
        const msg = isActive ? 'Day marked as working.' : 'Day marked as day off.';
        autoSave(updated, msg);
    }, [days, autoSave]);

    // ── Add break (via modal) ─────────────────────────────────────────────

    const handleSaveBreak = useCallback((brk) => {
        const updated = days.map(d =>
            d.date === breakModalDate
                ? { ...d, breaks: [...(d.breaks ?? []), brk], is_overridden: true }
                : d
        );
        setBreakModalDate(null);
        autoSave(updated, 'Break added successfully.');
    }, [days, breakModalDate, autoSave]);

    // ── Remove break ──────────────────────────────────────────────────────

    const handleRemoveBreak = useCallback((date, breakIndex) => {
        const updated = days.map(d =>
            d.date === date
                ? { ...d, breaks: d.breaks.filter((_, i) => i !== breakIndex), is_overridden: true }
                : d
        );
        autoSave(updated, 'Break removed.');
    }, [days, autoSave]);

    // ─────────────────────────────────────────────────────────────────────

    const breakModalDay = breakModalDate ? days.find(d => d.date === breakModalDate) : null;

    return (
        <EmployeeLayout>
            <Head title="My Schedule" />

            <div className="mb-6">
                <h1 className="text-3xl font-black font-headline tracking-tight text-on-surface">Availability</h1>
                <p className="mt-1 text-sm text-on-surface-variant">
                    Toggle days on or off and manage breaks. All changes are saved automatically.
                </p>
            </div>

            {/* ── Week navigation bar ───────────────────────────────── */}
            <div className="mb-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <button onClick={prevMonth} className="flex items-center gap-1 rounded-xl border border-outline-variant px-3 py-2 text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-colors" title="Previous 4 weeks">
                            <Icon name="keyboard_double_arrow_left" size="text-sm" /> Month
                        </button>
                        <button onClick={prevWeek} className="flex items-center gap-1 rounded-xl border border-outline-variant px-3 py-2 text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
                            <Icon name="chevron_left" size="text-sm" /> Week
                        </button>
                    </div>

                    <div className="flex-1 text-center">
                        <p className="text-sm font-bold text-on-surface">{formatWeekRange(dateFrom, dateTo)}</p>
                    </div>

                    <div className="flex items-center gap-1">
                        <button onClick={nextWeek} className="flex items-center gap-1 rounded-xl border border-outline-variant px-3 py-2 text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
                            Week <Icon name="chevron_right" size="text-sm" />
                        </button>
                        <button onClick={nextMonth} className="flex items-center gap-1 rounded-xl border border-outline-variant px-3 py-2 text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-colors" title="Next 4 weeks">
                            Month <Icon name="keyboard_double_arrow_right" size="text-sm" />
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
                        onToggle={handleToggle}
                        onOpenBreakModal={setBreakModalDate}
                        onRemoveBreak={handleRemoveBreak}
                    />
                ))}
            </div>

            {/* ── Add Break Modal ───────────────────────────────────── */}
            {breakModalDay && (
                <AddBreakModal
                    dayLabel={formatDayHeader(breakModalDay.date, breakModalDay.day_label)}
                    onSave={handleSaveBreak}
                    onClose={() => setBreakModalDate(null)}
                />
            )}

            {/* ── Toast ─────────────────────────────────────────────── */}
            {toast && (
                <Toast message={toast} onDismiss={() => setToast(null)} />
            )}
        </EmployeeLayout>
    );
}
