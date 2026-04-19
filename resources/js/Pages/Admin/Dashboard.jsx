import AdminLayout from '@/Layouts/AdminLayout';
import MetricCard from '@/Components/MetricCard';
import Icon from '@/Components/Icon';
import { useT } from '@/i18n/useT';
import { Head, Link, usePage } from '@inertiajs/react';
import { formatAppointmentDate, formatTimeHm } from '@/utils/appointmentDate';


export default function Dashboard({
    active_employees = 0,
    total_employees = 0,
    active_services = 0,
    total_services = 0,
    upcoming_appointments = 0,
    total_revenue = 0,
    recent_appointments = [],
}) {
    const { auth, localeBcp47 } = usePage().props;
    const business = auth.business;
    const t = useT();

    const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF' };
    const currencySymbol = CURRENCY_SYMBOLS[business?.currency] ?? business?.currency_symbol ?? '€';

    const ALLOWED_STATUSES = ['pending', 'confirmed', 'cancelled'];

    const displayAppointments = recent_appointments
        .filter(apt => ALLOWED_STATUSES.includes(apt.status?.toLowerCase()));

    const formatDate = (dateStr) =>
        formatAppointmentDate(dateStr, { day: 'numeric', month: 'short', year: 'numeric' }, localeBcp47);

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
            <Head title={t('admin.dashboard.head_title')} />

            <div className="mb-12">
                <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">{t('admin.dashboard.overview')}</h1>
                <p className="text-on-surface-variant text-lg">{t('admin.dashboard.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
                <MetricCard
                    icon="badge"
                    iconBg="bg-primary-fixed"
                    iconClass="text-on-primary-fixed-variant"
                    label={t('admin.dashboard.active_employees')}
                    value={active_employees}
                    badge={`${total_employees} ${t('admin.dashboard.total_suffix')}`}
                />
                <MetricCard
                    icon="category"
                    iconBg="bg-secondary-container"
                    iconClass="text-on-secondary-container"
                    label={t('admin.dashboard.active_services')}
                    value={active_services}
                    badge={`${total_services} ${t('admin.dashboard.total_suffix')}`}
                />
                <MetricCard
                    icon="event_upcoming"
                    iconBg="bg-surface-container"
                    iconClass="text-on-surface-variant"
                    label={t('admin.dashboard.today_appointments')}
                    value={upcoming_appointments}
                    badge={t('admin.dashboard.badge_today')}
                />
                <MetricCard
                    variant="primary"
                    icon="payments"
                    label={t('admin.dashboard.revenue_today')}
                    value={`${Number(total_revenue).toFixed(2)} ${currencySymbol}`}
                />
            </div>

            <section className="bg-surface-container-lowest rounded-xl p-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-extrabold font-headline text-on-surface">{t('admin.dashboard.section_today')}</h2>
                    <Link
                        href={(() => { try { return route('admin.appointments.index'); } catch { return '#'; } })()}
                        className="text-sm font-bold text-on-surface hover:underline decoration-2 underline-offset-4 transition-all"
                    >
                        {t('admin.dashboard.view_all_history')}
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-surface-container-highest">
                                <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">{t('admin.dashboard.th_client')}</th>
                                <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">{t('admin.dashboard.th_service')}</th>
                                <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">{t('admin.dashboard.th_price')}</th>
                                <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">{t('admin.dashboard.th_employee')}</th>
                                <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">{t('admin.dashboard.th_date')}</th>
                                <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">{t('admin.dashboard.th_time')}</th>
                                <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">{t('admin.dashboard.th_status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container-low">
                            {displayAppointments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-10 text-center text-on-surface-variant text-sm">
                                        {t('admin.dashboard.empty_today')}
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
                                        <p className="text-on-surface-variant text-sm">{apt.employee_name || t('common.dash')}</p>
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
                                            {t(`common.status.${String(apt.status ?? '').toLowerCase()}`)}
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
