import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import PageHeader from '@/Components/PageHeader';
import FilterListbox from '@/Components/FilterListbox';
import DatePicker from '@/Components/DatePicker';
import { useT } from '@/i18n/useT';

function getAnalyticsPathname() {
    return new URL(route('admin.analytics.index'), window.location.href).pathname;
}

function buildAnalyticsUrl(filters) {
    const queryParams = {};
    if (filters.date_from) queryParams.date_from = filters.date_from;
    if (filters.date_to) queryParams.date_to = filters.date_to;
    if (filters.employee_id !== '' && filters.employee_id != null) {
        queryParams.employee_id = String(filters.employee_id);
    }
    const queryString = new URLSearchParams(queryParams).toString();
    return getAnalyticsPathname() + (queryString ? `?${queryString}` : '');
}

function buildExportUrl(filters, routeName = 'admin.analytics.export') {
    const queryParams = {};
    if (filters.date_from) queryParams.date_from = filters.date_from;
    if (filters.date_to) queryParams.date_to = filters.date_to;
    if (filters.employee_id !== '' && filters.employee_id != null) {
        queryParams.employee_id = String(filters.employee_id);
    }
    const queryString = new URLSearchParams(queryParams).toString();
    const pathname = new URL(route(routeName), window.location.href).pathname;
    return pathname + (queryString ? `?${queryString}` : '');
}

function currentMonthStart() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function currentMonthEnd() {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ExportDropdown({ filters }) {
    const t = useT();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div className="relative shrink-0" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 rounded-xl bg-on-surface px-6 py-3 text-sm font-bold text-surface hover:opacity-90 transition-opacity"
            >
                <Icon name="download" size="text-lg" />
                {t('admin.analytics.export')}
                <Icon name="expand_more" size="text-base" className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-slate-100 shadow-xl z-50 overflow-hidden">
                    <a
                        href={buildExportUrl(filters, 'admin.analytics.export')}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-slate-50 transition-colors"
                    >
                        <Icon name="table_view" size="text-base" className="text-green-600" />
                        <span className="font-semibold">{t('admin.analytics.export_excel')}</span>
                    </a>
                    <a
                        href={buildExportUrl(filters, 'admin.analytics.export-pdf')}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-slate-50 transition-colors border-t border-slate-100"
                    >
                        <Icon name="picture_as_pdf" size="text-base" className="text-red-500" />
                        <span className="font-semibold">{t('admin.analytics.export_pdf')}</span>
                    </a>
                </div>
            )}
        </div>
    );
}

