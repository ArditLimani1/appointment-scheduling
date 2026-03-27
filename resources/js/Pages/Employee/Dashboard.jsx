import { Head, router } from '@inertiajs/react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import Icon from '@/Components/Icon';

const STATUS_STYLES = {
    pending: { bg: 'bg-secondary-container text-on-secondary-container', label: 'Pending' },
    confirmed: { bg: 'bg-primary-container text-on-primary-container', label: 'Confirmed' },
    checked_in: { bg: 'bg-tertiary-fixed/30 text-on-tertiary-container', label: 'Checked In' },
    completed: { bg: 'bg-tertiary-fixed/30 text-on-tertiary-container', label: 'Completed' },
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

function buildDateRange(selectedDate) {
    const days = [];
    const base = new Date(selectedDate + 'T00:00:00');
    for (let i = -6; i <= 7; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        days.push(d);
    }
    return days;
}

function fmt(d, opts) {
    return new Intl.DateTimeFormat('en-GB', opts).format(d);
}

export default function Dashboard({ appointments, date }) {
    const dateRange = buildDateRange(date);
    const todayStr = new Date().toISOString().split('T')[0];

    const goToDate = (d) => {
        const ds = d.toISOString().split('T')[0];
        router.get(route('employee.dashboard'), { date: ds }, { preserveState: false });
    };

    const updateStatus = (apt, status) => {
        router.patch(route('employee.appointments.update', apt.id), { status }, { preserveScroll: true });
    };

    const selectedDate = new Date(date + 'T00:00:00');
    const isToday = date === todayStr;

    return (
        <EmployeeLayout>
            <Head title="My Appointments" />

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center rounded-full bg-primary-container px-3 py-0.5 text-xs font-semibold text-on-primary-container">
                        {isToday ? 'Today' : fmt(selectedDate, { weekday: 'long' })}
                    </span>
                    {appointments.length > 0 && (
                        <span className="inline-flex items-center rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs font-medium text-on-surface-variant">
                            {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <h1 className="text-3xl font-black font-headline tracking-tight text-on-surface">
                    Daily Orchestration
                </h1>
                <p className="mt-1 text-sm text-on-surface-variant">
                    {fmt(selectedDate, { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>

            {/* Horizontal date scroller */}
            <div className="mb-6 -mx-4 sm:-mx-6">
                <div className="flex gap-2 overflow-x-auto px-4 sm:px-6 pb-2 hide-scrollbar">
                    {dateRange.map((d) => {
                        const ds = d.toISOString().split('T')[0];
                        const isSelected = ds === date;
                        const isDateToday = ds === todayStr;
                        return (
                            <button
                                key={ds}
                                onClick={() => goToDate(d)}
                                className={`flex shrink-0 flex-col items-center rounded-2xl px-3 py-2.5 transition-all ${
                                    isSelected
                                        ? 'bg-on-surface text-surface'
                                        : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                                }`}
                            >
                                <span className="text-[10px] font-semibold uppercase tracking-widest mb-1">
                                    {fmt(d, { weekday: 'short' })}
                                </span>
                                <span className={`text-lg font-black font-headline leading-none ${isSelected ? 'text-surface' : 'text-on-surface'}`}>
                                    {d.getDate()}
                                </span>
                                {isDateToday && (
                                    <span className={`mt-1 h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-primary-container' : 'bg-primary'}`} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Appointments */}
            {appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl bg-surface-container-lowest border border-outline-variant py-20">
                    <Icon name="event_available" size="text-5xl" className="text-outline mb-4" />
                    <p className="font-semibold text-on-surface mb-1">No appointments scheduled</p>
                    <p className="text-sm text-on-surface-variant">
                        {fmt(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' })} is free.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {appointments.map((apt, index) => {
                        const style = STATUS_STYLES[apt.status] || STATUS_STYLES.pending;
                        const actions = STATUS_ACTIONS[apt.status] || [];
                        return (
                            <div key={apt.id} className="rounded-3xl bg-surface-container-lowest border border-outline-variant p-5 transition-all hover:shadow-sm">
                                <div className="flex items-start gap-4">
                                    {/* Time block */}
                                    <div className="flex flex-col items-center rounded-2xl bg-surface-container-low px-3 py-2 min-w-[64px]">
                                        <span className="text-xs font-semibold text-on-surface-variant">{apt.start_time}</span>
                                        <div className="my-1 h-6 w-px bg-outline-variant" />
                                        <span className="text-xs text-on-surface-variant">{apt.end_time}</span>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-bold font-headline text-on-surface">
                                                {apt.client_first_name} {apt.client_last_name}
                                            </p>
                                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.bg}`}>
                                                {style.label}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex items-center gap-3 flex-wrap">
                                            {apt.service && (
                                                <span className="flex items-center gap-1 text-sm text-on-surface-variant">
                                                    <Icon name="content_cut" size="text-sm" />
                                                    {apt.service.name}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1 text-sm text-on-surface-variant">
                                                <Icon name="call" size="text-sm" />
                                                {apt.client_phone}
                                            </span>
                                        </div>
                                        {apt.client_notes && (
                                            <p className="mt-1.5 text-xs text-on-surface-variant italic line-clamp-1">
                                                "{apt.client_notes}"
                                            </p>
                                        )}
                                    </div>

                                    {/* Price */}
                                    <div className="shrink-0 text-right">
                                        <p className="font-black font-headline text-on-surface">€{Number(apt.price).toFixed(2)}</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                {actions.length > 0 && (
                                    <div className="mt-4 flex gap-2 border-t border-outline-variant pt-4">
                                        {actions.map(action => {
                                            const info = ACTION_LABELS[action];
                                            const isDanger = action === 'cancelled';
                                            return (
                                                <button
                                                    key={action}
                                                    onClick={() => updateStatus(apt, action)}
                                                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                                                        isDanger
                                                            ? 'bg-error-container text-on-error-container hover:opacity-80'
                                                            : 'primary-gradient text-white hover:opacity-90'
                                                    }`}
                                                >
                                                    <Icon name={info.icon} size="text-sm" />
                                                    {info.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </EmployeeLayout>
    );
}
