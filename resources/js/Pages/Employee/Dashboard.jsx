import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import MetricCard from '@/Components/MetricCard';
import Icon from '@/Components/Icon';
import EmployeeRescheduleModal from '@/Components/EmployeeRescheduleModal';
import { formatTimeHm } from '@/utils/appointmentDate';

const STATUS_STYLES = {
    pending: { bg: 'bg-surface-container-highest text-on-surface-variant', label: 'Pending' },
    confirmed: { bg: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', label: 'Confirmed' },
    cancelled: { bg: 'bg-error-container text-on-error-container', label: 'Cancelled' },
};

function fmt(d, opts) {
    return new Intl.DateTimeFormat('en-GB', opts).format(d);
}

function Toast({ message, onDismiss }) {
    useEffect(() => {
        const t = setTimeout(onDismiss, 5000);
        return () => clearTimeout(t);
    }, [onDismiss]);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-on-surface px-5 py-3 text-sm font-semibold text-surface shadow-xl">
            <Icon name="check_circle" size="text-lg" filled />
            {message}
        </div>
    );
}

function CancelConfirmModal({ appointment, onConfirm, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl">
                <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error-container">
                        <Icon name="warning" size="text-lg" className="text-on-error-container" />
                    </div>
                    <div>
                        <h3 className="font-headline text-base font-bold text-on-surface">Cancel Appointment</h3>
                        <p className="mt-1 text-sm text-on-surface-variant">
                            Are you sure you want to cancel this appointment?
                        </p>
                    </div>
                </div>

                <div className="mb-5 rounded-2xl bg-surface-container-low px-4 py-3 text-sm">
                    <p className="font-semibold text-on-surface">
                        {appointment.client_first_name} {appointment.client_last_name}
                    </p>
                    <p className="text-on-surface-variant mt-0.5">
                        {appointment.service?.name ?? 'Appointment'} · {formatTimeHm(appointment.start_time)}
                    </p>
                </div>

                <div className="flex gap-3 justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                        No, keep it
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-xl bg-error px-5 py-2 text-sm font-semibold text-on-error hover:opacity-90 transition-opacity"
                    >
                        Yes, cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Dashboard({
    appointments = [],
    appointments_count = 0,
    confirmed_appointments = 0,
    cancelled_appointments = 0,
    daily_revenue = 0,
    date_from: dateFromProp,
    employee_compact_mobile_appointments = false,
}) {
    const { auth, flash } = usePage().props;
    const business = auth.business;
    const currencySymbol = business?.currency_symbol ?? '€';
    const todayStr = new Date().toISOString().split('T')[0];

    const [reschedulingApt, setReschedulingApt] = useState(null);
    const [cancellingApt, setCancellingApt] = useState(null);
    const [toast, setToast] = useState(null);

    const lastNonce = useRef(null);
    useEffect(() => {
        if (flash?.nonce && flash.nonce !== lastNonce.current && flash?.success) {
            lastNonce.current = flash.nonce;
            setToast(flash.success);
        }
    }, [flash?.nonce, flash?.success]);

    const dateFrom = dateFromProp ?? todayStr;

    const dayLabel = useMemo(() => {
        const d = new Date(`${dateFrom}T00:00:00`);
        return fmt(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }, [dateFrom]);

    const handleConfirm = (apt) => {
        router.patch(route('employee.appointments.update', apt.id), { status: 'confirmed' }, { preserveScroll: true });
    };

    const openCancelModal = (apt) => setCancellingApt(apt);
    const closeCancelModal = () => setCancellingApt(null);

    const confirmCancel = () => {
        if (!cancellingApt) return;
        const apt = cancellingApt;
        setCancellingApt(null);
        router.patch(route('employee.appointments.update', apt.id), { status: 'cancelled' }, { preserveScroll: true });
    };

    const renderMobileActions = (apt) => {
        const isCancelled = apt.status === 'cancelled';
        const isPending = apt.status === 'pending';
        const isConfirmed = apt.status === 'confirmed';

        return (
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-outline-variant/25">
                {isPending && (
                    <button
                        type="button"
                        onClick={() => handleConfirm(apt)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-950 ring-1 ring-emerald-200/90"
                    >
                        <Icon name="check_circle" size="text-sm" /> Confirm
                    </button>
                )}
                {(isPending || isConfirmed) && (
                    <button
                        type="button"
                        onClick={() => openCancelModal(apt)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-950 ring-1 ring-red-200/90"
                    >
                        <Icon name="cancel" size="text-sm" /> Cancel
                    </button>
                )}
                {!isCancelled && (
                    <button
                        type="button"
                        onClick={() => setReschedulingApt(apt)}
                        className="inline-flex items-center justify-center rounded-xl bg-surface-container-high p-2 text-on-surface"
                        title="Reschedule"
                    >
                        <Icon name="edit_calendar" size="text-base" />
                    </button>
                )}
            </div>
        );
    };

    return (
        <EmployeeLayout>
            <Head title="Dashboard" />

            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Dashboard</h1>
                    <p className="text-on-surface-variant text-lg">{dayLabel}</p>
                </div>
                <Link
                    href={route('employee.appointments.index', {}, false)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-on-surface hover:bg-slate-50"
                >
                    <Icon name="calendar_today" size="text-lg" />
                    All appointments
                </Link>
            </div>

            <section className="mb-6 sm:mb-8">
                <div className="mb-3 sm:mb-5">
                    <h2 className="text-xl font-extrabold font-headline text-on-surface sm:text-2xl">Today at a glance</h2>
                    <p className="mt-0.5 text-xs text-on-surface-variant sm:mt-1 sm:text-sm">Summary for today only.</p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-6 xl:grid-cols-4">
                    <MetricCard
                        icon="event_upcoming"
                        iconBg="bg-primary-fixed"
                        iconClass="text-on-primary-fixed-variant"
                        label="Appointments"
                        value={appointments_count}
                        badge="Today"
                    />
                    <MetricCard
                        icon="check_circle"
                        iconBg="bg-secondary-container"
                        iconClass="text-on-secondary-container"
                        label="Confirmed"
                        value={confirmed_appointments}
                        badge="Approved"
                    />
                    <MetricCard
                        icon="cancel"
                        iconBg="bg-error-container"
                        iconClass="text-on-error-container"
                        label="Cancelled"
                        value={cancelled_appointments}
                        badge="Lost"
                    />
                    <MetricCard
                        variant="primary"
                        icon="payments"
                        label="Revenue"
                        value={`${Number(daily_revenue).toFixed(2)} ${currencySymbol}`}
                    />
                </div>
            </section>

            <div className="min-w-0">
                {appointments.length === 0 ? (
                    <section className="bg-surface-container-lowest rounded-xl p-10 sm:p-12">
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Icon name="event_available" size="text-5xl" className="text-outline mb-4" />
                            <p className="font-semibold text-on-surface mb-1">No reservations today</p>
                            <p className="text-sm text-on-surface-variant">You have nothing scheduled for today.</p>
                        </div>
                    </section>
                ) : (
                    <section className="bg-surface-container-lowest rounded-xl p-4 md:p-8">
                        <div className="flex justify-between items-center mb-4 md:mb-8 gap-3">
                            <h2 className="text-xl md:text-2xl font-extrabold font-headline text-on-surface">Today&rsquo;s reservations</h2>
                        </div>

                        {employee_compact_mobile_appointments ? (
                            <div className="md:hidden space-y-3">
                                {appointments.map((apt) => {
                                    const isCancelled = apt.status === 'cancelled';
                                    const style = STATUS_STYLES[apt.status] || STATUS_STYLES.pending;
                                    return (
                                        <article
                                            key={apt.id}
                                            className={`rounded-2xl border border-outline-variant/35 p-4 shadow-sm ${
                                                isCancelled ? 'bg-error-container/15' : 'bg-surface-container-low/50'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-on-surface leading-snug">
                                                        {apt.client_first_name} {apt.client_last_name}
                                                    </p>
                                                    <p className="text-sm text-on-surface-variant mt-0.5">
                                                        {apt.service?.name ?? 'Appointment'}
                                                    </p>
                                                </div>
                                                <span className={`shrink-0 px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${style.bg}`}>
                                                    {style.label}
                                                </span>
                                            </div>

                                            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface">
                                                    <Icon name="schedule" size="text-sm" className="text-on-surface-variant" />
                                                    {formatTimeHm(apt.start_time)} – {formatTimeHm(apt.end_time)}
                                                </span>
                                                <span className="text-xs text-on-surface-variant">
                                                    {Number(apt.price).toFixed(2)} {currencySymbol}
                                                </span>
                                            </div>

                                            <div className="mt-2 text-sm text-on-surface-variant break-words">
                                                {apt.client_email || apt.client_phone || '—'}
                                            </div>

                                            {apt.client_notes ? (
                                                <p className="mt-2 text-xs text-on-surface-variant italic line-clamp-2">
                                                    &ldquo;{apt.client_notes}&rdquo;
                                                </p>
                                            ) : null}

                                            {renderMobileActions(apt)}
                                        </article>
                                    );
                                })}
                            </div>
                        ) : null}

                        <div
                            className={`overflow-x-auto px-4 sm:px-6 md:px-8${
                                employee_compact_mobile_appointments ? ' hidden md:block' : ''
                            }`}
                        >
                            <table className="w-full min-w-[720px] text-left">
                                <thead>
                                    <tr className="border-b border-surface-container-highest">
                                        <th className="pb-5 pr-3 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant min-w-0">
                                            Client
                                        </th>
                                        <th className="pb-5 pr-3 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant min-w-0">
                                            Service
                                        </th>
                                        <th className="pb-5 pr-3 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant whitespace-nowrap">
                                            Time
                                        </th>
                                        <th className="pb-5 pr-3 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant text-right whitespace-nowrap">
                                            Price
                                        </th>
                                        <th className="pb-5 pr-3 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Status</th>
                                        <th className="pb-5 pr-3 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant min-w-0">
                                            Contact
                                        </th>
                                        <th className="pb-5 pr-3 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant text-center min-w-0">
                                            Approval
                                        </th>
                                        <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant text-center w-14 min-w-[3.5rem]">
                                            Edit
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-container-low">
                                    {appointments.map((apt) => {
                                        const style = STATUS_STYLES[apt.status] || STATUS_STYLES.pending;
                                        const isCancelled = apt.status === 'cancelled';
                                        const isPending = apt.status === 'pending';
                                        const isConfirmed = apt.status === 'confirmed';

                                        return (
                                            <tr
                                                key={apt.id}
                                                className={`transition-colors align-middle ${
                                                    isCancelled ? 'bg-error-container/15' : 'hover:bg-surface-container-low/50'
                                                }`}
                                            >
                                                <td className="py-4 pr-3 min-w-0">
                                                    <p className="font-bold text-on-surface truncate">
                                                        {apt.client_first_name} {apt.client_last_name}
                                                    </p>
                                                    {apt.client_notes ? (
                                                        <p className="mt-0.5 text-xs text-on-surface-variant italic line-clamp-1">
                                                            &ldquo;{apt.client_notes}&rdquo;
                                                        </p>
                                                    ) : null}
                                                </td>
                                                <td className="py-4 pr-3 min-w-0">
                                                    <span className="block truncate text-sm text-on-surface-variant">
                                                        {apt.service?.name ?? 'Appointment'}
                                                    </span>
                                                </td>
                                                <td className="py-4 pr-3 whitespace-nowrap">
                                                    <p className="text-on-surface text-sm font-semibold tabular-nums">
                                                        {formatTimeHm(apt.start_time)} – {formatTimeHm(apt.end_time)}
                                                    </p>
                                                </td>
                                                <td className="py-4 pr-3 text-right whitespace-nowrap">
                                                    <span className="text-sm font-semibold text-on-surface tabular-nums">
                                                        {Number(apt.price).toFixed(2)} {currencySymbol}
                                                    </span>
                                                </td>
                                                <td className="py-4 pr-3">
                                                    <span className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-full ${style.bg}`}>
                                                        {style.label}
                                                    </span>
                                                </td>
                                                <td className="py-4 pr-3 min-w-0">
                                                    <span
                                                        className="block truncate text-sm text-on-surface-variant"
                                                        title={apt.client_email || apt.client_phone || undefined}
                                                    >
                                                        {apt.client_email || apt.client_phone || '—'}
                                                    </span>
                                                </td>
                                                <td className="py-4 pr-3 text-center min-w-0">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {isPending && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleConfirm(apt)}
                                                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-950 ring-1 ring-emerald-200/90 hover:bg-emerald-100/90 transition-colors"
                                                            >
                                                                <Icon name="check_circle" size="text-sm" />
                                                                Confirm
                                                            </button>
                                                        )}
                                                        {(isPending || isConfirmed) && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openCancelModal(apt)}
                                                                className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-bold text-red-950 ring-1 ring-red-200/90 hover:bg-red-100/90 transition-colors"
                                                            >
                                                                <Icon name="cancel" size="text-sm" />
                                                                Cancel
                                                            </button>
                                                        )}
                                                        {isCancelled && (
                                                            <span className="text-xs text-on-surface-variant/60">—</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 pr-0 text-center w-14 min-w-[3.5rem]">
                                                    {!isCancelled ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setReschedulingApt(apt)}
                                                            className="inline-flex items-center justify-center rounded-xl bg-surface-container-high p-2 text-on-surface hover:bg-surface-container-highest transition-colors"
                                                            title="Reschedule"
                                                        >
                                                            <Icon name="edit_calendar" size="text-base" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-on-surface-variant/60">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>

            {reschedulingApt && (
                <EmployeeRescheduleModal appointment={reschedulingApt} onClose={() => setReschedulingApt(null)} />
            )}

            {cancellingApt && (
                <CancelConfirmModal appointment={cancellingApt} onConfirm={confirmCancel} onClose={closeCancelModal} />
            )}

            {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
        </EmployeeLayout>
    );
}
