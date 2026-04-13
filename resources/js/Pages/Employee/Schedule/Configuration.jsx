import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import Icon from '@/Components/Icon';

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

function formatDayHeader(dateStr, dayLabel) {
    const d = new Date(dateStr + 'T00:00:00');
    return `${dayLabel}, ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`;
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

// ─── Add Break Modal (same as Schedule / Availability view) ──────────────────
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
                            <label className="mb-1 block text-xs font-medium text-on-surface-variant">Start time</label>
                            <input
                                type="time"
                                value={form.start_time}
                                onChange={(e) => { setForm((f) => ({ ...f, start_time: e.target.value })); setError(''); }}
                                className={`w-full ${inputClass}`}
                            />
                        </div>
                        <span className="mt-5 text-on-surface-variant">–</span>
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-on-surface-variant">End time</label>
                            <input
                                type="time"
                                value={form.end_time}
                                onChange={(e) => { setForm((f) => ({ ...f, end_time: e.target.value })); setError(''); }}
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

// ─── Day card (layout matches Schedule / Availability `DayCard`) ─────────────
function ConfigurationDayCard({ day, onChange, onOpenBreakModal, onRemoveBreak }) {
    const inputClass = 'rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-surface-tint';
    const dateStr = representativeDateForWeekday(day.day_of_week);
    const dayLabel = DAY_LABELS[day.day_of_week];

    return (
        <div
            className={`rounded-3xl border px-5 py-4 transition-all ${
                day.is_active
                    ? 'bg-surface-container-lowest border-outline-variant'
                    : 'bg-surface-container-low border-outline-variant/50 opacity-60'
            }`}
        >
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 w-[210px] shrink-0">
                    <label className="relative inline-flex cursor-pointer items-center">
                        <input
                            type="checkbox"
                            checked={day.is_active}
                            onChange={(e) => onChange({ ...day, is_active: e.target.checked })}
                            className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-surface-container-high after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full" />
                    </label>
                    <div>
                        <p className={`font-bold font-headline text-sm leading-tight ${day.is_active ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                            {formatDayHeader(dateStr, dayLabel)}
                        </p>
                        {!day.is_active && (
                            <p className="text-xs text-on-surface-variant mt-0.5">Day off</p>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center gap-3">
                    {day.is_active && (
                        <div className="flex items-center gap-2 flex-wrap justify-center">
                            <label className="text-xs text-on-surface-variant">From</label>
                            <input
                                type="time"
                                value={day.start_time}
                                onChange={(e) => onChange({ ...day, start_time: e.target.value })}
                                className={`${inputClass} w-auto`}
                            />
                            <span className="text-on-surface-variant">–</span>
                            <label className="text-xs text-on-surface-variant">To</label>
                            <input
                                type="time"
                                value={day.end_time}
                                onChange={(e) => onChange({ ...day, end_time: e.target.value })}
                                className={`${inputClass} w-auto`}
                            />
                        </div>
                    )}

                    {day.is_active && (day.breaks ?? []).length > 0 && (
                        <div className="flex flex-col items-center gap-2 w-full">
                            {(day.breaks ?? []).map((brk, bi) => (
                                <div key={bi} className="flex items-center gap-2 flex-wrap justify-center">
                                    <Icon name="free_breakfast" size="text-sm" className="text-on-surface-variant" />
                                    <span className="text-xs text-on-surface-variant">Break</span>
                                    <input type="time" value={brk.start_time} readOnly className={inputClass} />
                                    <span className="text-on-surface-variant text-xs">–</span>
                                    <input type="time" value={brk.end_time} readOnly className={inputClass} />
                                    <button
                                        type="button"
                                        onClick={() => onRemoveBreak(bi)}
                                        className="rounded-xl bg-error-container p-1.5 text-on-error-container hover:opacity-80 transition-opacity"
                                    >
                                        <Icon name="close" size="text-sm" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-[140px] shrink-0 flex justify-end">
                    {day.is_active && (
                        <button
                            type="button"
                            onClick={onOpenBreakModal}
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
export default function Configuration({
    schedules: initialSchedules,
    business_name,
    employee_email,
    booking_url,
    employee_booking_url,
    booking_slug: initialBookingSlug,
    business_slug,
}) {
    const { errors } = usePage().props;
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
    useEffect(() => {
        if (bookingSlugError) {
            setActiveTab('info');
        }
    }, [bookingSlugError]);

    const updateDay = (index, updated) => {
        setDays((prev) => prev.map((d, i) => (i === index ? updated : d)));
    };

    const handleSaveBreak = (brk) => {
        if (breakModalDayIndex === null) return;
        setDays((prev) => prev.map((d, i) => (
            i === breakModalDayIndex
                ? { ...d, breaks: [...(d.breaks ?? []), brk] }
                : d
        )));
        setBreakModalDayIndex(null);
    };

    const handleRemoveBreak = (dayIndex, breakIndex) => {
        setDays((prev) => prev.map((d, i) => (
            i === dayIndex
                ? { ...d, breaks: (d.breaks ?? []).filter((_, j) => j !== breakIndex) }
                : d
        )));
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

    const handleSave = (e) => {
        e.preventDefault();
        setSaving(true);
        router.put(
            route('employee.schedule.update'),
            { schedules: days },
            {
                preserveScroll: true,
                onFinish: () => setSaving(false),
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

            {/* ── Schedule tab (same card layout as Schedule / Availability view) ─ */}
            {activeTab === 'schedule' && (
                <form onSubmit={handleSave}>
                    <div className="mb-6">
                        <h2 className="text-3xl font-black font-headline tracking-tight text-on-surface">Default weekly hours</h2>
                        <p className="mt-1 text-sm text-on-surface-variant">
                            Toggle days on or off and manage breaks — same layout as your week view. Save when you are ready; date-specific overrides stay in the Schedule tab.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {days.map((day, i) => (
                            <ConfigurationDayCard
                                key={day.day_of_week}
                                day={day}
                                onChange={(updated) => updateDay(i, updated)}
                                onOpenBreakModal={() => setBreakModalDayIndex(i)}
                                onRemoveBreak={(bi) => handleRemoveBreak(i, bi)}
                            />
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
                </form>
            )}

            {breakModalDayIndex !== null && days[breakModalDayIndex] && (
                <AddBreakModal
                    dayLabel={formatDayHeader(
                        representativeDateForWeekday(days[breakModalDayIndex].day_of_week),
                        DAY_LABELS[days[breakModalDayIndex].day_of_week],
                    )}
                    onSave={handleSaveBreak}
                    onClose={() => setBreakModalDayIndex(null)}
                />
            )}

            {confirmOpen && (
                <ConfirmSaveModal
                    onConfirm={doSaveInfo}
                    onCancel={() => setConfirmOpen(false)}
                />
            )}

        </EmployeeLayout>
    );
}
