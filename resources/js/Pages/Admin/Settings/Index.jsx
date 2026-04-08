import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';

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

    const { data, setData, put, processing, recentlySuccessful } = useForm({
        slot_duration: settings.slot_duration || 30,
        min_booking_notice: settings.min_booking_notice || 120,
        max_booking_window: settings.max_booking_window || 30,
        services_enabled: settings.services_enabled ?? true,
        client_identifier_type: settings.client_identifier_type || 'phone',
        ...(show_owner_staff_toggle ? { owner_also_works_as_staff: !!owner_also_works_as_staff } : {}),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.settings.update'));
    };

    const bookingUrl = (() => {
        try { return route('booking.index', { slug: settings.slug }); } catch { return `${window.location.origin}/book/${settings.slug}`; }
    })();

    const copyBookingUrl = () => navigator.clipboard.writeText(bookingUrl);

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
                <p className="text-on-surface-variant max-w-2xl text-base leading-relaxed">View your business identity and configure booking rules for your clients.</p>
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

            {flash?.success && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl bg-tertiary-fixed/20 px-5 py-4 text-sm font-medium text-on-tertiary-container">
                    <Icon name="check_circle" size="text-lg" filled />
                    <span>{flash.success}</span>
                </div>
            )}

            <div className="space-y-8">

                {/* Business Identity — read-only */}
                <section className="bg-surface-container-low p-8 rounded-xl">
                    <div className="flex items-center gap-3 mb-8">
                        <Icon name="domain" size="text-xl" className="text-on-surface" />
                        <h3 className="text-xl font-bold font-headline text-on-surface">Business Identity</h3>
                        <span className="ml-auto text-[10px] font-bold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full uppercase tracking-widest">Read only</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <ReadOnlyField label="Business Name" value={settings.name} icon="store" />
                        <ReadOnlyField label="Account Email" value={owner_email} icon="mail" />
                        <ReadOnlyField label="Phone Number" value={settings.phone} icon="phone" />
                        <ReadOnlyField label="Location" value={settings.location} icon="location_on" />

                        <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Booking URL</label>
                            <div className="flex items-center bg-surface-container-highest rounded-lg overflow-hidden opacity-80">
                                <span className="shrink-0 px-3 py-3 text-xs text-on-surface-variant border-r border-outline-variant/40 bg-surface-container whitespace-nowrap">/book/</span>
                                <span className="flex-1 px-3 py-3 text-sm text-on-surface font-medium truncate select-all">{settings.slug}</span>
                                <button
                                    type="button"
                                    onClick={copyBookingUrl}
                                    className="shrink-0 p-2 mr-1 hover:bg-surface-container rounded-md transition-colors"
                                    title="Copy URL"
                                >
                                    <Icon name="content_copy" size="text-base" className="text-on-surface-variant" />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Booking Rules — editable */}
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
                                        className="w-24 bg-surface-container-highest border-0 rounded-lg py-2 px-3 text-sm font-bold text-on-surface shadow-sm focus:ring-2 focus:ring-on-surface/10 text-center"
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
                                        className="w-24 bg-surface-container-highest border-0 rounded-lg py-2 px-3 text-sm font-bold text-on-surface shadow-sm focus:ring-2 focus:ring-on-surface/10 text-center"
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
                                        className="w-24 bg-surface-container-highest border-0 rounded-lg py-2 px-3 text-sm font-bold text-on-surface shadow-sm focus:ring-2 focus:ring-on-surface/10 text-center"
                                    />
                                    <span className="text-xs font-bold text-on-surface-variant uppercase">days</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom row: Service Selection + Client Identification side by side */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-outline-variant/40">

                            {/* Service Selection toggle */}
                            <div className="bg-surface rounded-xl p-6 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-bold text-on-surface">Service Selection</p>
                                    <p className="text-xs text-on-surface-variant mt-0.5">Allow clients to pick specific treatments.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setData('services_enabled', !data.services_enabled)}
                                    className={`relative shrink-0 w-12 h-6 rounded-full transition-colors duration-200 ${data.services_enabled ? 'bg-on-surface' : 'bg-surface-container-highest'}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${data.services_enabled ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>

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
                                                : 'border-outline-variant bg-surface-container-highest text-on-surface-variant hover:border-on-surface/40'
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
                                                : 'border-outline-variant bg-surface-container-highest text-on-surface-variant hover:border-on-surface/40'
                                        }`}
                                    >
                                        <Icon name="mail" size="text-base" />
                                        Email
                                    </button>
                                </div>
                            </div>
                        </div>

                        {show_owner_staff_toggle && (
                            <div className="pt-6 border-t border-outline-variant/40">
                                <div className="bg-surface rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="max-w-xl">
                                        <p className="text-sm font-bold text-on-surface">I also work as staff</p>
                                        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                                            Turn this on if you take appointments yourself. You will appear on the public
                                            booking page and in the team list so you can assign services and set your
                                            schedule like other employees. Your account stays the business owner.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setData('owner_also_works_as_staff', !data.owner_also_works_as_staff)}
                                        className={`relative shrink-0 w-12 h-6 rounded-full transition-colors duration-200 self-start sm:self-center ${
                                            data.owner_also_works_as_staff ? 'bg-on-surface' : 'bg-surface-container-highest'
                                        }`}
                                        aria-pressed={data.owner_also_works_as_staff}
                                    >
                                        <span
                                            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                                                data.owner_also_works_as_staff ? 'right-1' : 'left-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        )}

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

            </div>
        </AdminLayout>
    );
}
