import { Head, Link } from '@inertiajs/react';
import Icon from '@/Components/Icon';
import { useT } from '@/i18n/useT';
import { formatAppointmentDate, formatTimeHm } from '@/utils/appointmentDate';

export default function Confirmation({ appointment, bookingBundle }) {
    const t = useT();
    const bundle = bookingBundle?.length ? bookingBundle : [appointment];
    const apt = bundle[0];

    const dateLong = formatAppointmentDate(apt.date, { day: 'numeric', month: 'long', year: 'numeric' });
    const dateShort = formatAppointmentDate(apt.date, { weekday: 'long', day: 'numeric', month: 'long' });

    const totalPrice = bundle.reduce((sum, a) => sum + Number(a.price || 0), 0);
    const currencySymbol = apt.business?.currency_symbol ?? '€';
    const bookingSlug = apt.business?.slug;
    const businessName = apt.business?.name || t('booking_ui.confirmation.default_business');

    return (
        <div className="min-h-screen bg-surface font-body text-on-surface">
            <Head title={t('booking_ui.confirmation.submitted_title')} />

            <div className="w-full h-1 bg-surface-container-highest">
                <div className="h-full bg-on-surface w-full transition-all duration-700" />
            </div>

            <header className="sticky top-0 z-50 glass-header border-b border-outline-variant/20">
                <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
                    <p className="text-xl font-extrabold tracking-tight text-on-surface font-headline">
                        {apt.business?.name || t('booking_ui.confirmation.default_scheduler')}
                    </p>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-6 pt-12 pb-24">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-tertiary-fixed mb-6">
                        <Icon name="check_circle" size="text-4xl" filled className="text-on-tertiary-fixed" />
                    </div>
                    <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mb-4">
                        {t('booking_ui.confirmation.submitted_title')}
                    </h2>
                    <p className="text-on-surface text-lg font-medium leading-relaxed">
                        {t('booking_ui.confirmation.thanks', { business: businessName })}
                    </p>
                    {dateShort !== '—' && (
                        <p className="text-on-surface-variant text-sm mt-5">
                            {t('booking_ui.confirmation.requested_time')} <span className="font-semibold text-on-surface">{dateShort}</span>
                        </p>
                    )}
                </div>

                <div className="bg-surface-container-lowest rounded-xl p-8 mb-10 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
                    <p className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-8">
                        {t('booking_ui.confirmation.request_summary')}
                    </p>

                    <div className="space-y-8">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center shrink-0 text-on-primary-container text-xl font-bold font-headline">
                                {apt.employee?.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-on-surface-variant mb-1">{t('booking_ui.confirmation.services_professional')}</p>
                                <ul className="space-y-2">
                                    {bundle.map((row) => (
                                        <li key={row.id} className="font-headline text-base font-bold text-on-surface">
                                            {row.service?.name || t('booking_ui.confirmation.service_fallback')}
                                            <span className="font-medium text-on-surface-variant text-sm ml-2">
                                                {formatTimeHm(row.start_time)} — {formatTimeHm(row.end_time)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-on-surface-variant text-sm mt-2">
                                    {t('booking_ui.confirmation.with_employee', { name: apt.employee?.name || '' })}
                                    {apt.employee?.title ? ` · ${apt.employee.title}` : ''}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-surface-container-low p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2 text-on-surface">
                                    <Icon name="calendar_today" size="text-sm" />
                                    <span className="text-xs font-bold uppercase tracking-wider">{t('booking_ui.confirmation.date')}</span>
                                </div>
                                <p className="font-headline font-bold text-on-surface">{dateLong}</p>
                            </div>
                            <div className="bg-surface-container-low p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2 text-on-surface">
                                    <Icon name="schedule" size="text-sm" />
                                    <span className="text-xs font-bold uppercase tracking-wider">{t('booking_ui.confirmation.time')}</span>
                                </div>
                                <p className="font-headline font-bold text-on-surface">
                                    {formatTimeHm(apt.start_time)} — {formatTimeHm(bundle[bundle.length - 1].end_time || apt.end_time)}
                                </p>
                            </div>
                        </div>

                        {apt.business?.location && (
                            <div className="flex items-start gap-4 pt-2">
                                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                                    <Icon name="location_on" className="text-on-surface" />
                                </div>
                                <div>
                                    <p className="text-sm text-on-surface-variant mb-1">{t('booking_ui.confirmation.business_location')}</p>
                                    <p className="font-headline font-bold text-on-surface">{apt.business.name}</p>
                                    <p className="text-on-surface-variant text-sm">{apt.business.location}</p>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-outline-variant flex items-center justify-end">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{t('booking_ui.confirmation.total')}</span>
                                <span className="font-headline text-xl font-extrabold text-on-surface">
                                    {currencySymbol}{totalPrice.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {bookingSlug ? (
                        <Link
                            href={route('booking.index', { slug: bookingSlug })}
                            className="bg-on-surface text-surface font-headline font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:opacity-90 text-center"
                        >
                            <Icon name="event_repeat" />
                            {t('booking_ui.confirmation.book_another')}
                        </Link>
                    ) : (
                        <a
                            href="/"
                            className="bg-on-surface text-surface font-headline font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:opacity-90 text-center"
                        >
                            <Icon name="event_repeat" />
                            {t('booking_ui.confirmation.book_another')}
                        </a>
                    )}
                </div>

                <p className="mt-8 text-center text-on-surface-variant text-xs max-w-sm mx-auto leading-relaxed">
                    {t('booking_ui.confirmation.change_note')}
                </p>
            </main>
        </div>
    );
}
