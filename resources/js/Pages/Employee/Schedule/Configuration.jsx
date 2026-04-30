import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import Icon from '@/Components/Icon';
import TimeInputPicker from '@/Components/TimeInputPicker';
import { useT } from '@/i18n/useT';

/** Next calendar date (including today) that falls on this weekday; `dayOfWeek` 0 = Monday … 6 = Sunday. */
function representativeDateForWeekday(dayOfWeek) {
    const mapDwToJs = [1, 2, 3, 4, 5, 6, 0];
    const wantJs = mapDwToJs[dayOfWeek];
    const d = new Date();
    const js = d.getDay();
    const delta = (wantJs - js + 7) % 7;
    const x = new Date(d);
    x.setDate(d.getDate() + delta);
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, '0');
    const dd = String(x.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

function formatDayHeader(_dateStr, dayLabel, _locale) {
    return dayLabel;
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

// ─── Read-only info field ─────────────────────────────────────────────────────
function ReadOnlyField({ label, value, icon }) {
    return (
        <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">{label}</label>
            <div className="flex items-center gap-2 w-full bg-surface-container-highest border-0 rounded-lg py-3 px-4 text-sm text-on-surface-variant font-medium opacity-70 cursor-not-allowed select-none">
                {icon && <Icon name={icon} size="text-base" className="shrink-0 text-on-surface-variant" />}
                <span className="truncate">{value || '—'}</span>
            </div>
        </div>
    );
}

// ─── Read-only booking URL field (copy only) ─────────────────────────────────
function BookingUrlField({ label, prefix, value }) {
    const t = useT();
    const [copied, setCopied] = useState(false);
    const fullPath = prefix + (value || '');
    const handleCopy = () => {
        navigator.clipboard.writeText(fullPath).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">{label}</label>
            <div className="flex items-center bg-surface-container-highest border-0 rounded-lg overflow-hidden">
                <span className="shrink-0 px-3 py-3 text-xs text-on-surface-variant border-r border-outline-variant/20 bg-surface-container whitespace-nowrap">
                    {prefix}
                </span>
                <span className="flex-1 px-3 py-3 text-sm text-on-surface font-medium truncate">{value || '—'}</span>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0 p-2 mr-1 hover:bg-surface-container rounded-md transition-colors"
                    title={t('employee.schedule.copy_url')}
                >
                    <Icon name={copied ? 'check' : 'content_copy'} size="text-base" className="text-on-surface-variant" />
                </button>
            </div>
        </div>
    );
}

// ─── Confirm save modal (same as Admin Settings) ─────────────────────────────
function ConfirmSaveModal({ onConfirm, onCancel }) {
    const t = useT();
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-amber-100">
                        <Icon name="save" size="text-xl" className="text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-extrabold text-on-surface">{t('employee.schedule.confirm_save_title')}</h2>
                        <p className="mt-1 text-sm text-on-surface-variant">
                            {t('employee.schedule.confirm_save_body')}
                        </p>
                    </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-slate-50 transition-colors"
                    >
                        {t('employee.schedule.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-xl bg-on-surface px-6 py-2.5 text-sm font-bold text-surface hover:opacity-90 transition-opacity"
                    >
                        {t('employee.schedule.yes_save')}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ValidationNoticeModal({ message, onClose }) {
    const t = useT();
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-4">
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

// ─── Editable personal booking URL field ─────────────────────────────────────
function PersonalBookingUrlField({ label, businessSlug, value, onChange, error }) {
    const t = useT();
    const prefix = `/book/${businessSlug}/`;
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(prefix + value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">{label}</label>
            <div className="flex items-center rounded-lg overflow-hidden ring-1 ring-outline-variant bg-surface-container-lowest focus-within:ring-2 focus-within:ring-on-surface/20 transition-shadow">
                <span className="shrink-0 px-3 py-3 text-xs text-on-surface-variant border-r border-outline-variant/30 bg-surface-container whitespace-nowrap">
                    {prefix}
                </span>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-'))}
                    className="flex-1 px-3 py-3 text-sm text-on-surface font-medium bg-transparent border-0 focus:outline-none focus:ring-0 min-w-0"
                    placeholder={t('employee.schedule.your_name_ph')}
                    spellCheck={false}
                />
                <button
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0 p-2 mr-1 hover:bg-surface-container rounded-md transition-colors"
                    title={t('employee.schedule.copy_url')}
                >
                    <Icon name={copied ? 'check' : 'content_copy'} size="text-base" className="text-on-surface-variant" />
                </button>
            </div>
            {error && <p className="mt-1.5 text-sm font-medium text-error">{error}</p>}
        </div>
    );
}

// ─── Add Break Modal (same as Schedule / Availability view) ──────────────────
function AddBreakModal({ dayLabel, onSave, onClose }) {
    const t = useT();
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
                            <TimeInputPicker
                                value={form.start_time}
                                onChange={(next) => { setForm((f) => ({ ...f, start_time: next })); setError(''); }}
                                className={`w-full ${inputClass}`}
                                ariaLabel={t('employee.schedule.start_time')}
                            />
                        </div>
                        <span className="mt-5 text-on-surface-variant">–</span>
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-on-surface-variant">{t('employee.schedule.end_time')}</label>
                            <TimeInputPicker
                                value={form.end_time}
                                onChange={(next) => { setForm((f) => ({ ...f, end_time: next })); setError(''); }}
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

// ─── Day card (layout matches Schedule / Availability `DayCard`) ─────────────
function ConfigurationDayCard({ day, locale, dayError, onChange, onUpdateBreak, onOpenBreakModal, onRemoveBreak }) {
    const t = useT();
    const inputClass =
        'w-full rounded-xl border-0 bg-surface-container-low px-3 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-surface-tint md:w-auto md:py-2';
    const dateStr = representativeDateForWeekday(day.day_of_week);
    const dayLabel = t(`employee.schedule.weekday_${day.day_of_week}`);

    const shellClass = day.is_active
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
                            onChange={(e) => onChange({ ...day, is_active: e.target.checked })}
                            className="peer sr-only"
                        />
                        <div className="peer relative h-6 w-11 shrink-0 rounded-full bg-surface-container-high after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all after:content-[''] peer-checked:bg-black peer-checked:after:translate-x-full" />
                    </label>
                    <div className="min-w-0 flex-1">
                        <p className={`font-headline text-sm font-bold leading-tight ${day.is_active ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                            {formatDayHeader(dateStr, dayLabel, locale)}
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
                                <TimeInputPicker
                                    value={day.start_time}
                                    onChange={(next) => onChange({ ...day, start_time: next })}
                                    className={inputClass}
                                    ariaLabel={t('employee.schedule.from')}
                                />
                            </div>
                            <div className="min-w-0">
                                <label className="mb-1 block text-xs text-on-surface-variant">{t('employee.schedule.to')}</label>
                                <TimeInputPicker
                                    value={day.end_time}
                                    onChange={(next) => onChange({ ...day, end_time: next })}
                                    className={inputClass}
                                    ariaLabel={t('employee.schedule.to')}
                                />
                            </div>
                        </div>
                    )}

                    {day.is_active && (day.breaks ?? []).length > 0 && (
                        <div className="flex w-full flex-col gap-2 md:w-auto md:max-w-[560px] md:items-center">
                            {(day.breaks ?? []).map((brk, bi) => (
                                <div
                                    key={bi}
                                    className="flex w-full items-center gap-2 rounded-xl border border-outline-variant/25 bg-surface-container-low/50 px-2 py-1.5 md:w-auto"
                                >
                                    <div className="flex shrink-0 items-center gap-1.5 px-1 text-on-surface-variant">
                                        <Icon name="free_breakfast" size="text-sm" />
                                        <span className="whitespace-nowrap text-xs font-semibold">{t('employee.schedule.break')}</span>
                                    </div>
                                    <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
                                        <TimeInputPicker
                                            value={brk.start_time}
                                            onChange={(next) => onUpdateBreak(bi, { start_time: next })}
                                            className={inputClass}
                                            ariaLabel={t('employee.schedule.break_from')}
                                        />
                                        <TimeInputPicker
                                            value={brk.end_time}
                                            onChange={(next) => onUpdateBreak(bi, { end_time: next })}
                                            className={inputClass}
                                            ariaLabel={t('employee.schedule.break_to')}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveBreak(bi)}
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
                            onClick={onOpenBreakModal}
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
export default function Configuration({
    schedules: initialSchedules,
    business_name,
    employee_email,
    booking_url,
    employee_booking_url,
    booking_slug: initialBookingSlug,
    business_slug,
}) {
    const t = useT();
    const { errors, localeBcp47 } = usePage().props;
    const dateLocale = localeBcp47 ?? 'en-GB';
    const bookingSlugError = errors?.booking_slug
        ? (Array.isArray(errors.booking_slug) ? errors.booking_slug[0] : errors.booking_slug)
        : undefined;

    const buildDays = (raw) => {
        return Array.from({ length: 7 }, (_, i) => {
            const existing = (raw ?? []).find((s) => Number(s.day_of_week) === i);
            return {
                day_of_week: i,
                is_active: existing?.is_active ?? false,
                start_time: existing?.start_time ? String(existing.start_time).slice(0, 5) : '09:00',
                end_time: existing?.end_time ? String(existing.end_time).slice(0, 5) : '17:00',
                breaks: (existing?.breaks ?? []).map((b) => ({
                    start_time: String(b.start_time).slice(0, 5),
                    end_time: String(b.end_time).slice(0, 5),
                })),
            };
        });
    };

    const [activeTab, setActiveTab] = useState('info');
    const [days, setDays] = useState(() => buildDays(initialSchedules));
    const [breakModalDayIndex, setBreakModalDayIndex] = useState(null);
    const [bookingSlug, setBookingSlug] = useState(initialBookingSlug ?? '');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [savingInfo, setSavingInfo] = useState(false);
    const [saving, setSaving] = useState(false);
    const [dayErrors, setDayErrors] = useState({});
    const [validationModalMessage, setValidationModalMessage] = useState('');
    useEffect(() => {
        if (bookingSlugError) {
            setActiveTab('info');
        }
    }, [bookingSlugError]);

    const persistSchedules = (nextDays) => {
        setSaving(true);
        router.put(
            route('employee.schedule.update'),
            { schedules: nextDays },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setSaving(false),
            }
        );
    };

    const applyAndPersistDays = (updater) => {
        setDays((prev) => {
            const next = updater(prev);
            persistSchedules(next);
            return next;
        });
    };

    const updateDay = (index, updated) => {
        if (!isEndAfterStart(updated.start_time, updated.end_time)) {
            const message = t('employee.schedule.end_after_start');
            setDayErrors((prev) => ({ ...prev, [updated.day_of_week]: message }));
            setValidationModalMessage(message);
            return;
        }
        setDayErrors((prev) => {
            const next = { ...prev };
            delete next[updated.day_of_week];
            return next;
        });
        applyAndPersistDays((prev) => prev.map((d, i) => (i === index ? updated : d)));
    };

    const handleSaveBreak = (brk) => {
        if (breakModalDayIndex === null) return;
        applyAndPersistDays((prev) => prev.map((d, i) => (
            i === breakModalDayIndex
                ? {
                    ...d,
                    breaks: [...(d.breaks ?? []), brk],
                }
                : d
        )));
        setBreakModalDayIndex(null);
    };

    const handleRemoveBreak = (dayIndex, breakIndex) => {
        applyAndPersistDays((prev) => prev.map((d, i) => (
            i === dayIndex
                ? { ...d, breaks: (d.breaks ?? []).filter((_, j) => j !== breakIndex) }
                : d
        )));
    };

    const handleUpdateBreak = (dayIndex, breakIndex, patch) => {
        const day = days[dayIndex];
        if (!day) return;
        const breaks = (day.breaks ?? []).map((existing, j) => (j === breakIndex ? { ...existing, ...patch } : existing));
        const invalidBreak = breaks.some((b) => !isEndAfterStart(b.start_time, b.end_time));
        if (invalidBreak) {
            const message = t('employee.schedule.break_end_after_start');
            setDayErrors((prev) => ({ ...prev, [day.day_of_week]: message }));
            setValidationModalMessage(message);
            return;
        }
        setDayErrors((prev) => {
            const next = { ...prev };
            delete next[day.day_of_week];
            return next;
        });
        applyAndPersistDays((prev) =>
            prev.map((d, i) => (i === dayIndex ? { ...d, breaks } : d)),
        );
    };

    const handleSaveInfo = (e) => {
        e.preventDefault();
        if (!bookingSlug.trim()) return;
        setConfirmOpen(true);
    };

    const doSaveInfo = () => {
        setConfirmOpen(false);
        setSavingInfo(true);
        router.patch(
            route('employee.schedule.configuration.info'),
            { booking_slug: bookingSlug.trim() },
            {
                preserveScroll: true,
                onFinish: () => setSavingInfo(false),
            }
        );
    };

    const tabs = useMemo(
        () => [
            { id: 'info', label: t('employee.schedule.tab_info'), icon: 'domain' },
            { id: 'schedule', label: t('employee.schedule.tab_schedule'), icon: 'calendar_today' },
        ],
        [t],
    );

    return (
        <EmployeeLayout>
            <Head title={t('employee.schedule.configuration_title')} />

            <div className="mb-8">
                <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">{t('employee.schedule.configuration_title')}</h1>
                <p className="text-on-surface-variant text-base">{t('employee.schedule.configuration_sub')}</p>
            </div>

            {/* ── Tabs ──────────────────────────────────────────── */}
            <div className="flex gap-1 mb-8 border-b border-outline-variant/40">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
                            activeTab === tab.id
                                ? 'border-on-surface text-on-surface'
                                : 'border-transparent text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                        <Icon name={tab.icon} size="text-base" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Business Information tab ───────────────────────── */}
            {activeTab === 'info' && (
                <form onSubmit={handleSaveInfo}>
                    <section className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 sm:p-8">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-container/40">
                                <Icon name="domain" size="text-lg" className="text-on-surface" />
                            </div>
                            <h2 className="font-headline text-xl font-bold text-on-surface">{t('employee.schedule.tab_info')}</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <ReadOnlyField label={t('employee.schedule.business_name')} value={business_name} icon="storefront" />
                            <ReadOnlyField label={t('employee.schedule.your_email')} value={employee_email} icon="mail" />
                            <div className="sm:col-span-2">
                                <BookingUrlField
                                    label={t('employee.schedule.business_booking_url')}
                                    prefix="/book/"
                                    value={booking_url?.replace('/book/', '')}
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <PersonalBookingUrlField
                                    label={t('employee.schedule.personal_booking_url')}
                                    businessSlug={business_slug}
                                    value={bookingSlug}
                                    onChange={setBookingSlug}
                                    error={bookingSlugError}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex items-center gap-4 border-t border-outline-variant/30 pt-6">
                            <button
                                type="submit"
                                disabled={savingInfo || !bookingSlug.trim()}
                                className="inline-flex items-center gap-2 rounded-xl bg-on-surface px-6 py-3 text-sm font-bold text-surface hover:opacity-90 active:-translate-y-px transition-all disabled:opacity-50"
                            >
                                {savingInfo ? (
                                    <Icon name="sync" size="text-base" className="animate-spin" />
                                ) : (
                                    <Icon name="save" size="text-base" />
                                )}
                                {savingInfo ? t('employee.schedule.saving') : t('employee.schedule.save_configuration')}
                            </button>
                        </div>
                    </section>
                </form>
            )}

            {/* ── Schedule tab (same card layout as Schedule / Availability view) ─ */}
            {activeTab === 'schedule' && (
                <section>
                    <div className="mb-6">
                        <h2 className="text-3xl font-black font-headline tracking-tight text-on-surface">{t('employee.schedule.default_hours')}</h2>
                        <p className="mt-1 text-sm text-on-surface-variant">
                            {t('employee.schedule.default_hours_sub')}
                        </p>
                    </div>

                    {saving && (
                        <div className="mb-4 inline-flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface-variant">
                            <Icon name="sync" size="text-sm" className="animate-spin" />
                            {t('employee.schedule.saving')}
                        </div>
                    )}

                    <div className="space-y-3">
                        {days.map((day, i) => (
                            <ConfigurationDayCard
                                key={day.day_of_week}
                                day={day}
                                locale={dateLocale}
                                dayError={dayErrors[day.day_of_week]}
                                onChange={(updated) => updateDay(i, updated)}
                                onUpdateBreak={(bi, patch) => handleUpdateBreak(i, bi, patch)}
                                onOpenBreakModal={() => {
                                    setBreakModalDayIndex(i);
                                }}
                                onRemoveBreak={(bi) => handleRemoveBreak(i, bi)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {breakModalDayIndex !== null && days[breakModalDayIndex] && (
                <AddBreakModal
                    dayLabel={formatDayHeader(
                        representativeDateForWeekday(days[breakModalDayIndex].day_of_week),
                        t(`employee.schedule.weekday_${days[breakModalDayIndex].day_of_week}`),
                        dateLocale,
                    )}
                    onSave={handleSaveBreak}
                    onClose={() => {
                        setBreakModalDayIndex(null);
                    }}
                />
            )}

            {confirmOpen && (
                <ConfirmSaveModal
                    onConfirm={doSaveInfo}
                    onCancel={() => setConfirmOpen(false)}
                />
            )}
            {validationModalMessage ? (
                <ValidationNoticeModal
                    message={validationModalMessage}
                    onClose={() => setValidationModalMessage('')}
                />
            ) : null}

        </EmployeeLayout>
    );
}
