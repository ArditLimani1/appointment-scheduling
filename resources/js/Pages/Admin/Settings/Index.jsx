import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import useLockBodyScroll from '@/hooks/useLockBodyScroll';
import { useT } from '@/i18n/useT';

/** Editable fields: clear surface + ring (not gray read-only look). */
const editableInputCls =
    'w-full border-0 rounded-lg py-3 px-4 text-sm text-on-surface font-medium bg-surface-container-lowest ring-1 ring-outline-variant focus:outline-none focus:ring-2 focus:ring-on-surface/20 transition-shadow';

const bookingSlugRowCls =
    'flex items-center rounded-lg overflow-hidden ring-1 ring-outline-variant bg-surface-container-lowest focus-within:ring-2 focus-within:ring-on-surface/20 transition-shadow';

const rulesNumberCls =
    'w-24 border-0 rounded-lg py-2 px-3 text-sm font-bold text-on-surface text-center bg-surface-container-lowest ring-1 ring-outline-variant focus:outline-none focus:ring-2 focus:ring-on-surface/20 transition-shadow';

function ConfirmSaveModal({ section, onConfirm, onCancel }) {
    const t = useT();
    useLockBodyScroll(true);
    const title =
        section === 'identity'
            ? t('admin.settings.confirm.identity_title')
            : t('admin.settings.confirm.rules_title');
    const body =
        section === 'identity'
            ? t('admin.settings.confirm.identity_body')
            : t('admin.settings.confirm.rules_body');

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-amber-100">
                        <Icon name="save" size="text-xl" className="text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-extrabold text-on-surface">{title}</h2>
                        <p className="mt-1 text-sm text-on-surface-variant">{body}</p>
                    </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-slate-50 transition-colors"
                    >
                        {t('admin.settings.confirm.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-xl bg-on-surface px-6 py-2.5 text-sm font-bold text-surface hover:opacity-90 transition-opacity"
                    >
                        {t('admin.settings.confirm.yes_save')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Index({
    settings,
    show_owner_staff_toggle = false,
    owner_also_works_as_staff = false,
}) {
    const t = useT();
    const { flash, features } = usePage().props;
    const whatsappEnabled = features?.whatsapp ?? false;
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
        client_identifier_type: whatsappEnabled
            ? (settings.client_identifier_type || 'phone')
            : 'email',
        allow_employee_service_edit: settings.allow_employee_service_edit ?? true,
        uses_shared_resources: settings.uses_shared_resources ?? false,
        auto_confirm_appointments: settings.auto_confirm_appointments ?? false,
        ...(show_owner_staff_toggle ? { owner_also_works_as_staff: !!owner_also_works_as_staff } : {}),
    });

    useEffect(() => {
        if (!whatsappEnabled) {
            setData('client_identifier_type', 'email');
        }
    }, [whatsappEnabled, setData]);

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
            <Head title={t('admin.settings.head_title')} />

            <header className="mb-10">
                <nav className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">
                    <span>{t('admin.settings.breadcrumb_settings')}</span>
                    <Icon name="chevron_right" size="text-sm" />
                    <span className="text-on-surface">{t('admin.settings.breadcrumb_current')}</span>
                </nav>
                <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">{t('admin.settings.page_title')}</h1>
                <p className="text-on-surface-variant max-w-2xl text-base leading-relaxed">{t('admin.settings.page_subtitle')}</p>
            </header>

            {flash?.info && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-outline-variant/40 bg-primary-container/15 px-5 py-4 text-sm text-on-surface">
                    <Icon name="info" size="text-lg" className="mt-0.5 shrink-0 text-on-surface" />
                    <div>
                        <p className="font-bold">{t('admin.settings.flash_setup_title')}</p>
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
                    {t('admin.settings.tabs.identity')}
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
                    {t('admin.settings.tabs.rules')}
                </button>
            </div>

            <div className="space-y-8">
                {/* Business Identity — editable (except account email) */}
                {activeTab === 'identity' && (
                <form onSubmit={handleIdentitySubmit}>
                    <section className="bg-surface-container-low p-8 rounded-xl">
                        <div className="flex items-center gap-3 mb-8">
                            <Icon name="domain" size="text-xl" className="text-on-surface" />
                            <h3 className="text-xl font-bold font-headline text-on-surface">{t('admin.settings.identity_section')}</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                            {/* Business Name */}
                            <div>
                                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">{t('admin.settings.label_business_name')}</label>
                                <input
                                    type="text"
                                    value={identity.data.name}
                                    onChange={(e) => identity.setData('name', e.target.value)}
                                    className={editableInputCls}
                                    placeholder={t('auth_pages.register.business_name_ph')}
                                    required
                                />
                                {identity.errors.name && <p className="text-xs text-error mt-1">{identity.errors.name}</p>}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">{t('admin.settings.label_phone')}</label>
                                <input
                                    type="tel"
                                    value={identity.data.phone}
                                    onChange={(e) => identity.setData('phone', e.target.value)}
                                    className={editableInputCls}
                                    placeholder={t('auth_pages.register.phone_ph')}
                                />
                                {identity.errors.phone && <p className="text-xs text-error mt-1">{identity.errors.phone}</p>}
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">{t('admin.settings.label_location')}</label>
                                <input
                                    type="text"
                                    value={identity.data.location}
                                    onChange={(e) => identity.setData('location', e.target.value)}
                                    className={editableInputCls}
                                    placeholder={t('auth_pages.register.location_ph')}
                                />
                                {identity.errors.location && <p className="text-xs text-error mt-1">{identity.errors.location}</p>}
                            </div>

                            {/* Booking URL (slug editable) */}
                            <div>
                                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">{t('admin.settings.label_booking_url')}</label>
                                <div className={bookingSlugRowCls}>
                                    <span className="shrink-0 px-3 py-3 text-xs text-on-surface-variant border-r border-outline-variant/30 bg-surface-container whitespace-nowrap">{t('admin.settings.booking_path_prefix')}</span>
                                    <input
                                        type="text"
                                        value={identity.data.slug}
                                        onChange={(e) => identity.setData('slug', e.target.value)}
                                        className="flex-1 bg-transparent border-0 outline-none px-3 py-3 text-sm text-on-surface font-medium min-w-0"
                                        placeholder={t('auth_pages.register.booking_slug_ph')}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={copyBookingUrl}
                                        className="shrink-0 p-2 mr-1 hover:bg-surface-container rounded-md transition-colors"
                                        title={t('admin.settings.copy_booking_path')}
                                    >
                                        <Icon name={copiedBooking ? 'check' : 'content_copy'} size="text-base" className="text-on-surface-variant" />
                                    </button>
                                </div>
                                {identity.errors.slug && <p className="text-xs text-error mt-1 font-medium">{identity.errors.slug}</p>}
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">{t('admin.settings.label_logo')}</label>
                                <div className="rounded-2xl border border-dashed border-outline-variant/60 bg-surface-container-lowest ring-1 ring-outline-variant/40 px-4 py-4">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-4 min-w-0">
                                            {selectedLogoPreview || currentLogoUrl ? (
                                                <img
                                                    src={selectedLogoPreview || currentLogoUrl}
                                                    alt={t('admin.settings.logo_alt', {
                                                        name: identity.data.name || t('admin.settings.default_business_name'),
                                                    })}
                                                    className="h-16 w-16 rounded-2xl object-cover border border-outline-variant/30 bg-surface-container"
                                                />
                                            ) : (
                                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container text-on-surface-variant">
                                                    <Icon name="storefront" size="text-2xl" />
                                                </div>
                                            )}

                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-on-surface">
                                                    {identity.data.logo
                                                        ? t('admin.settings.logo_status_new')
                                                        : currentLogoUrl
                                                          ? t('admin.settings.logo_status_current')
                                                          : t('admin.settings.logo_status_none')}
                                                </p>
                                                <p className="mt-1 text-xs text-on-surface-variant">{t('admin.settings.logo_help')}</p>
                                            </div>
                                        </div>

                                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface ring-1 ring-outline-variant hover:bg-surface-container transition-colors">
                                            <Icon name="upload" size="text-base" />
                                            {t('admin.settings.choose_logo')}
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
                        <div className="pt-6 mt-6 border-t border-outline-variant/40 flex items-center justify-end gap-4">
                            {identity.recentlySuccessful && (
                                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                                    <Icon name="check_circle" size="text-sm" className="text-on-primary-container" /> {t('admin.settings.saved_success')}
                                </p>
                            )}
                            <button
                                type="submit"
                                disabled={identity.processing}
                                className="bg-on-surface text-surface px-10 py-4 rounded-xl font-bold font-headline text-base hover:opacity-90 active:-translate-y-px transition-all disabled:opacity-50"
                            >
                                {identity.processing ? t('admin.settings.saving') : t('admin.settings.save_configuration')}
                            </button>
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
                            <h3 className="text-xl font-bold font-headline text-on-surface">{t('admin.settings.rules_section')}</h3>
                        </div>

                        {/* Top row: three numeric rules in a grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                            <div className="bg-surface rounded-xl p-6 flex flex-col gap-4">
                                <div>
                                    <p className="text-sm font-bold text-on-surface">{t('admin.settings.slot_duration_title')}</p>
                                    <p className="text-xs text-on-surface-variant mt-0.5 leading-tight">{t('admin.settings.slot_duration_help')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number" min="5" max="240"
                                        value={data.slot_duration}
                                        onChange={e => setData('slot_duration', parseInt(e.target.value))}
                                        className={rulesNumberCls}
                                    />
                                    <span className="text-xs font-bold text-on-surface-variant uppercase">{t('admin.settings.unit_min')}</span>
                                </div>
                            </div>

                            <div className="bg-surface rounded-xl p-6 flex flex-col gap-4">
                                <div>
                                    <p className="text-sm font-bold text-on-surface">{t('admin.settings.min_notice_title')}</p>
                                    <p className="text-xs text-on-surface-variant mt-0.5 leading-tight">{t('admin.settings.min_notice_help')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number" min="0"
                                        value={data.min_booking_notice}
                                        onChange={e => setData('min_booking_notice', parseInt(e.target.value))}
                                        className={rulesNumberCls}
                                    />
                                    <span className="text-xs font-bold text-on-surface-variant uppercase">{t('admin.settings.unit_min')}</span>
                                </div>
                            </div>

                            <div className="bg-surface rounded-xl p-6 flex flex-col gap-4">
                                <div>
                                    <p className="text-sm font-bold text-on-surface">{t('admin.settings.booking_window_title')}</p>
                                    <p className="text-xs text-on-surface-variant mt-0.5 leading-tight">{t('admin.settings.booking_window_help')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number" min="1" max="365"
                                        value={data.max_booking_window}
                                        onChange={e => setData('max_booking_window', parseInt(e.target.value))}
                                        className={rulesNumberCls}
                                    />
                                    <span className="text-xs font-bold text-on-surface-variant uppercase">{t('admin.settings.unit_days')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom row: Client Identification + I also work as staff (if applicable) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-outline-variant/40">

                            {whatsappEnabled ? (
                                <div className="bg-surface rounded-xl p-6">
                                    <p className="text-sm font-bold text-on-surface mb-1">{t('admin.settings.client_id_title')}</p>
                                    <p className="text-xs text-on-surface-variant mb-4">{t('admin.settings.client_id_help')}</p>
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
                                            {t('admin.settings.client_id_phone')}
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
                                            {t('admin.settings.client_id_email')}
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            <div className="bg-surface rounded-xl p-6 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-bold text-on-surface">{t('admin.settings.allow_service_edit_title')}</p>
                                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                                        {t('admin.settings.allow_service_edit_help')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setData('allow_employee_service_edit', !data.allow_employee_service_edit)}
                                    className={`relative shrink-0 w-12 h-6 rounded-full transition-colors duration-200 ${
                                        data.allow_employee_service_edit ? 'bg-on-surface' : 'bg-surface-container-highest'
                                    }`}
                                    aria-pressed={data.allow_employee_service_edit}
                                >
                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                                        data.allow_employee_service_edit ? 'right-1' : 'left-1'
                                    }`} />
                                </button>
                            </div>

                            <div className="bg-surface rounded-xl p-6 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-bold text-on-surface">{t('admin.settings.auto_confirm_title')}</p>
                                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                                        {t('admin.settings.auto_confirm_help')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setData('auto_confirm_appointments', !data.auto_confirm_appointments)}
                                    className={`relative shrink-0 w-12 h-6 rounded-full transition-colors duration-200 ${
                                        data.auto_confirm_appointments ? 'bg-on-surface' : 'bg-surface-container-highest'
                                    }`}
                                    aria-pressed={data.auto_confirm_appointments}
                                >
                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                                        data.auto_confirm_appointments ? 'right-1' : 'left-1'
                                    }`} />
                                </button>
                            </div>

                            <div className={`bg-surface rounded-xl p-6 flex items-center justify-between gap-4 ${show_owner_staff_toggle ? '' : 'sm:col-span-2'}`}>
                                <div>
                                    <p className="text-sm font-bold text-on-surface">{t('admin.settings.uses_shared_resources_title')}</p>
                                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                                        {t('admin.settings.uses_shared_resources_help')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setData('uses_shared_resources', !data.uses_shared_resources)}
                                    className={`relative shrink-0 w-12 h-6 rounded-full transition-colors duration-200 ${
                                        data.uses_shared_resources ? 'bg-on-surface' : 'bg-surface-container-highest'
                                    }`}
                                    aria-pressed={data.uses_shared_resources}
                                >
                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                                        data.uses_shared_resources ? 'right-1' : 'left-1'
                                    }`} />
                                </button>
                            </div>

                            {/* I also work as staff — optional second-row card */}
                            {show_owner_staff_toggle && (
                                <div className="bg-surface rounded-xl p-6 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-bold text-on-surface">{t('admin.settings.owner_staff_title')}</p>
                                        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                                            {t('admin.settings.owner_staff_help')}
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
                        <div className="mt-6 pt-6 border-t border-outline-variant/40 flex items-center justify-end gap-4">
                            {recentlySuccessful && (
                                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                                    <Icon name="check_circle" size="text-sm" className="text-on-primary-container" /> {t('admin.settings.saved_success')}
                                </p>
                            )}
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-on-surface text-surface px-10 py-4 rounded-xl font-bold font-headline text-base hover:opacity-90 active:-translate-y-px transition-all disabled:opacity-50"
                            >
                                {processing ? t('admin.settings.saving') : t('admin.settings.save_configuration')}
                            </button>
                        </div>
                    </section>
                </form>
                )}

            </div>

            {confirmSection === 'identity' && (
                <ConfirmSaveModal
                    section="identity"
                    onConfirm={doSaveIdentity}
                    onCancel={() => setConfirmSection(null)}
                />
            )}

            {confirmSection === 'rules' && (
                <ConfirmSaveModal
                    section="rules"
                    onConfirm={doSaveRules}
                    onCancel={() => setConfirmSection(null)}
                />
            )}
        </AdminLayout>
    );
}
