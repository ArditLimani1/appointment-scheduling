import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import { Head, Link, usePage } from '@inertiajs/react';
import { formatAppointmentDate, formatTimeHm } from '@/utils/appointmentDate';

const DEMO_APPOINTMENTS = [
    { client_name: 'James Wilson',   service_name: 'Haircut',        employee_name: 'John Doe',     date: '2026-03-26', start_time: '10:00', status: 'confirmed' },
    { client_name: 'Sarah Johnson',  service_name: 'Full Grooming',  employee_name: 'Alex Smith',   date: '2026-03-26', start_time: '14:00', status: 'pending'   },
    { client_name: 'Emma Brown',     service_name: 'Nail Treatment', employee_name: 'Maria Garcia', date: '2026-03-27', start_time: '11:00', status: 'confirmed' },
    { client_name: 'Michael Chen',   service_name: 'Deep Cleanse',   employee_name: 'John Doe',     date: '2026-03-27', start_time: '09:30', status: 'confirmed' },
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
    const currencySymbol = business?.currency_symbol ?? '€';

    const displayAppointments = recent_appointments.length > 0 ? recent_appointments : DEMO_APPOINTMENTS;

    const formatDate = (dateStr) =>
        formatAppointmentDate(dateStr, { day: 'numeric', month: 'short', year: 'numeric' });

    const statusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return 'bg-tertiary-fixed text-on-tertiary-fixed-variant';
            case 'pending':   return 'bg-surface-container-highest text-on-surface-variant';
            case 'cancelled': return 'bg-error-container text-on-error-container';
            default:          return 'bg-surface-container-highest text-on-surface-variant';
        }
    };

    return (
        <AdminLayout>
            <Head title="Dashboard" />

            {/* Page header */}
            <div className="mb-12">
                <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Overview</h1>
                <p className="text-on-surface-variant text-lg">Your organizational performance for the current cycle.</p>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">

                {/* Active Employees */}
                <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between h-48 hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex justify-between items-start">
                        <span className="p-3 bg-primary-fixed rounded-lg">
                            <Icon name="badge" size="text-xl" className="text-on-primary-fixed-variant" />
                        </span>
                        <span className="text-xs font-bold text-on-surface-variant bg-surface-container-highest px-2 py-1 rounded-full">
                            {total_employees} total
                        </span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Active Employees</p>
                        <h3 className="text-4xl font-extrabold font-headline text-on-surface">{active_employees}</h3>
                    </div>
                </div>

                {/* Active Services */}
                <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between h-48 hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex justify-between items-start">
                        <span className="p-3 bg-secondary-container rounded-lg">
                            <Icon name="category" size="text-xl" className="text-on-secondary-container" />
                        </span>
                        <span className="text-xs font-bold text-on-surface-variant bg-surface-container-highest px-2 py-1 rounded-full">
                            {total_services} total
                        </span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Active Services</p>
                        <h3 className="text-4xl font-extrabold font-headline text-on-surface">{active_services}</h3>
                    </div>
                </div>

                {/* Upcoming Appointments */}
                <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between h-48 hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex justify-between items-start">
                        <span className="p-3 bg-surface-container rounded-lg">
                            <Icon name="event_upcoming" size="text-xl" className="text-on-surface-variant" />
                        </span>
                        <span className="text-xs font-bold text-on-surface-variant bg-surface-container-highest px-2 py-1 rounded-full">
                            Scheduled
                        </span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Upcoming Appts</p>
                        <h3 className="text-4xl font-extrabold font-headline text-on-surface">{upcoming_appointments}</h3>
                    </div>
                </div>

                {/* Total Revenue */}
                <div className="bg-primary-container p-8 rounded-xl flex flex-col justify-between h-48 relative overflow-hidden hover:-translate-y-1 transition-transform duration-300 shadow-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <div className="flex justify-between items-start z-10">
                        <span className="p-3 bg-on-primary-container/20 rounded-lg">
                            <Icon name="payments" size="text-xl" className="text-on-primary-container" />
                        </span>
                        <Icon name="trending_up" size="text-xl" className="text-on-primary-container" />
                    </div>
                    <div className="z-10">
                        <p className="text-xs font-bold text-on-primary-container/80 uppercase tracking-widest mb-1">Total Revenue</p>
                        <h3 className="text-4xl font-extrabold font-headline text-white">
                            {currencySymbol}{Number(total_revenue).toFixed(0)}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Recent Appointments */}
            <section className="bg-surface-container-lowest rounded-xl p-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-extrabold font-headline text-on-surface">Recent Appointments</h2>
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
                                <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Employee</th>
                                <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Date</th>
                                <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Time</th>
                                <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">Status</th>
                                <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container-low">
                            {displayAppointments.map((apt, i) => (
                                <tr key={i} className="hover:bg-surface-container-low/50 transition-colors">
                                    <td className="py-5 pr-4">
                                        <p className="font-bold text-on-surface">{apt.client_name}</p>
                                    </td>
                                    <td className="py-5 pr-4">
                                        <p className="text-on-surface-variant text-sm">{apt.service_name}</p>
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
                                    <td className="py-5 text-right">
                                        <button className="p-2 hover:bg-surface-container-high rounded-lg transition-colors group">
                                            <Icon name="arrow_forward" size="text-base" className="text-on-surface-variant group-hover:text-on-surface transition-colors" />
                                        </button>
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
