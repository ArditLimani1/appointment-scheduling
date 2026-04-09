import { Head, Link, router, usePage } from '@inertiajs/react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import MetricCard from '@/Components/MetricCard';
import Icon from '@/Components/Icon';
import DatePicker from '@/Components/DatePicker';
import { formatAppointmentDate, formatTimeHm } from '@/utils/appointmentDate';
import { useMemo } from 'react';

const STATUS_STYLES = {
    pending: { bg: 'bg-surface-container-highest text-on-surface-variant', label: 'Pending' },
    confirmed: { bg: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', label: 'Confirmed' },
    cancelled: { bg: 'bg-error-container text-on-error-container', label: 'Cancelled' },
};

const STATUS_ACTIONS = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['cancelled'],
    cancelled: [],
};

const ACTION_LABELS = {
    confirmed: { label: 'Confirm', icon: 'check_circle' },
    cancelled: { label: 'Cancel', icon: 'cancel' },
};

function fmt(d, opts) {
    return new Intl.DateTimeFormat('en-GB', opts).format(d);
}

function AppointmentStatusBadge({ status }) {
    const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
    return (
        <span className={`shrink-0 px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${style.bg}`}>
            {style.label}
        </span>
    );
}

function AppointmentActionButtons({ appointment, onStatusChange, align = 'end' }) {
    const actions = STATUS_ACTIONS[appointment.status] || [];
    if (actions.length === 0) {
        return <span className="text-xs text-on-surface-variant">No actions</span>;
    }
    const justify = align === 'start' ? 'justify-start' : 'justify-end';
    return (
        <div className={`flex flex-wrap gap-2 ${justify}`}>
            {actions.map((action) => {
                const info = ACTION_LABELS[action];
                const isDanger = action === 'cancelled';
                return (
                    <button
                        key={action}
                        type="button"
                        onClick={() => onStatusChange(appointment, action)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                            isDanger
                                ? 'bg-error-container text-on-error-container hover:opacity-80'
                                : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                        }`}
                    >
                        <Icon name={info.icon} size="text-sm" />
                        {info.label}
                    </button>
                );
            })}
        </div>
    );
}

export default function Dashboard({
    appointments = [],
    appointments_count = 0,
    confirmed_appointments = 0,
    cancelled_appointments = 0,
    completed_appointments = 0,
    daily_revenue = 0,
    date_from: dateFromProp,
    date_to: dateToProp,
    /** Only the employee dashboard controller sets this; admin appointment lists stay table-only on mobile. */
    employee_compact_mobile_appointments = false,
}) {
    const { auth } = usePage().props;
    const business = auth.business;
    const permissions = auth.permissions ?? [];
    const canAppointments = permissions.includes('employee.appointments');
    const currencySymbol = business?.currency_symbol ?? '€';
    const todayStr = new Date().toISOString().split('T')[0];

    const dateFrom = dateFromProp ?? todayStr;
    const dateTo = dateToProp ?? todayStr;

    const isRange = dateFrom !== dateTo;
    const isToday = dateFrom === todayStr && dateTo === todayStr;

    const rangeLabel = useMemo(() => {
        const d1 = new Date(`${dateFrom}T00:00:00`);
        const d2 = new Date(`${dateTo}T00:00:00`);
        if (!isRange) {
            return fmt(d1, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        }
        return `${fmt(d1, { day: 'numeric', month: 'short', year: 'numeric' })} – ${fmt(d2, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }, [dateFrom, dateTo, isRange]);

    const goToRange = (from, to) => {
        router.get(route('employee.dashboard'), { date_from: from, date_to: to }, { preserveState: false });
    };

    const handleFromChange = (v) => {
        if (!v) return;
        const to = dateTo >= v ? dateTo : v;
        goToRange(v, to);
    };

    const handleToChange = (v) => {
        if (!v) return;
        if (v < dateFrom) {
            goToRange(dateFrom, dateFrom);
        } else {
            goToRange(dateFrom, v);
        }
    };

    const updateStatus = (apt, status) => {
        router.patch(route('employee.appointments.update', apt.id), { status }, { preserveScroll: true });
    };

    return (
        <EmployeeLayout>
            <Head title="Appointments" />

            <div className="mb-8">
                <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Appointments</h1>
                <p className="text-on-surface-variant text-lg">{rangeLabel}</p>
            </div>

            <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                <div className="flex min-w-0 flex-wrap items-end gap-4">
                    <DatePicker
                        label="From"
                        value={dateFrom}
                        onChange={handleFromChange}
                        placeholder="Start date"
                    />
                    <DatePicker
                        label="To"
                        value={dateTo}
                        onChange={handleToChange}
                        placeholder="End date"
                    />
                </div>
                {canAppointments ? (
                    <div className="flex w-full shrink-0 justify-end sm:w-auto">
                        <Link
                            href={route('employee.appointments.calendar')}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-on-surface hover:bg-slate-50"
                        >
                            <Icon name="calendar_view_week" size="text-lg" />
                            Calendar
                        </Link>
                    </div>
                ) : null}
            </div>

            {/* Mobile: table first, overview (metrics) after. md+: overview on top, then table. */}
            <div className="flex flex-col">
                <div className="order-1 min-w-0 md:order-2">
                    {appointments.length === 0 ? (
                        <section className="bg-surface-container-lowest rounded-xl p-10 sm:p-12">
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Icon name="event_available" size="text-5xl" className="text-outline mb-4" />
                                <p className="font-semibold text-on-surface mb-1">No appointments scheduled</p>
                                <p className="text-sm text-on-surface-variant">Nothing in this period ({rangeLabel}).</p>
                            </div>
                        </section>
                    ) : (
                        <section className="bg-surface-container-lowest rounded-xl p-4 md:p-8">
                            <div className="flex justify-between items-center mb-4 md:mb-8 gap-3">
                                <h2 className="text-xl md:text-2xl font-extrabold font-headline text-on-surface">Appointments</h2>
                                <span className="text-xs md:text-sm font-bold text-on-surface-variant text-right shrink-0">{rangeLabel}</span>
                            </div>

                            {employee_compact_mobile_appointments ? (
                                <div className="md:hidden space-y-3">
                                    {appointments.map((apt) => (
                                        <article
                                            key={apt.id}
                                            className="rounded-2xl border border-outline-variant/35 bg-surface-container-low/50 p-4 shadow-sm"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    {isRange ? (
                                                        <p className="text-xs font-semibold text-on-surface-variant mb-1">
                                                            {formatAppointmentDate(apt.date, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    ) : null}
                                                    <p className="font-bold text-on-surface leading-snug">
                                                        {apt.client_first_name} {apt.client_last_name}
                                                    </p>
                                                    <p className="text-sm text-on-surface-variant mt-0.5">
                                                        {apt.service?.name ?? 'Appointment'}
                                                    </p>
                                                </div>
                                                <AppointmentStatusBadge status={apt.status} />
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

                                            <div className="mt-2 flex items-start gap-1.5 text-sm text-on-surface-variant">
                                                <Icon name="call" size="text-sm" className="shrink-0 mt-0.5" />
                                                <span className="min-w-0 break-words">{apt.client_email || apt.client_phone || '—'}</span>
                                            </div>

                                            {apt.client_notes ? (
                                                <p className="mt-2 text-xs text-on-surface-variant italic line-clamp-2">
                                                    &ldquo;{apt.client_notes}&rdquo;
                                                </p>
                                            ) : null}

                                            <div className="mt-3 pt-3 border-t border-outline-variant/25">
                                                <AppointmentActionButtons appointment={apt} onStatusChange={updateStatus} align="start" />
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : null}

                            <div className={employee_compact_mobile_appointments ? 'hidden md:block overflow-x-auto' : 'overflow-x-auto'}>
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-surface-container-highest">
                                            {isRange ? (
                                                <th className="pb-5 pr-4 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">
                                                    Date
                                                </th>
                                            ) : null}
                                            <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Client Name</th>
                                            <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Service</th>
                                            <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Time</th>
                                            <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Status</th>
                                            <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Phone</th>
                                            <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-container-low">
                                        {appointments.map((apt) => (
                                            <tr key={apt.id} className="hover:bg-surface-container-low/50 transition-colors align-top">
                                                {isRange ? (
                                                    <td className="py-5 pr-4 whitespace-nowrap">
                                                        <p className="text-sm font-semibold text-on-surface">
                                                            {formatAppointmentDate(apt.date, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </td>
                                                ) : null}
                                                <td className="py-5 pr-4">
                                                    <div>
                                                        <p className="font-bold text-on-surface">
                                                            {apt.client_first_name} {apt.client_last_name}
                                                        </p>
                                                        {apt.client_notes ? (
                                                            <p className="mt-1 text-xs text-on-surface-variant italic line-clamp-1">
                                                                &ldquo;{apt.client_notes}&rdquo;
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                </td>
                                                <td className="py-5 pr-4">
                                                    <p className="text-sm text-on-surface-variant">
                                                        {apt.service?.name ?? 'Appointment'}
                                                    </p>
                                                </td>
                                                <td className="py-5 pr-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <Icon name="schedule" size="text-sm" className="text-on-surface-variant" />
                                                        <p className="text-on-surface text-sm font-semibold">
                                                            {formatTimeHm(apt.start_time)} - {formatTimeHm(apt.end_time)}
                                                        </p>
                                                    </div>
                                                    <p className="mt-1 text-xs text-on-surface-variant">
                                                        {Number(apt.price).toFixed(2)} {currencySymbol}
                                                    </p>
                                                </td>
                                                <td className="py-5 pr-4">
                                                    <AppointmentStatusBadge status={apt.status} />
                                                </td>
                                                <td className="py-5 pr-4">
                                                    <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                                                        <Icon name="call" size="text-sm" />
                                                        <span>{apt.client_email || apt.client_phone || '—'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-5 text-right">
                                                    <AppointmentActionButtons appointment={apt} onStatusChange={updateStatus} align="end" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </div>

                <section className="order-2 md:order-1 mt-8 md:mt-0 md:mb-8">
                    <div className="mb-5">
                        <h2 className="text-2xl font-extrabold font-headline text-on-surface">Overview</h2>
                        <p className="text-sm text-on-surface-variant mt-1">
                            Summary for the selected {isRange ? 'date range' : 'day'}.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
                        <MetricCard
                            icon="event_upcoming"
                            iconBg="bg-primary-fixed"
                            iconClass="text-on-primary-fixed-variant"
                            label="Appointments"
                            value={appointments_count}
                            badge={isToday ? 'Today' : isRange ? 'Range' : 'Selected day'}
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
            </div>
        </EmployeeLayout>
    );
}