export default function Index({
    total_appointments,
    total_revenue,
    employee_stats,
    monthly_performance = [],
    employees,
    filters = {},
    currency_symbol,
}) {
    const t = useT();
    const { auth } = usePage().props;
    const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF' };
    const symbol = CURRENCY_SYMBOLS[auth?.business?.currency] ?? currency_symbol ?? '€';

    const [localFilters, setLocalFilters] = useState({
        date_from: filters.date_from ?? currentMonthStart(),
        date_to: filters.date_to ?? currentMonthEnd(),
        employee_id: filters.employee_id != null ? String(filters.employee_id) : '',
    });

    const visitOpts = useMemo(() => ({ preserveState: false, replace: true, preserveScroll: true }), []);

    const patchFilters = useCallback((patch) => {
        setLocalFilters((current) => {
            const updated = { ...current, ...patch };
            router.get(buildAnalyticsUrl(updated), {}, visitOpts);
            return updated;
        });
    }, [visitOpts]);

    const clearFilters = useCallback(() => {
        const defaultFilters = { date_from: currentMonthStart(), date_to: currentMonthEnd(), employee_id: '' };
        setLocalFilters(defaultFilters);
        router.get(buildAnalyticsUrl(defaultFilters), {}, visitOpts);
    }, [visitOpts]);

    const employeeOptions = useMemo(() => [
        { value: '', label: t('admin.analytics.all_employees') },
        ...employees.map((employee) => ({ value: String(employee.id), label: employee.name })),
    ], [employees, t]);

    const fmt = (num) => Number(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <AdminLayout>
            <Head title={t('admin.analytics.head_title')} />

            <PageHeader
                title={t('admin.analytics.title')}
                description={t('admin.analytics.description')}
            >
                <ExportDropdown filters={localFilters} />
            </PageHeader>

            {/* Filters */}
            <section className="mb-8 bg-surface-container-lowest rounded-2xl p-6 ring-1 ring-slate-100 shadow-sm">
                <div className="flex flex-wrap gap-4 items-end">
                    <DatePicker
                        label={t('admin.analytics.start_date')}
                        value={localFilters.date_from}
                        onChange={(value) => patchFilters({ date_from: value })}
                        placeholder={t('admin.analytics.start_date_ph')}
                    />
                    <DatePicker
                        label={t('admin.analytics.end_date')}
                        value={localFilters.date_to}
                        onChange={(value) => patchFilters({ date_to: value })}
                        placeholder={t('admin.analytics.end_date_ph')}
                    />
                    <FilterListbox
                        label={t('admin.analytics.employee')}
                        value={localFilters.employee_id}
                        onChange={(value) => patchFilters({ employee_id: value })}
                        options={employeeOptions}
                    />
                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-slate-50 transition-colors"
                        >
                            {t('admin.analytics.reset')}
                        </button>
                    </div>
                </div>
            </section>

            {/* Widgets */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-surface-container-lowest rounded-3xl border border-slate-100 shadow-sm p-8 flex items-center justify-between">
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-outline uppercase tracking-widest">{t('admin.analytics.total_appointments')}</p>
                        <p className="text-5xl font-extrabold font-headline tracking-tight text-on-surface">
                            {total_appointments.toLocaleString()}
                        </p>
                    </div>
                    <div className="w-16 h-16 bg-surface-container-low rounded-2xl flex items-center justify-center shrink-0">
                        <Icon name="event_available" size="text-3xl" filled className="text-on-surface" />
                    </div>
                </div>

                <div className="bg-primary-container rounded-3xl shadow-xl p-8 flex items-center justify-between">
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">{t('admin.analytics.total_revenue')}</p>
                        <p className="text-5xl font-extrabold font-headline tracking-tight text-white">
                            {fmt(total_revenue)} {symbol}
                        </p>
                        <p className="text-xs text-white/60">{t('admin.analytics.confirmed_base')}</p>
                    </div>
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                        <Icon name="payments" size="text-3xl" filled className="text-white" />
                    </div>
                </div>
            </section>

            {/* Table */}
            <section className="bg-surface-container-lowest rounded-2xl overflow-hidden ring-1 ring-slate-100 shadow-sm">
                <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-white">
                    <div>
                        <h3 className="font-headline font-bold text-base text-on-surface">{t('admin.analytics.employee_performance')}</h3>
                        <p className="text-xs text-on-surface-variant mt-0.5">{t('admin.analytics.employee_breakdown')}</p>
                    </div>
                </div>

                {employee_stats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                        <Icon name="query_stats" size="text-5xl" className="text-outline mb-3" />
                        <p className="text-sm font-bold text-on-surface">{t('admin.analytics.no_data')}</p>
                        <p className="text-xs text-on-surface-variant mt-1">
                            {t('admin.analytics.no_data_hint')}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">{t('admin.analytics.th_employee')}</th>
                                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">{t('admin.analytics.th_cancelled')}</th>
                                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">{t('admin.analytics.th_pending')}</th>
                                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">{t('admin.analytics.th_confirmed')}</th>
                                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">{t('admin.analytics.th_revenue')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {employee_stats.map((stat, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary text-sm font-bold font-headline shrink-0">
                                                    {stat.name.charAt(0).toUpperCase()}
                                                </div>
                                                <p className="text-sm font-bold text-on-surface">{stat.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="text-sm font-semibold text-red-600">{stat.cancelled_count}</span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="text-sm font-semibold text-amber-600">{stat.pending_count}</span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="text-sm font-semibold text-emerald-600">{stat.confirmed_count}</span>
                                        </td>
                                        <td className="px-8 py-5 text-center font-extrabold text-on-surface">
                                            {fmt(stat.revenue)} {symbol}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Monthly overview — same logic as employee analytics */}
            <section className="bg-surface-container-lowest rounded-2xl overflow-hidden ring-1 ring-slate-100 shadow-sm mt-8">
                <div className="px-8 py-5 border-b border-slate-50 bg-white">
                    <h3 className="font-headline font-bold text-base text-on-surface">{t('admin.analytics.monthly_overview')}</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                        {t('admin.analytics.monthly_overview_hint')}
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">
                                    {t('admin.analytics.th_month')}
                                </th>
                                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">
                                    {t('admin.analytics.th_cancelled')}
                                </th>
                                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">
                                    {t('admin.analytics.th_pending')}
                                </th>
                                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">
                                    {t('admin.analytics.th_confirmed')}
                                </th>
                                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">
                                    {t('admin.analytics.th_revenue')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {monthly_performance.map((m) => (
                                <tr key={m.month} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-4 text-sm font-semibold text-on-surface">{m.label}</td>
                                    <td className="px-8 py-4 text-center text-sm font-semibold text-red-600">
                                        {m.cancelled}
                                    </td>
                                    <td className="px-8 py-4 text-center text-sm font-semibold text-amber-600">
                                        {m.pending}
                                    </td>
                                    <td className="px-8 py-4 text-center text-sm font-semibold text-emerald-600">
                                        {m.confirmed}
                                    </td>
                                    <td className="px-8 py-4 text-center font-bold text-on-surface">
                                        {fmt(m.revenue)} {symbol}
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
