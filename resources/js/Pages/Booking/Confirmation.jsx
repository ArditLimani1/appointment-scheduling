import { Head, Link } from '@inertiajs/react';
import Icon from '@/Components/Icon';

export default function Confirmation({ appointment }) {
    const apt = appointment;
    const dateFormatted = new Date(apt.date + 'T00:00:00').toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    return (
        <div className="min-h-screen bg-surface font-body flex flex-col items-center justify-center px-4 py-12">
            <Head title="Booking Confirmed" />

            {/* Success icon */}
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-container mb-6">
                <Icon name="check_circle" size="text-5xl" filled className="text-on-primary-container" />
            </div>

            <h1 className="text-3xl font-black font-headline text-on-surface tracking-tight text-center mb-2">
                You're All Set!
            </h1>
            <p className="text-on-surface-variant text-sm text-center mb-8 max-w-sm">
                Your appointment has been booked successfully. We'll be in touch if anything changes.
            </p>

            {/* Appointment card */}
            <div className="w-full max-w-md rounded-3xl bg-surface-container-lowest border border-outline-variant p-6 mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Booking Summary</p>

                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-container">
                            <Icon name="person" size="text-lg" className="text-on-primary-container" />
                        </div>
                        <div>
                            <p className="text-xs text-on-surface-variant">Client</p>
                            <p className="font-semibold text-on-surface">
                                {apt.client_first_name} {apt.client_last_name}
                            </p>
                            <p className="text-xs text-on-surface-variant">{apt.client_phone}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary-container">
                            <Icon name="badge" size="text-lg" className="text-on-secondary-container" />
                        </div>
                        <div>
                            <p className="text-xs text-on-surface-variant">Provider</p>
                            <p className="font-semibold text-on-surface">{apt.employee?.name}</p>
                            {apt.employee?.title && <p className="text-xs text-on-surface-variant">{apt.employee.title}</p>}
                        </div>
                    </div>

                    {apt.service && (
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-container-low">
                                <Icon name={apt.service.icon || 'content_cut'} size="text-lg" className="text-on-surface-variant" />
                            </div>
                            <div>
                                <p className="text-xs text-on-surface-variant">Service</p>
                                <p className="font-semibold text-on-surface">{apt.service.name}</p>
                                <p className="text-xs text-on-surface-variant">{apt.service.duration} min</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-tertiary-fixed/20">
                            <Icon name="calendar_month" size="text-lg" className="text-on-tertiary-container" />
                        </div>
                        <div>
                            <p className="text-xs text-on-surface-variant">Date & Time</p>
                            <p className="font-semibold text-on-surface">{dateFormatted}</p>
                            <p className="text-xs text-on-surface-variant">{apt.start_time} – {apt.end_time}</p>
                        </div>
                    </div>

                    <div className="border-t border-outline-variant pt-4 flex items-center justify-between">
                        <p className="text-sm text-on-surface-variant">Total</p>
                        <p className="text-xl font-black font-headline text-on-surface">€{Number(apt.price).toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Reference number */}
            <div className="mb-8 flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2">
                <Icon name="tag" size="text-sm" className="text-on-surface-variant" />
                <span className="text-xs font-semibold text-on-surface-variant">Reference #</span>
                <span className="text-xs font-bold text-on-surface">{String(apt.id).padStart(6, '0')}</span>
                <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase bg-secondary-container text-on-secondary-container`}>
                    {apt.status}
                </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <a
                    href={route('booking.index')}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-outline-variant px-5 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                >
                    <Icon name="add_circle" size="text-lg" /> Book Another
                </a>
                <a
                    href="/"
                    className="flex-1 primary-gradient flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg"
                >
                    <Icon name="home" size="text-lg" /> Go to Home
                </a>
            </div>
        </div>
    );
}
