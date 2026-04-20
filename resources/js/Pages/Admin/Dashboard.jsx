import AdminLayout from '@/Layouts/AdminLayout';
import MetricCard from '@/Components/MetricCard';
import Icon from '@/Components/Icon';
import { useT } from '@/i18n/useT';
import { Head, Link, usePage } from '@inertiajs/react';
import { appointmentStatusValue, formatAppointmentDate, formatTimeHm } from '@/utils/appointmentDate';

const STATUS_BADGE_BG = {
    pending: 'bg-surface-container-highest text-on-surface-variant',
    confirmed: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
    cancelled: 'bg-error-container text-on-error-container',
};

export default function Dashboard({
    active_employees = 0,
    total_employees = 0,
    active_services = 0,
    total_services = 0,
    upcoming_appointments = 0,
    total_revenue = 0,
    recent_appointments = [],
    admin_compact_mobile_appointments = false,
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

    const buildAppointmentEditHref = (apt) => {
        const dateStr = apt.date ? String(apt.date).slice(0, 10) : '';
        const params = new URLSearchParams();
        params.set('list', '1');
        if (dateStr) {
            params.set('date_from', dateStr);
            params.set('date_to', dateStr);
        }
        ALLOWED_STATUSES.forEach((s) => params.append('status[]', s));
        if (apt.id != null) {
            params.set('edit', String(apt.id));
        }
        try {
            const base = route('admin.appointments.index');
            const qs = params.toString();
            return `${base}${base.includes('?') ? '&' : '?'}${qs}`;
        } catch {
            return '#';
        }
    };

    return (
        <AdminLayout>
            <Head title={t('admin.dashboard.head_title')} />

            <div className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4 md:mb-12">
                <div className="min-w-0">
                    <h1 className="mb-2 text-3xl font-extrabold font-headline tracking-tight text-on-surface sm:text-4xl">{t('admin.dashboard.overview')}</h1>
                    <p className="text-base leading-relaxed text-on-surface-variant sm:text-lg">{t('admin.dashboard.subtitle')}</p>
                </div>
                <Link
                    href={(() => { try { return route('admin.appointments.index'); } catch { return '#'; } })()}
                    className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-slate-50 sm:w-auto"
                >
                    <Icon name="calendar_today" size="text-lg" />
                    {t('admin.dashboard.all_appointments')}
                </Link>
            </div>

            <section className="mb-6 sm:mb-8">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
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
            </section>

            <section className="bg-surface-container-lowest rounded-xl p-4 md:p-8">
                <div className="mb-4 sm:mb-6 md:mb-8">
                    <h2 className="text-xl font-extrabold font-headline text-on-surface sm:text-2xl">{t('admin.dashboard.section_today')}</h2>
                </div>

                {displayAppointments.length === 0 ? (
                    <div className="py-10 text-center text-on-surface-variant text-sm">
                        {t('admin.dashboard.empty_today')}
                    </div>
                ) : (
                    <>
                        {admin_compact_mobile_appointments ? (
                            <div className="md:hidden space-y-3">
                                {displayAppointments.map((apt) => {
                                    const st = appointmentStatusValue(apt.status);
                                    const bg = STATUS_BADGE_BG[st] || STATUS_BADGE_BG.pending;
                                    const isCancelled = st === 'cancelled';
                                    return (
                                        <article
                                            key={apt.id ?? `${apt.client_name}-${apt.start_time}`}
                                            className={`rounded-2xl border border-outline-variant/35 p-4 shadow-sm ${
                                                isCancelled ? 'bg-error-container/15' : 'bg-surface-container-low/50'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold leading-snug text-on-surface">{apt.client_name}</p>
                                                    <p className="mt-0.5 text-sm text-on-surface-variant">{apt.service_name}</p>
                                                </div>
                                                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${bg}`}>
                                                    {t(`common.status.${st}`)}
                                                </span>
                                            </div>
                                            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface">
                                                    <Icon name="person" size="text-sm" className="text-on-surface-variant" />
                                                    <span className="min-w-0 truncate">{apt.employee_name || t('common.dash')}</span>
                                                </span>
                                                <span className="text-xs font-semibold tabular-nums text-on-surface-variant">
                                                    {Number(apt.service_price ?? 0).toFixed(2)} {currencySymbol}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-on-surface-variant">
                                                <span>{formatDate(apt.date)}</span>
                                                <span className="inline-flex items-center gap-1 font-semibold text-on-surface">
                                                    <Icon name="schedule" size="text-sm" className="text-on-surface-variant" />
                                                    {formatTimeHm(apt.start_time)}
                                                </span>
                                            </div>
                                            <div className="mt-3 flex justify-end border-t border-outline-variant/25 pt-3">
                                                {apt.id != null ? (
                                                    <Link
                                                        href={buildAppointmentEditHref(apt)}
                                                        className="inline-flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-highest"
                                                    >
                                                        <Icon name="edit" size="text-lg" />
                                                        {t('admin.dashboard.open_edit')}
                                                    </Link>
                                                ) : null}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        ) : null}

                        <div
                            className={`overflow-x-auto ${
                                admin_compact_mobile_appointments ? 'hidden md:block' : ''
                            }`}
                        >
                            <table className="w-full min-w-[720px] text-left">
                                <thead>
                                    <tr className="border-b border-surface-container-highest">
                                        <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">{t('admin.dashboard.th_client')}</th>
                                        <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">{t('admin.dashboard.th_service')}</th>
                                        <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">{t('admin.dashboard.th_price')}</th>
                                        <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">{t('admin.dashboard.th_employee')}</th>
                                        <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">{t('admin.dashboard.th_date')}</th>
                                        <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">{t('admin.dashboard.th_time')}</th>
                                        <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">{t('admin.dashboard.th_status')}</th>
                                        <th className="pb-5 text-right text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">{t('admin.dashboard.th_action')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-container-low">
                                    {displayAppointments.map((apt) => (
                                        <tr key={apt.id ?? `${apt.client_name}-${apt.start_time}`} className="hover:bg-surface-container-low/50 transition-colors">
                                            <td className="py-5 pr-4">
                                                <p className="font-bold text-on-surface">{apt.client_name}</p>
                                            </td>
                                            <td className="py-5 pr-4">
                                                <p className="text-sm text-on-surface-variant">{apt.service_name}</p>
                                            </td>
                                            <td className="py-5 pr-4">
                                                <p className="text-sm font-semibold text-on-surface">
                                                    {Number(apt.service_price ?? 0).toFixed(2)} {currencySymbol}
                                                </p>
                                            </td>
                                            <td className="py-5 pr-4">
                                                <p className="text-sm text-on-surface-variant">{apt.employee_name || t('common.dash')}</p>
                                            </td>
                                            <td className="py-5 pr-4">
                                                <p className="text-sm text-on-surface-variant">{formatDate(apt.date)}</p>
                                            </td>
                                            <td className="py-5 pr-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Icon name="schedule" size="text-sm" className="text-on-surface-variant" />
                                                    <p className="text-sm font-semibold text-on-surface">{formatTimeHm(apt.start_time)}</p>
                                                </div>
                                            </td>
                                            <td className="py-5 pr-4">
                                                <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase ${statusClass(apt.status)}`}>
                                                    {t(`common.status.${String(apt.status ?? '').toLowerCase()}`)}
                                                </span>
                                            </td>
                                            <td className="py-5 pl-2 text-right">
                                                {apt.id != null ? (
                                                    <Link
                                                        href={buildAppointmentEditHref(apt)}
                                                        className="inline-flex items-center justify-center rounded-lg p-2 text-outline transition-colors hover:bg-surface-container hover:text-on-surface"
                                                        title={t('admin.dashboard.open_edit')}
                                                        aria-label={t('admin.dashboard.open_edit')}
                                                    >
                                                        <Icon name="edit" size="text-[18px]" />
                                                    </Link>
                                                ) : (
                                                    <span className="text-sm text-on-surface-variant">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </section>
        </AdminLayout>
    );
}
