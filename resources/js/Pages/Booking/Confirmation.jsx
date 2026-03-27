import { Head } from '@inertiajs/react';
import Icon from '@/Components/Icon';
import { appointmentDateOnly, formatAppointmentDate, formatTimeHm } from '@/utils/appointmentDate';

function buildCalendarUrl(apt) {
    const ymd = appointmentDateOnly(apt.date);
    if (!ymd || !apt.start_time) return null;
    const toGcalDate = (dateYmd, timeStr) => {
        const [y, m, d] = dateYmd.split('-');
        const hm = formatTimeHm(timeStr);
        const [h, min] = hm.split(':');
        return `${y}${m}${d}T${h}${min}00`;
    };
    const start = toGcalDate(ymd, apt.start_time);
    const end = toGcalDate(ymd, apt.end_time || apt.start_time);
    const title = apt.service?.name || 'Appointment';
    const details = `Professional: ${apt.employee?.name || ''}`;
    const location = apt.business?.location || '';
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
}

export default function Confirmation({ appointment }) {
    const apt = appointment;

    const dateLong = formatAppointmentDate(apt.date, { day: 'numeric', month: 'long', year: 'numeric' });
    const dateShort = formatAppointmentDate(apt.date, { weekday: 'long', day: 'numeric', month: 'long' });

    const calendarUrl = buildCalendarUrl(apt);

    return (
        <div className="min-h-screen bg-surface font-body text-on-surface">
            <Head title="Booking Confirmed" />

            <div className="w-full h-1 bg-surface-container-highest">
                <div className="h-full bg-on-surface w-full transition-all duration-700" />
            </div>

            <header className="sticky top-0 z-50 glass-header border-b border-outline-variant/20">
                <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
                    <p className="text-xl font-extrabold tracking-tight text-on-surface font-headline">
                        {apt.business?.name || 'Scheduler'}
                    </p>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-6 pt-12 pb-24">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-tertiary-fixed mb-6">
                        <Icon name="check_circle" size="text-4xl" filled className="text-on-tertiary-fixed" />
                    </div>
                    <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mb-2">
                        Your Appointment is Confirmed!
                    </h2>
                    <p className="text-on-surface-variant text-lg">
                        {dateShort !== '—' ? `See you on ${dateShort}.` : 'Your booking details are below.'}
                    </p>
                </div>

                <div className="bg-surface-container-lowest rounded-xl p-8 mb-10 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
                    <p className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-8">
                        Booking Summary
                    </p>

                    <div className="space-y-8">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center shrink-0 text-on-primary-container text-xl font-bold font-headline">
                                {apt.employee?.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </div>
                            <div>
                                <p className="text-sm text-on-surface-variant mb-1">Service & Professional</p>
                                <p className="font-headline text-lg font-bold text-on-surface">
                                    {apt.service?.name || 'Appointment'}
                                </p>
                                <p className="text-on-surface-variant text-sm">
                                    with {apt.employee?.name}
                                    {apt.employee?.title ? ` · ${apt.employee.title}` : ''}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-surface-container-low p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2 text-on-surface">
                                    <Icon name="calendar_today" size="text-sm" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Date</span>
                                </div>
                                <p className="font-headline font-bold text-on-surface">{dateLong}</p>
                            </div>
                            <div className="bg-surface-container-low p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2 text-on-surface">
                                    <Icon name="schedule" size="text-sm" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Time</span>
                                </div>
                                <p className="font-headline font-bold text-on-surface">
                                    {formatTimeHm(apt.start_time)} — {formatTimeHm(apt.end_time)}
                                </p>
                            </div>
                        </div>

                        {apt.business?.location && (
                            <div className="flex items-start gap-4 pt-2">
                                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                                    <Icon name="location_on" className="text-on-surface" />
                                </div>
                                <div>
                                    <p className="text-sm text-on-surface-variant mb-1">Business Location</p>
                                    <p className="font-headline font-bold text-on-surface">{apt.business.name}</p>
                                    <p className="text-on-surface-variant text-sm">{apt.business.location}</p>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-outline-variant flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Icon name="tag" size="text-sm" className="text-on-surface-variant" />
                                <span className="text-xs text-on-surface-variant font-semibold">
                                    Ref #{String(apt.id).padStart(6, '0')}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-headline text-xl font-extrabold text-on-surface">
                                    {apt.business?.currency_symbol ?? '€'}{Number(apt.price).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {calendarUrl && (
                        <a
                            href={calendarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="primary-gradient text-white font-headline font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-black/10"
                        >
                            <Icon name="event_available" />
                            Add to Calendar
                        </a>
                    )}
                    <a
                        href="/"
                        className="bg-surface-container-high text-on-surface font-headline font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-surface-container-highest"
                    >
                        <Icon name="home" />
                        Return Home
                    </a>
                </div>

                <p className="mt-8 text-center text-on-surface-variant text-xs max-w-xs mx-auto">
                    Need to reschedule? Contact the business at least 24 hours before your appointment time.
                </p>
            </main>
        </div>
    );
}
