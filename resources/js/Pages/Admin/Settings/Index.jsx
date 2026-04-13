import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';

/** Editable fields: clear surface + ring (not gray read-only look). */
const editableInputCls =
    'w-full border-0 rounded-lg py-3 px-4 text-sm text-on-surface font-medium bg-surface-container-lowest ring-1 ring-outline-variant focus:outline-none focus:ring-2 focus:ring-on-surface/20 transition-shadow';

const bookingSlugRowCls =
    'flex items-center rounded-lg overflow-hidden ring-1 ring-outline-variant bg-surface-container-lowest focus-within:ring-2 focus-within:ring-on-surface/20 transition-shadow';

const rulesNumberCls =
    'w-24 border-0 rounded-lg py-2 px-3 text-sm font-bold text-on-surface text-center bg-surface-container-lowest ring-1 ring-outline-variant focus:outline-none focus:ring-2 focus:ring-on-surface/20 transition-shadow';

function ConfirmSaveModal({ section, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-amber-100">
                        <Icon name="save" size="text-xl" className="text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-extrabold text-on-surface">Save {section}?</h2>
                        <p className="mt-1 text-sm text-on-surface-variant">
                            Are you sure you want to save the changes to <span className="font-semibold text-on-surface">{section}</span>? This will update your configuration immediately.
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

export default function Index({
    settings,
    owner_email,
    show_owner_staff_toggle = false,
    owner_also_works_as_staff = false,
}) {
    const { flash } = usePage().props;
    const [activeTab, setActiveTab] = useState('identity');

    // Which confirm modal is open: null | 'identity' | 'rules'
    const [confirmSection, setConfirmSection] = useState(null);

    // Form 1 — Business Identity (editable)
    const identity = useForm({
        name:     settings.name     || '',
        phone:    settings.phone    || '',
        location: settings.location || '',
        slug:     settings.slug     || '',
        logo:     null,
    });
    const currentLogoUrl = settings.logo ? `/storage/${settings.logo}` : null;
    const [selectedLogoPreview, setSelectedLogoPreview] = useState(null);

    useEffect(() => {
        if (!identity.data.logo) {
            setSelectedLogoPreview(null);
            return;
        }

        const objectUrl = URL.createObjectURL(identity.data.logo);
        setSelectedLogoPreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [identity.data.logo]);

    useEffect(() => {
        const errs = identity.errors;
        if (errs && Object.keys(errs).length > 0) {
            setActiveTab('identity');
        }
    }, [identity.errors]);

    const handleIdentitySubmit = (e) => {
        e.preventDefault();
        setConfirmSection('identity');
    };

    const doSaveIdentity = () => {
        setConfirmSection(null);
        identity.transform((formData) => ({ ...formData, _method: 'put' }));
        identity.post(route('admin.settings.update'), {
            forceFormData: true,
        });
    };

    // Form 2 — Booking Rules
    const {
        data,
        setData,
        put,
        processing,
        recentlySuccessful,
        errors: rulesErrors,
    } = useForm({
        slot_duration: settings.slot_duration || 30,
        min_booking_notice: settings.min_booking_notice || 120,
        max_booking_window: settings.max_booking_window || 30,
        client_identifier_type: settings.client_identifier_type || 'phone',
        ...(show_owner_staff_toggle ? { owner_also_works_as_staff: !!owner_also_works_as_staff } : {}),
    });

    useEffect(() => {
        if (rulesErrors && Object.keys(rulesErrors).length > 0) {
            setActiveTab('rules');
        }
    }, [rulesErrors]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setConfirmSection('rules');
    };

    const doSaveRules = () => {
        setConfirmSection(null);
        put(route('admin.settings.update'));
    };

    const bookingPath = `/book/${identity.data.slug || settings.slug}`;
    const [copiedBooking, setCopiedBooking] = useState(false);
    const copyBookingUrl = () => {
        navigator.clipboard.writeText(bookingPath).then(() => {
            setCopiedBooking(true);
            setTimeout(() => setCopiedBooking(false), 2000);
        });
    };

    return (
        <AdminLayout>
            <Head title="Configuration" />

            <header className="mb-10">
                <nav className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">
                    <span>Settings</span>
                    <Icon name="chevron_right" size="text-sm" />
                    <span className="text-on-surface">Business Configuration</span>
                </nav>
                <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Business Configuration</h1>
                <p className="text-on-surface-variant max-w-2xl text-base leading-relaxed">Manage your business identity and configure booking rules for your clients.</p>
            </header>

            {flash?.info && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-outline-variant/40 bg-primary-container/15 px-5 py-4 text-sm text-on-surface">
                    <Icon name="info" size="text-lg" className="mt-0.5 shrink-0 text-on-surface" />
                    <div>
                        <p className="font-bold">Finish business setup to unlock the dashboard.</p>
                        <p className="mt-1 text-on-surface-variant">{flash.info}</p>
                    </div>
                </div>
            )}

            {/* Tabs — Business Identity | Booking Rules */}
            <div className="flex gap-1 mb-8 border-b border-outline-variant/40">
                <button
                    type="button"
                    onClick={() => setActiveTab('identity')}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
                        activeTab === 'identity'
                            ? 'border-on-surface text-on-surface'
                            : 'border-transparent text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                    <Icon name="domain" size="text-base" />
                    Business Identity
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('rules')}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
                        activeTab === 'rules'
                            ? 'border-on-surface text-on-surface'
                            : 'border-transparent text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                    <Icon name="rule" size="text-base" />
                    Booking Rules
                </button>
            </div>

            <div className="space-y-8">
                {/* Business Identity — editable (except account email) */}
                {activeTab === 'identity' && (
                <form onSubmit={handleIdentitySubmit}>
                    <section className="bg-surface-container-low p-8 rounded-xl">
                        <div className="flex items-center gap-3 mb-8">
                            <Icon name="domain" size="text-xl" className="text-on-surface" />
                            <h3 className="text-xl font-bold font-headline text-on-surface">Business Identity</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                            {/* Business Name */}
                            <div>
                                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Business Name</label>
                                <input
                                    type="text"
                                    value={identity.data.name}
                                    onChange={(e) => identity.setData('name', e.target.value)}
                                    className={editableInputCls}
                                    required
                                />
                                {identity.errors.name && <p className="text-xs text-error mt-1">{identity.errors.name}</p>}
                            </div>

                            {/* Account Email — always read-only */}
                            <ReadOnlyField label="Account Email" value={owner_email} icon="mail" />

                            {/* Phone */}
                            <div>
                                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    value={identity.data.phone}
                                    onChange={(e) => identity.setData('phone', e.target.value)}
                                    className={editableInputCls}
                                />
                                {identity.errors.phone && <p className="text-xs text-error mt-1">{identity.errors.phone}</p>}
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Location</label>
                                <input
                                    type="text"
                                    value={identity.data.location}
                                    onChange={(e) => identity.setData('location', e.target.value)}
                                    className={editableInputCls}
                                />
                                {identity.errors.location && <p className="text-xs text-error mt-1">{identity.errors.location}</p>}
                            </div>

                            {/* Booking URL (slug editable) */}
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Booking URL</label>
                                <div className={bookingSlugRowCls}>
                                    <span className="shrink-0 px-3 py-3 text-xs text-on-surface-variant border-r border-outline-variant/30 bg-surface-container whitespace-nowrap">/book/</span>
                                    <input
                                        type="text"
                                        value={identity.data.slug}
                                        onChange={(e) => identity.setData('slug', e.target.value)}
                                        className="flex-1 bg-transparent border-0 outline-none px-3 py-3 text-sm text-on-surface font-medium min-w-0"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={copyBookingUrl}
                                        className="shrink-0 p-2 mr-1 hover:bg-surface-container rounded-md transition-colors"
                                        title="Copy booking path"
                                    >
                                        <Icon name={copiedBooking ? 'check' : 'content_copy'} size="text-base" className="text-on-surface-variant" />
                                    </button>
                                </div>
                                {identity.errors.slug && <p className="text-xs text-error mt-1 font-medium">{identity.errors.slug}</p>}
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Business Logo</label>
                                <div className="rounded-2xl border border-dashed border-outline-variant/60 bg-surface-container-lowest ring-1 ring-outline-variant/40 px-4 py-4">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-4 min-w-0">
                                            {selectedLogoPreview || currentLogoUrl ? (
                                                <img
                                                    src={selectedLogoPreview || currentLogoUrl}
                                                    alt={`${identity.data.name || 'Business'} logo`}
                                                    className="h-16 w-16 rounded-2xl object-cover border border-outline-variant/30 bg-surface-container"
                                                />
                                            ) : (
                                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container text-on-surface-variant">
                                                    <Icon name="storefront" size="text-2xl" />
                                                </div>
                                            )}

                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-on-surface">
                                                    {identity.data.logo ? identity.data.logo.name : currentLogoUrl ? 'Current business logo' : 'No logo uploaded yet'}
                                                </p>
                                                <p className="mt-1 text-xs text-on-surface-variant">
                                                    Upload a PNG, JPG, or WEBP file up to 2 MB. New uploads replace the current logo.
                                                </p>
                                            </div>
                                        </div>

                                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface ring-1 ring-outline-variant hover:bg-surface-container transition-colors">
                                            <Icon name="upload" size="text-base" />
                                            Choose logo
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp,image/jpg"
                                                className="hidden"
                                                onChange={(e) => identity.setData('logo', e.target.files?.[0] ?? null)}
                                            />
                                        </label>
                                    </div>
                                </div>
                                {identity.errors.logo && <p className="text-xs text-error mt-1">{identity.errors.logo}</p>}
                            </div>
                        </div>

                        {/* Save Identity button */}
                        <div className="pt-6 mt-6 border-t border-outline-variant/40 flex items-center gap-6">
                            <button
                                type="submit"
                                disabled={identity.processing}
                                className="bg-on-surface text-surface px-10 py-4 rounded-xl font-bold font-headline text-base hover:opacity-90 active:-translate-y-px transition-all disabled:opacity-50"
                            >
                                {identity.processing ? 'Saving…' : 'Save Configuration'}
                            </button>
                            {identity.recentlySuccessful && (
                                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                                    <Icon name="check_circle" size="text-sm" className="text-on-primary-container" /> Saved successfully
                                </p>
                            )}
                        </div>
                    </section>
                </form>
                )}

                {/* Booking Rules — editable */}
                {activeTab === 'rules' && (
                <form onSubmit={handleSubmit}>
                    <section className="bg-surface-container-low p-8 rounded-xl">
                        <div className="flex items-center gap-3 mb-8">
                            <Icon name="rule" size="text-xl" className="text-on-surface" />
                            <h3 className="text-xl font-bold font-headline text-on-surface">Booking Rules</h3>
                        </div>

                        {/* Top row: three numeric rules in a grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                            <div className="bg-surface rounded-xl p-6 flex flex-col gap-4">
                                <div>
                                    <p className="text-sm font-bold text-on-surface">Time Slot Duration</p>
                                    <p className="text-xs text-on-surface-variant mt-0.5 leading-tight">Minimum interval between available appointments.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number" min="5" max="240"
                                        value={data.slot_duration}
                                        onChange={e => setData('slot_duration', parseInt(e.target.value))}
                                        className={rulesNumberCls}
                                    />
                                    <span className="text-xs font-bold text-on-surface-variant uppercase">min</span>
                                </div>
                            </div>

                            <div className="bg-surface rounded-xl p-6 flex flex-col gap-4">
                                <div>
                                    <p className="text-sm font-bold text-on-surface">Minimum Notice</p>
                                    <p className="text-xs text-on-surface-variant mt-0.5 leading-tight">Lead time required before a booking can be made.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number" min="0"
                                        value={data.min_booking_notice}
                                        onChange={e => setData('min_booking_notice', parseInt(e.target.value))}
                                        className={rulesNumberCls}
                                    />
                                    <span className="text-xs font-bold text-on-surface-variant uppercase">min</span>
                                </div>
                            </div>

                            <div className="bg-surface rounded-xl p-6 flex flex-col gap-4">
                                <div>
                                    <p className="text-sm font-bold text-on-surface">Booking Window</p>
                                    <p className="text-xs text-on-surface-variant mt-0.5 leading-tight">How far in advance clients can schedule.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number" min="1" max="365"
                                        value={data.max_booking_window}
                                        onChange={e => setData('max_booking_window', parseInt(e.target.value))}
                                        className={rulesNumberCls}
                                    />
                                    <span className="text-xs font-bold text-on-surface-variant uppercase">days</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom row: Client Identification + I also work as staff (if applicable) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-outline-variant/40">

                            {/* Client Identification */}
                            <div className="bg-surface rounded-xl p-6">
                                <p className="text-sm font-bold text-on-surface mb-1">Client Identification</p>
                                <p className="text-xs text-on-surface-variant mb-4">How clients are identified when booking.</p>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setData('client_identifier_type', 'phone')}
                                        className={`flex items-center gap-2 flex-1 justify-center py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                                            data.client_identifier_type === 'phone'
                                                ? 'border-on-surface bg-on-surface text-surface'
                                                : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant ring-1 ring-outline-variant/60 hover:border-on-surface/40'
                                        }`}
                                    >
                                        <Icon name="phone" size="text-base" />
                                        Phone
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData('client_identifier_type', 'email')}
                                        className={`flex items-center gap-2 flex-1 justify-center py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                                            data.client_identifier_type === 'email'
                                                ? 'border-on-surface bg-on-surface text-surface'
                                                : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant ring-1 ring-outline-variant/60 hover:border-on-surface/40'
                                        }`}
                                    >
                                        <Icon name="mail" size="text-base" />
                                        Email
                                    </button>
                                </div>
                            </div>

                            {/* I also work as staff — sits in the second column of the same row */}
                            {show_owner_staff_toggle && (
                                <div className="bg-surface rounded-xl p-6 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-bold text-on-surface">I also work as staff</p>
                                        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                                            Turn this on if you take appointments yourself.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setData('owner_also_works_as_staff', !data.owner_also_works_as_staff)}
                                        className={`relative shrink-0 w-12 h-6 rounded-full transition-colors duration-200 ${
                                            data.owner_also_works_as_staff ? 'bg-on-surface' : 'bg-surface-container-highest'
                                        }`}
                                        aria-pressed={data.owner_also_works_as_staff}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                                            data.owner_also_works_as_staff ? 'right-1' : 'left-1'
                                        }`} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Save button */}
                        <div className="pt-6 border-t border-outline-variant/40 flex items-center gap-6">
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-on-surface text-surface px-10 py-4 rounded-xl font-bold font-headline text-base hover:opacity-90 active:-translate-y-px transition-all disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : 'Save Configuration'}
                            </button>
                            {recentlySuccessful && (
                                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                                    <Icon name="check_circle" size="text-sm" className="text-on-primary-container" /> Saved successfully
                                </p>
                            )}
                        </div>
                    </section>
                </form>
                )}

            </div>

            {confirmSection === 'identity' && (
                <ConfirmSaveModal
                    section="Business Identity"
                    onConfirm={doSaveIdentity}
                    onCancel={() => setConfirmSection(null)}
                />
            )}

            {confirmSection === 'rules' && (
                <ConfirmSaveModal
                    section="Booking Rules"
                    onConfirm={doSaveRules}
                    onCancel={() => setConfirmSection(null)}
                />
            )}
        </AdminLayout>
    );
}
