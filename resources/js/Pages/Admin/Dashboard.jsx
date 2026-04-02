import AdminLayout from '@/Layouts/AdminLayout';
import MetricCard from '@/Components/MetricCard';
import Icon from '@/Components/Icon';
import { Head, Link, usePage } from '@inertiajs/react';
import { formatAppointmentDate, formatTimeHm } from '@/utils/appointmentDate';

const DEMO_APPOINTMENTS = [
    { client_name: 'James Wilson', service_name: 'Haircut', employee_name: 'John Doe', date: '2026-03-26', start_time: '10:00', status: 'confirmed' },
    { client_name: 'Sarah Johnson', service_name: 'Full Grooming', employee_name: 'Alex Smith', date: '2026-03-26', start_time: '14:00', status: 'pending' },
    { client_name: 'Emma Brown', service_name: 'Nail Treatment', employee_name: 'Maria Garcia', date: '2026-03-27', start_time: '11:00', status: 'confirmed' },
    { client_name: 'Michael Chen', service_name: 'Deep Cleanse', employee_name: 'John Doe', date: '2026-03-27', start_time: '09:30', status: 'confirmed' },
];

export default function Dashboard({
    active_employees = 0,
    total_employees = 0,
    active_services = 0,
    total_services = 0,
    upcoming_appointments = 0,
    total_revenue = 0,
    recent_appointments = [],
}) {
    const { auth } = usePage().props;
    const business = auth.business;

    const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF' };
    const currencySymbol = CURRENCY_SYMBOLS[business?.currency] ?? business?.currency_symbol ?? '€';

    const ALLOWED_STATUSES = ['pending', 'confirmed', 'cancelled'];

    const displayAppointments = (recent_appointments.length > 0 ? recent_appointments : DEMO_APPOINTMENTS)
        .filter(apt => ALLOWED_STATUSES.includes(apt.status?.toLowerCase()));

    const formatDate = (dateStr) =>
        formatAppointmentDate(dateStr, { day: 'numeric', month: 'short', year: 'numeric' });

    const statusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return 'bg-tertiary-fixed text-on-tertiary-fixed-variant';
            case 'cancelled': return 'bg-error-container text-on-error-container';
            case 'pending': return 'bg-surface-container-highest text-on-surface-variant';
            default: return 'bg-surface-container-highest text-on-surface-variant';
        }
    };

    return (
        <AdminLayout>
            <Head title="Dashboard" />

            <div className="mb-12">
                <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Overview</h1>
                <p className="text-on-surface-variant text-lg">Your organizational performance for the current cycle.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
                <MetricCard
                    icon="badge"
                    iconBg="bg-primary-fixed"
                    iconClass="text-on-primary-fixed-variant"
                    label="Active Employees"
                    value={active_employees}
                    badge={`${total_employees} total`}
                />
                <MetricCard
                    icon="category"
                    iconBg="bg-secondary-container"
                    iconClass="text-on-secondary-container"
                    label="Active Services"
                    value={active_services}
                    badge={`${total_services} total`}
                />
                <MetricCard
                    icon="event_upcoming"
                    iconBg="bg-surface-container"
                    iconClass="text-on-surface-variant"
                    label="Today's Appointments"
                    value={upcoming_appointments}
                    badge="Today"
                />
                <MetricCard
                    variant="primary"
                    icon="payments"
                    label="Total Revenue Today"
                    value={`${Number(total_revenue).toFixed(2)} ${currencySymbol}`}
                />
            </div>

            <section className="bg-surface-container-lowest rounded-xl p-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-extrabold font-headline text-on-surface">Today Appointments</h2>
                    <Link
                        href={(() => { try { return route('admin.appointments.index'); } catch { return '#'; } })()}
                        className="text-sm font-bold text-on-surface hover:underline decoration-2 underline-offset-4 transition-all"
                    >
                        View all history
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-surface-container-highest">
                                <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Client Name</th>
                                <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Service</th>
                                <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Price</th>
                                <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Employee</th>
                                <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Date</th>
                                <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Time</th>
                                <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container-low">
                            {displayAppointments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-10 text-center text-on-surface-variant text-sm">
                                        No appointments for today.
                                    </td>
                                </tr>
                            ) : displayAppointments.map((apt, i) => (
                                <tr key={i} className="hover:bg-surface-container-low/50 transition-colors">
                                    <td className="py-5 pr-4">
                                        <p className="font-bold text-on-surface">{apt.client_name}</p>
                                    </td>
                                    <td className="py-5 pr-4">
                                        <p className="text-on-surface-variant text-sm">{apt.service_name}</p>
                                    </td>
                                    <td className="py-5 pr-4">
                                        <p className="text-on-surface text-sm font-semibold">
                                            {Number(apt.service_price ?? 0).toFixed(2)} {currencySymbol}
                                        </p>
                                    </td>
                                    <td className="py-5 pr-4">
                                        <p className="text-on-surface-variant text-sm">{apt.employee_name || '—'}</p>
                                    </td>
                                    <td className="py-5 pr-4">
                                        <p className="text-on-surface-variant text-sm">{formatDate(apt.date)}</p>
                                    </td>
                                    <td className="py-5 pr-4">
                                        <div className="flex items-center gap-1.5">
                                            <Icon name="schedule" size="text-sm" className="text-on-surface-variant" />
                                            <p className="text-on-surface text-sm font-semibold">{formatTimeHm(apt.start_time)}</p>
                                        </div>
                                    </td>
                                    <td className="py-5 pr-4">
                                        <span className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-full ${statusClass(apt.status)}`}>
                                            {apt.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </AdminLayout>
    );
}
