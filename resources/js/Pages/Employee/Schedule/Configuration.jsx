import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import Icon from '@/Components/Icon';

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const inputCls =
    'w-full rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-surface-tint';

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
                    title="Copy URL"
                >
                    <Icon name={copied ? 'check' : 'content_copy'} size="text-base" className="text-on-surface-variant" />
                </button>
            </div>
        </div>
    );
}

// ─── Confirm save modal (same as Admin Settings) ─────────────────────────────
function ConfirmSaveModal({ onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-amber-100">
                        <Icon name="save" size="text-xl" className="text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-extrabold text-on-surface">Save Configuration?</h2>
                        <p className="mt-1 text-sm text-on-surface-variant">
                            Are you sure you want to save the changes to{' '}
                            <span className="font-semibold text-on-surface">Business Information</span>? This will update your configuration immediately.
                        </p>
                    </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-xl bg-on-surface px-6 py-2.5 text-sm font-bold text-surface hover:opacity-90 transition-opacity"
                    >
                        Yes, Save
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Editable personal booking URL field ─────────────────────────────────────
function PersonalBookingUrlField({ label, businessSlug, value, onChange, error }) {
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
                    placeholder="your-name"
                    spellCheck={false}
                />
                <button
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0 p-2 mr-1 hover:bg-surface-container rounded-md transition-colors"
                    title="Copy URL"
                >
                    <Icon name={copied ? 'check' : 'content_copy'} size="text-base" className="text-on-surface-variant" />
                </button>
            </div>
            {error && <p className="mt-1.5 text-sm font-medium text-error">{error}</p>}
        </div>
    );
}

// ─── Break row ────────────────────────────────────────────────────────────────
function BreakRow({ brk, onChange, onRemove }) {
    return (
        <div className="flex items-center gap-2 flex-wrap">
            <Icon name="free_breakfast" size="text-sm" className="text-on-surface-variant" />
            <span className="text-xs text-on-surface-variant">Break</span>
            <input
                type="time"
                value={brk.start_time}
                onChange={(e) => onChange({ ...brk, start_time: e.target.value })}
                className="rounded-xl border-0 bg-surface-container-highest px-3 py-2 text-sm focus:ring-2 focus:ring-surface-tint"
            />
            <span className="text-on-surface-variant text-xs">–</span>
            <input
                type="time"
                value={brk.end_time}
                onChange={(e) => onChange({ ...brk, end_time: e.target.value })}
                className="rounded-xl border-0 bg-surface-container-highest px-3 py-2 text-sm focus:ring-2 focus:ring-surface-tint"
            />
            <button
                type="button"
                onClick={onRemove}
                className="rounded-xl bg-error-container p-1.5 text-on-error-container hover:opacity-80 transition-opacity"
            >
                <Icon name="close" size="text-sm" />
            </button>
        </div>
    );
}

// ─── Day row ──────────────────────────────────────────────────────────────────
function DayRow({ day, onChange }) {
    const addBreak = () => {
        onChange({
            ...day,
            breaks: [...(day.breaks ?? []), { start_time: '12:00', end_time: '13:00' }],
        });
    };

    const updateBreak = (index, updated) => {
        const breaks = day.breaks.map((b, i) => (i === index ? updated : b));
        onChange({ ...day, breaks });
    };

    const removeBreak = (index) => {
        onChange({ ...day, breaks: day.breaks.filter((_, i) => i !== index) });
    };

    return (
        <div
            className={`rounded-3xl border px-5 py-4 transition-all ${
                day.is_active
                    ? 'bg-surface-container-lowest border-outline-variant'
                    : 'bg-surface-container-low border-outline-variant/50 opacity-60'
            }`}
        >
            <div className="flex flex-wrap items-center gap-4">
                {/* Toggle + label */}
                <div className="flex items-center gap-3 w-[200px] shrink-0">
                    <label className="relative inline-flex cursor-pointer items-center">
                        <input
                            type="checkbox"
                            checked={day.is_active}
                            onChange={(e) => onChange({ ...day, is_active: e.target.checked })}
                            className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-surface-container-high after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full" />
                    </label>
                    <p className={`text-sm font-bold font-headline ${day.is_active ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                        {DAY_LABELS[day.day_of_week]}
                        {!day.is_active && <span className="ml-1 font-normal text-xs text-on-surface-variant">— Day off</span>}
                    </p>
                </div>

                {day.is_active && (
                    <div className="flex flex-1 flex-col gap-3">
                        {/* Working hours */}
                        <div className="flex flex-wrap items-center gap-2">
                            <label className="text-xs text-on-surface-variant">From</label>
                            <input
                                type="time"
                                value={day.start_time}
                                onChange={(e) => onChange({ ...day, start_time: e.target.value })}
                                className={inputCls + ' w-auto'}
                            />
                            <span className="text-on-surface-variant">–</span>
                            <label className="text-xs text-on-surface-variant">To</label>
                            <input
                                type="time"
                                value={day.end_time}
                                onChange={(e) => onChange({ ...day, end_time: e.target.value })}
                                className={inputCls + ' w-auto'}
                            />
                        </div>

                        {/* Breaks */}
                        {(day.breaks ?? []).map((brk, i) => (
                            <BreakRow
                                key={i}
                                brk={brk}
                                onChange={(updated) => updateBreak(i, updated)}
                                onRemove={() => removeBreak(i)}
                            />
                        ))}

                        <button
                            type="button"
                            onClick={addBreak}
                            className="self-start flex items-center gap-1 rounded-xl border border-outline-variant px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                        >
                            <Icon name="add" size="text-sm" /> Add Break
                        </button>
                    </div>
                )}
            </div>
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
    const { flash, errors } = usePage().props;
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
    const [bookingSlug, setBookingSlug] = useState(initialBookingSlug ?? '');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [savingInfo, setSavingInfo] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = useCallback((msg) => {
        setToast(null);
        setTimeout(() => setToast(msg), 10);
    }, []);

    useEffect(() => {
        if (flash?.success) showToast(flash.success);
    }, [flash?.success, flash?.nonce]);

    useEffect(() => {
        if (bookingSlugError) {
            setActiveTab('info');
        }
    }, [bookingSlugError]);

    const updateDay = (index, updated) => {
        setDays((prev) => prev.map((d, i) => (i === index ? updated : d)));
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
                onSuccess: () => showToast('Booking URL updated.'),
            }
        );
    };

    const handleSave = (e) => {
        e.preventDefault();
        setSaving(true);
        router.put(
            route('employee.schedule.update'),
            { schedules: days },
            {
                preserveScroll: true,
                onFinish: () => setSaving(false),
                onSuccess: () => showToast('Default schedule saved.'),
            }
        );
    };

    const tabs = [
        { id: 'info',     label: 'Business Information', icon: 'domain' },
        { id: 'schedule', label: 'Schedule',              icon: 'calendar_today' },
    ];

    return (
        <EmployeeLayout>
            <Head title="Configuration" />

            <div className="mb-8">
                <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Configuration</h1>
                <p className="text-on-surface-variant text-base">Manage your business information and default weekly availability.</p>
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
                            <h2 className="font-headline text-xl font-bold text-on-surface">Business Information</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <ReadOnlyField label="Business Name" value={business_name} icon="storefront" />
                            <ReadOnlyField label="Your Email" value={employee_email} icon="mail" />
                            <div className="sm:col-span-2">
                                <BookingUrlField
                                    label="Business Booking URL"
                                    prefix="/book/"
                                    value={booking_url?.replace('/book/', '')}
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <PersonalBookingUrlField
                                    label="Your Personal Booking URL"
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
                                {savingInfo ? 'Saving…' : 'Save Configuration'}
                            </button>
                        </div>
                    </section>
                </form>
            )}

            {/* ── Schedule tab ───────────────────────────────────── */}
            {activeTab === 'schedule' && (
                <form onSubmit={handleSave}>
                    <section className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 sm:p-8">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-container/40">
                                <Icon name="calendar_today" size="text-lg" className="text-on-surface" />
                            </div>
                            <div>
                                <h2 className="font-headline text-xl font-bold text-on-surface">Default Weekly Schedule</h2>
                                <p className="text-xs text-on-surface-variant mt-0.5">
                                    Your base working hours. Override specific dates in the Schedule tab.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {days.map((day, i) => (
                                <DayRow key={i} day={day} onChange={(updated) => updateDay(i, updated)} />
                            ))}
                        </div>

                        <div className="mt-6 flex items-center gap-4 border-t border-outline-variant/30 pt-6">
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl bg-on-surface px-6 py-3 text-sm font-bold text-surface hover:opacity-90 active:-translate-y-px transition-all disabled:opacity-50"
                            >
                                {saving ? (
                                    <Icon name="sync" size="text-base" className="animate-spin" />
                                ) : (
                                    <Icon name="save" size="text-base" />
                                )}
                                {saving ? 'Saving…' : 'Save Schedule'}
                            </button>
                        </div>
                    </section>
                </form>
            )}

            {confirmOpen && (
                <ConfirmSaveModal
                    onConfirm={doSaveInfo}
                    onCancel={() => setConfirmOpen(false)}
                />
            )}

            {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
        </EmployeeLayout>
    );
}
