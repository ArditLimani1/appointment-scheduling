import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';

function slugify(v) {
    return v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

export default function Index({ settings, owner_email }) {
    const { flash } = usePage().props;
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        name: settings.name || '',
        slug: settings.slug || '',
        location: settings.location || '',
        phone: settings.phone || '',
        slot_duration: settings.slot_duration || 30,
        min_booking_notice: settings.min_booking_notice || 120,
        max_booking_window: settings.max_booking_window || 30,
        services_enabled: settings.services_enabled ?? true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.settings.update'));
    };

    const bookingUrl = (() => {
        try { return route('booking.index', { slug: data.slug || settings.slug }); } catch { return '#'; }
    })();

    const copySlug = () => {
        if (data.slug) navigator.clipboard.writeText(bookingUrl);
    };

    const inputClass = "w-full bg-surface-container-highest border-0 rounded-lg py-3 px-4 text-sm text-on-surface font-medium placeholder-on-surface-variant/50 focus:ring-2 focus:ring-on-surface/10 transition-all";
    const labelClass = "block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2";

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
                <p className="text-on-surface-variant max-w-2xl text-base leading-relaxed">Refine your brand identity and operational constraints for a seamless booking experience.</p>
            </header>

            {flash?.info && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-outline-variant/40 bg-primary-container/15 px-5 py-4 text-sm text-on-surface">
                    <Icon name="info" size="text-lg" className="mt-0.5 shrink-0 text-on-surface" />
                    <div>
                        <p className="font-bold">Finish business setup to unlock the dashboard.</p>
                        <p className="mt-1 text-on-surface-variant">
                            {flash.info}
                        </p>
                    </div>
                </div>
            )}

            {flash?.success && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl bg-tertiary-fixed/20 px-5 py-4 text-sm font-medium text-on-tertiary-container">
                    <Icon name="check_circle" size="text-lg" filled />
                    <span>{flash.success}</span>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    <section className="lg:col-span-7">
                        <div className="bg-surface-container-low p-8 rounded-xl">
                            <div className="flex items-center gap-3 mb-8">
                                <Icon name="domain" size="text-xl" className="text-on-surface" />
                                <h3 className="text-xl font-bold font-headline text-on-surface">Business Identity</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>Business Name</label>
                                    <input
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        className={inputClass}
                                        placeholder="Bella's Hair Studio"
                                        required
                                    />
                                    <InputError message={errors.name} className="mt-1" />
                                </div>

                                <div>
                                    <label className={labelClass}>Booking URL</label>
                                    <div className="flex items-center bg-surface-container-highest rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-on-surface/10">
                                        <span className="shrink-0 px-3 py-3 text-xs text-on-surface-variant border-r border-outline-variant/40 bg-surface-container whitespace-nowrap">/book/</span>
                                        <input
                                            value={data.slug}
                                            onChange={e => setData('slug', slugify(e.target.value))}
                                            className="flex-1 border-0 bg-transparent px-3 py-3 text-sm text-on-surface font-medium focus:ring-0 focus:outline-none"
                                            placeholder="my-business"
                                        />
                                        <button type="button" onClick={copySlug} className="shrink-0 p-2 mr-1 hover:bg-surface-container rounded-md transition-colors" title="Copy URL">
                                            <Icon name="content_copy" size="text-base" className="text-on-surface-variant" />
                                        </button>
                                    </div>
                                    <InputError message={errors.slug} className="mt-1" />
                                </div>

                                <div>
                                    <label className={labelClass}>Account Email</label>
                                    <input
                                        type="email"
                                        value={owner_email}
                                        disabled
                                        className="w-full bg-surface-container-highest border-0 rounded-lg py-3 px-4 text-sm text-on-surface-variant font-medium cursor-not-allowed opacity-60"
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Phone Number</label>
                                    <input
                                        type="tel"
                                        value={data.phone}
                                        onChange={e => setData('phone', e.target.value)}
                                        className={inputClass}
                                        placeholder="+1 555 000 0000"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className={labelClass}>Location</label>
                                    <div className="relative">
                                        <Icon name="location_on" size="text-lg" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                                        <input
                                            value={data.location}
                                            onChange={e => setData('location', e.target.value)}
                                            className={`${inputClass} pl-10`}
                                            placeholder="123 Main St, New York"
                                        />
                                    </div>
                                    <InputError message={errors.location} className="mt-1" />
                                </div>
                            </div>
                        </div>
                    </section>

                    <aside className="lg:col-span-5 space-y-6">
                        <div className="bg-surface-container-low p-8 rounded-xl sticky top-24">
                            <div className="flex items-center gap-3 mb-8">
                                <Icon name="rule" size="text-xl" className="text-on-surface" />
                                <h3 className="text-xl font-bold font-headline text-on-surface">Booking Rules</h3>
                            </div>

                            <div className="space-y-7">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-bold text-on-surface">Time Slot Duration</p>
                                        <p className="text-xs text-on-surface-variant mt-0.5 leading-tight">Minimum interval between available appointments.</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <input
                                            type="number"
                                            min="5"
                                            max="240"
                                            value={data.slot_duration}
                                            onChange={e => setData('slot_duration', parseInt(e.target.value))}
                                            className="w-20 bg-white border-0 rounded-lg py-2 px-3 text-sm font-bold text-on-surface shadow-sm focus:ring-2 focus:ring-on-surface/10 text-center"
                                        />
                                        <span className="text-xs font-bold text-on-surface-variant uppercase">min</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-bold text-on-surface">Minimum Notice</p>
                                        <p className="text-xs text-on-surface-variant mt-0.5 leading-tight">Lead time required before a booking can be made.</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <input
                                            type="number"
                                            min="0"
                                            value={data.min_booking_notice}
                                            onChange={e => setData('min_booking_notice', parseInt(e.target.value))}
                                            className="w-20 bg-white border-0 rounded-lg py-2 px-3 text-sm font-bold text-on-surface shadow-sm focus:ring-2 focus:ring-on-surface/10 text-center"
                                        />
                                        <span className="text-xs font-bold text-on-surface-variant uppercase">min</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-bold text-on-surface">Booking Window</p>
                                        <p className="text-xs text-on-surface-variant mt-0.5 leading-tight">How far in advance clients can schedule.</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <input
                                            type="number"
                                            min="1"
                                            max="365"
                                            value={data.max_booking_window}
                                            onChange={e => setData('max_booking_window', parseInt(e.target.value))}
                                            className="w-20 bg-white border-0 rounded-lg py-2 px-3 text-sm font-bold text-on-surface shadow-sm focus:ring-2 focus:ring-on-surface/10 text-center"
                                        />
                                        <span className="text-xs font-bold text-on-surface-variant uppercase">days</span>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-outline-variant/40 flex items-center justify-between gap-4">
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

                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full bg-on-surface text-surface py-4 rounded-xl font-bold font-headline text-base hover:opacity-90 active:-translate-y-px transition-all disabled:opacity-50"
                                    >
                                        {processing ? 'Saving...' : 'Save Configuration'}
                                    </button>
                                    {recentlySuccessful && (
                                        <p className="text-center mt-3 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                                            <Icon name="check_circle" size="text-sm" className="text-on-primary-container" /> Saved successfully
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-primary-container p-6 rounded-xl">
                            <Icon name="tips_and_updates" size="text-2xl" className="text-primary-fixed mb-3" />
                            <h4 className="font-bold text-base text-white mb-2">Optimization Tip</h4>
                            <p className="text-sm text-slate-300 leading-relaxed">Reducing your Booking Window to 30 days can increase appointment density by up to 22% for boutique studios.</p>
                        </div>
                    </aside>

                </div>
            </form>
        </AdminLayout>
    );
}
