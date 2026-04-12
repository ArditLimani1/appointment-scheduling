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

// ─── Read-only info field with copy button ────────────────────────────────────
function InfoField({ label, value, icon, allowCopy = false }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!value) return;
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-outline">
                {label}
            </label>
            <div className="flex items-center gap-2 rounded-xl bg-surface-container-low px-4 py-2.5 text-sm">
                {icon && <Icon name={icon} size="text-base" className="shrink-0 text-outline" />}
                <span className="min-w-0 flex-1 truncate text-on-surface-variant">{value || '—'}</span>
                {allowCopy && value && (
                    <button
                        type="button"
                        onClick={handleCopy}
                        title="Copy"
                        className="shrink-0 rounded-lg p-1 text-outline hover:bg-surface-container-highest transition-colors"
                    >
                        <Icon name={copied ? 'check' : 'content_copy'} size="text-base" />
                    </button>
                )}
            </div>
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
}) {
    const { flash } = usePage().props;

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

    const [days, setDays] = useState(() => buildDays(initialSchedules));
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = useCallback((msg) => {
        setToast(null);
        setTimeout(() => setToast(msg), 10);
    }, []);

    useEffect(() => {
        if (flash?.success) showToast(flash.success);
    }, [flash?.success, flash?.nonce]);

    const updateDay = (index, updated) => {
        setDays((prev) => prev.map((d, i) => (i === index ? updated : d)));
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

    return (
        <EmployeeLayout>
            <Head title="Configuration" />

            <div className="mb-8">
                <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Configuration</h1>
                <p className="text-on-surface-variant text-base">Manage your business information and default weekly availability.</p>
            </div>

            <div className="space-y-8">

                {/* ── Business Information ─────────────────────────── */}
                <section className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 sm:p-8">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-container/40">
                            <Icon name="domain" size="text-lg" className="text-on-surface" />
                        </div>
                        <h2 className="font-headline text-xl font-bold text-on-surface">Business Information</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <InfoField label="Business Name" value={business_name} icon="storefront" />
                        <InfoField label="Your Email" value={employee_email} icon="mail" />
                        <InfoField
                            label="Business Booking URL"
                            value={booking_url}
                            icon="link"
                            allowCopy
                        />
                        <div>
                            <InfoField
                                label="Your Personal Booking URL"
                                value={employee_booking_url}
                                icon="person_pin"
                                allowCopy
                            />
                            <p className="mt-1.5 text-[11px] text-on-surface-variant leading-relaxed">
                                Share this link with clients to skip the "choose a professional" step — it goes directly to your services.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── Default Weekly Schedule ──────────────────────── */}
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
            </div>

            {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
        </EmployeeLayout>
    );
}
