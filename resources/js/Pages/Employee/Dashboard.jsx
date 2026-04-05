import { Head, router, usePage } from '@inertiajs/react';
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


export default function Dashboard({
    appointments = [],
    appointments_count = 0,
    confirmed_appointments = 0,
    cancelled_appointments = 0,
    completed_appointments = 0,
    daily_revenue = 0,
    date_from: dateFromProp,
    date_to: dateToProp,
}) {
    const { auth } = usePage().props;
    const business = auth.business;
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

            <div className="mb-4 flex flex-wrap items-end gap-4">
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

            {appointments.length === 0 ? (
                <section className="bg-surface-container-lowest rounded-xl p-10 sm:p-12">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Icon name="event_available" size="text-5xl" className="text-outline mb-4" />
                        <p className="font-semibold text-on-surface mb-1">No appointments scheduled</p>
                        <p className="text-sm text-on-surface-variant">Nothing in this period ({rangeLabel}).</p>
                    </div>
                </section>
            ) : (
                <section className="bg-surface-container-lowest rounded-xl p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-extrabold font-headline text-on-surface">Appointments</h2>
                        <span className="text-sm font-bold text-on-surface-variant">{rangeLabel}</span>
                    </div>

                    <div className="overflow-x-auto">
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
                                {appointments.map((apt) => {
                                    const style = STATUS_STYLES[apt.status] || STATUS_STYLES.pending;
                                    const actions = STATUS_ACTIONS[apt.status] || [];

                                    return (
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
                                                    {apt.client_notes && (
                                                        <p className="mt-1 text-xs text-on-surface-variant italic line-clamp-1">
                                                            "{apt.client_notes}"
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-5 pr-4">
                                                <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                                                    <Icon name="content_cut" size="text-sm" />
                                                    <span>{apt.service?.name ?? 'Appointment'}</span>
                                                </div>
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
                                                <span className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-full ${style.bg}`}>
                                                    {style.label}
                                                </span>
                                            </td>
                                            <td className="py-5 pr-4">
                                                <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                                                    <Icon name="call" size="text-sm" />
                                                    <span>{apt.client_email || apt.client_phone || '—'}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 text-right">
                                                {actions.length > 0 ? (
                                                    <div className="flex justify-end gap-2 flex-wrap">
                                                        {actions.map((action) => {
                                                            const info = ACTION_LABELS[action];
                                                            const isDanger = action === 'cancelled';

                                                            return (
                                                                <button
                                                                    key={action}
                                                                    type="button"
                                                                    onClick={() => updateStatus(apt, action)}
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
                                                ) : (
                                                    <span className="text-sm text-on-surface-variant">No actions</span>
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

            <section className="mt-8">
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
        </EmployeeLayout>
    );
}
