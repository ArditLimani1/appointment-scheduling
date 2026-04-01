import { Head, router, usePage } from '@inertiajs/react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import MetricCard from '@/Components/MetricCard';
import Icon from '@/Components/Icon';
import { formatAppointmentDate, formatTimeHm } from '@/utils/appointmentDate';
import { useEffect, useState } from 'react';

const STATUS_STYLES = {
    pending: { bg: 'bg-surface-container-highest text-on-surface-variant', label: 'Pending' },
    confirmed: { bg: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', label: 'Confirmed' },
    checked_in: { bg: 'bg-primary-container text-on-primary-container', label: 'Checked In' },
    completed: { bg: 'bg-primary-fixed text-on-primary-fixed-variant', label: 'Completed' },
    cancelled: { bg: 'bg-error-container text-on-error-container', label: 'Cancelled' },
};

const STATUS_ACTIONS = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['checked_in', 'cancelled'],
    checked_in: ['completed'],
    completed: [],
    cancelled: [],
};

const ACTION_LABELS = {
    confirmed: { label: 'Confirm', icon: 'check_circle' },
    checked_in: { label: 'Check In', icon: 'login' },
    completed: { label: 'Complete', icon: 'task_alt' },
    cancelled: { label: 'Cancel', icon: 'cancel' },
};

function fmt(d, opts) {
    return new Intl.DateTimeFormat('en-GB', opts).format(d);
}

function formatDateInput(value) {
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
        return value;
    }

    return `${match[3]}.${match[2]}.${match[1]}`;
}

function parseDateInput(value) {
    const match = String(value).trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);

    if (!match) {
        return null;
    }

    const isoDate = `${match[3]}-${match[2]}-${match[1]}`;
    const parsedDate = new Date(`${isoDate}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    return isoDate;
}

export default function Dashboard({
    appointments = [],
    appointments_count = 0,
    confirmed_appointments = 0,
    cancelled_appointments = 0,
    completed_appointments = 0,
    daily_revenue = 0,
    date,
}) {
    const { auth } = usePage().props;
    const business = auth.business;
    const currencySymbol = business?.currency_symbol ?? '€';
    const todayStr = new Date().toISOString().split('T')[0];
    const [dateInput, setDateInput] = useState(formatDateInput(date));

    useEffect(() => {
        setDateInput(formatDateInput(date));
    }, [date]);

    const goToDate = (selectedDate) => {
        router.get(route('employee.dashboard'), { date: selectedDate }, { preserveState: false });
    };

    const updateStatus = (apt, status) => {
        router.patch(route('employee.appointments.update', apt.id), { status }, { preserveScroll: true });
    };

    const selectedDate = new Date(date + 'T00:00:00');
    const isToday = date === todayStr;

    return (
        <EmployeeLayout>
            <Head title="Appointments" />

            <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Appointments</h1>
                    <p className="text-on-surface-variant text-lg">
                        {isToday ? 'Today' : fmt(selectedDate, { weekday: 'long' })}
                    </p>
                </div>

                <div className="w-full max-w-sm">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">
                        Select date
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={dateInput}
                            inputMode="numeric"
                            placeholder="dd.mm.YYYY"
                            onChange={(e) => {
                                const { value } = e.target;
                                setDateInput(value);

                                const parsedDate = parseDateInput(value);

                                if (parsedDate) {
                                    goToDate(parsedDate);
                                }
                            }}
                            onBlur={() => {
                                const parsedDate = parseDateInput(dateInput);

                                if (!parsedDate) {
                                    setDateInput(formatDateInput(date));
                                } else {
                                    setDateInput(formatDateInput(parsedDate));
                                }
                            }}
                            className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm font-medium text-on-surface shadow-sm focus:border-on-surface focus:outline-none focus:ring-2 focus:ring-on-surface/10"
                        />
                    </div>
                </div>
            </div>

            {appointments.length === 0 ? (
                <section className="bg-surface-container-lowest rounded-xl p-10 sm:p-12">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Icon name="event_available" size="text-5xl" className="text-outline mb-4" />
                        <p className="font-semibold text-on-surface mb-1">No appointments scheduled</p>
                        <p className="text-sm text-on-surface-variant">
                            {fmt(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' })} is free.
                        </p>
                    </div>
                </section>
            ) : (
                <section className="bg-surface-container-lowest rounded-xl p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-extrabold font-headline text-on-surface">Appointments</h2>
                        <span className="text-sm font-bold text-on-surface-variant">
                            {fmt(selectedDate, { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-surface-container-highest">
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
                                                    {currencySymbol}{Number(apt.price).toFixed(2)}
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
                                                    <span>{apt.client_phone}</span>
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
                        Daily performance summary for the selected date.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
                    <MetricCard
                        icon="event_upcoming"
                        iconBg="bg-primary-fixed"
                        iconClass="text-on-primary-fixed-variant"
                        label="Appointments"
                        value={appointments_count}
                        badge={isToday ? 'Today' : 'Selected day'}
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
                        icon="task_alt"
                        iconBg="bg-tertiary-fixed"
                        iconClass="text-on-tertiary-fixed-variant"
                        label="Completed"
                        value={completed_appointments}
                        badge="Finished"
                    />
                    <MetricCard
                        variant="primary"
                        icon="payments"
                        label="Revenue"
                        value={`${currencySymbol}${Number(daily_revenue).toFixed(0)}`}
                    />
                </div>
            </section>
        </EmployeeLayout>
    );
}
