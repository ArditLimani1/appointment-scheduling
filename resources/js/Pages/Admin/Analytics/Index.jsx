import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import MetricCard from '@/Components/MetricCard';
import PageHeader from '@/Components/PageHeader';
import FilterListbox from '@/Components/FilterListbox';
import DatePicker from '@/Components/DatePicker';
import { useT } from '@/i18n/useT';
import { mergeDateFromChange, mergeDateToChange } from '@/utils/dateRangeFilters';
import {
    FILTER_PARAM_KEYS,
    FILTER_STORAGE_KEYS,
    urlHasFilterQuery,
    usePersistedFilters,
} from '@/utils/filterPersistence';

function getAnalyticsPathname() {
    return new URL(route('admin.analytics.index'), window.location.href).pathname;
}

function buildAnalyticsUrl(filters) {
    const queryParams = {};
    if (filters.date_from) queryParams.date_from = filters.date_from;
    if (filters.date_to) queryParams.date_to = filters.date_to;
    if (filters.employee !== '' && filters.employee != null) {
        queryParams.employee = String(filters.employee);
    }
    const queryString = new URLSearchParams(queryParams).toString();
    return getAnalyticsPathname() + (queryString ? `?${queryString}` : '');
}

function buildExportUrl(filters, routeName = 'admin.analytics.export') {
    const queryParams = {};
    if (filters.date_from) queryParams.date_from = filters.date_from;
    if (filters.date_to) queryParams.date_to = filters.date_to;
    if (filters.employee !== '' && filters.employee != null) {
        queryParams.employee = String(filters.employee);
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
                className="flex items-center gap-2 rounded-xl bg-on-surface px-4 py-2.5 text-xs font-bold text-surface transition-opacity hover:opacity-90 sm:px-6 sm:py-3 sm:text-sm"
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
    confirmed_count = 0,
    cancelled_count = 0,
    pending_count = 0,
    total_revenue,
    employee_stats,
    monthly_performance = [],
    employee_filter_options = [],
    filters = {},
    currency_symbol,
}) {
    const t = useT();
    const page = usePage();
    const inertiaUrl = typeof page.url === 'string' ? page.url : `${window.location.pathname}${window.location.search}`;
    const { auth } = page.props;
    const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF' };
    const symbol = CURRENCY_SYMBOLS[auth?.business?.currency] ?? currency_symbol ?? '€';

    const [localFilters, setLocalFilters] = useState({
        date_from: filters.date_from ?? currentMonthStart(),
        date_to: filters.date_to ?? currentMonthEnd(),
        employee: filters.employee != null && filters.employee !== '' ? String(filters.employee) : '',
    });
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    useEffect(() => {
        setLocalFilters({
            date_from: filters.date_from ?? currentMonthStart(),
            date_to: filters.date_to ?? currentMonthEnd(),
            employee: filters.employee != null && filters.employee !== '' ? String(filters.employee) : '',
        });
    }, [filters.date_from, filters.date_to, filters.employee]);

    const visitOpts = useMemo(() => ({ preserveState: true, replace: true, preserveScroll: true }), []);

    const { persist: persistFilters, persistReplace: replacePersistedFilters } = usePersistedFilters({
        storageKey: FILTER_STORAGE_KEYS.adminAnalytics,
        filterParamKeys: FILTER_PARAM_KEYS.adminAnalytics,
        buildUrl: buildAnalyticsUrl,
        visitOpts,
    });

    useEffect(() => {
        if (urlHasFilterQuery(inertiaUrl, FILTER_PARAM_KEYS.adminAnalytics)) {
            persistFilters(localFilters);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const patchFilters = useCallback(
        (patch) => {
            setLocalFilters((current) => {
                const updated = { ...current, ...patch };
                persistFilters(updated);
                router.get(buildAnalyticsUrl(updated), {}, visitOpts);
                return updated;
            });
        },
        [persistFilters, visitOpts],
    );

    const clearFilters = useCallback(() => {
        const defaultFilters = { date_from: currentMonthStart(), date_to: currentMonthEnd(), employee: '' };
        setLocalFilters(defaultFilters);
        replacePersistedFilters(defaultFilters);
        router.get(buildAnalyticsUrl(defaultFilters), {}, visitOpts);
    }, [replacePersistedFilters, visitOpts]);

    const employeeOptions = useMemo(() => (
        employee_filter_options.map((row) => ({ value: row.value, label: row.label }))
    ), [employee_filter_options]);

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

            {/* Filters — same stacked / full-width pattern as admin appointments */}
            <section className="mb-8 rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-slate-100 shadow-sm sm:p-6">
                <div className="mb-3 lg:hidden">
                    <button
                        type="button"
                        onClick={() => setShowMobileFilters((v) => !v)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-slate-50"
                    >
                        <Icon name="tune" size="text-base" />
                        {showMobileFilters ? t('admin.analytics.hide_filters') : t('admin.analytics.show_filters')}
                        <Icon name={showMobileFilters ? 'expand_less' : 'expand_more'} size="text-base" />
                    </button>
                </div>
                <div className={`${showMobileFilters ? 'flex' : 'hidden'} min-w-0 flex-col gap-4 lg:flex lg:flex-row lg:flex-nowrap lg:items-end lg:gap-3 lg:w-full`}>
                    <DatePicker
                        className="w-full min-w-0 lg:flex-1 lg:min-w-0"
                        label={t('admin.analytics.start_date')}
                        value={localFilters.date_from}
                        maxDate={localFilters.date_to || ''}
                        onChange={(value) => patchFilters(mergeDateFromChange(localFilters, value))}
                        placeholder={t('admin.analytics.start_date_ph')}
                        buttonClassName="max-lg:!min-w-0"
                    />
                    <DatePicker
                        className="w-full min-w-0 lg:flex-1 lg:min-w-0"
                        label={t('admin.analytics.end_date')}
                        value={localFilters.date_to}
                        minDate={localFilters.date_from || ''}
                        onChange={(value) => patchFilters(mergeDateToChange(localFilters, value))}
                        placeholder={t('admin.analytics.end_date_ph')}
                        buttonClassName="max-lg:!min-w-0"
                    />
                    <FilterListbox
                        label={t('admin.analytics.employee')}
                        value={localFilters.employee}
                        onChange={(value) => patchFilters({ employee: value })}
                        options={employeeOptions}
                        minWidthClass="min-w-0"
                        wrapperClassName="flex w-full min-w-0 flex-col gap-1.5 lg:flex-1"
                    />
                    <div className="flex w-full shrink-0 items-end justify-stretch lg:w-auto lg:flex-none">
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="w-full max-lg:min-h-[2.75rem] rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-slate-50 lg:w-auto"
                        >
                            {t('admin.analytics.clear')}
                        </button>
                    </div>
                </div>
            </section>

            {/* Summary — same MetricCard grid as employee analytics */}
            <section className="mb-8">
                <div className="grid grid-cols-2 gap-x-2 gap-y-3 sm:gap-6">
                    <MetricCard
                        icon="event_available"
                        iconBg="bg-primary-fixed"
                        iconClass="text-on-primary-fixed-variant"
                        label={t('admin.analytics.total_appointments')}
                        value={(total_appointments ?? 0).toLocaleString()}
                    />
                    <MetricCard
                        icon="check_circle"
                        iconBg="bg-tertiary-fixed"
                        iconClass="text-on-tertiary-fixed-variant"
                        label={t('admin.analytics.confirmed')}
                        value={(confirmed_count ?? 0).toLocaleString()}
                    />
                    <MetricCard
                        icon="schedule"
                        iconBg="bg-secondary-container"
                        iconClass="text-on-secondary-container"
                        label={t('admin.analytics.pending')}
                        value={(pending_count ?? 0).toLocaleString()}
                    />
                    <MetricCard
                        icon="cancel"
                        iconBg="bg-error-container"
                        iconClass="text-on-error-container"
                        label={t('admin.analytics.cancelled')}
                        value={(cancelled_count ?? 0).toLocaleString()}
                    />
                    <div className="col-span-2 max-sm:mt-2 sm:mt-0">
                        <MetricCard
                            variant="primary"
                            layout="wide"
                            icon="payments"
                            label={t('admin.analytics.total_revenue')}
                            value={`${fmt(total_revenue)} ${symbol}`}
                            badge={t('admin.analytics.confirmed_base')}
                        />
                    </div>
                </div>
            </section>

            {/* Table */}
            <section className="min-w-0 overflow-hidden rounded-2xl bg-surface-container-lowest ring-1 ring-slate-100 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-50 bg-white px-4 py-4 sm:px-6 md:px-8">
                    <div className="min-w-0 pr-2">
                        <h3 className="font-headline text-base font-bold text-on-surface">{t('admin.analytics.employee_performance')}</h3>
                        <p className="mt-0.5 text-xs text-on-surface-variant">{t('admin.analytics.employee_breakdown')}</p>
                    </div>
                </div>

                {employee_stats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
                        <Icon name="query_stats" size="text-5xl" className="text-outline mb-3" />
                        <p className="text-sm font-bold text-on-surface">{t('admin.analytics.no_data')}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                            {t('admin.analytics.no_data_hint')}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3 border-b border-slate-50 bg-white p-4 md:hidden">
                            {employee_stats.map((stat, index) => (
                                <article
                                    key={index}
                                    className="rounded-2xl border border-outline-variant/35 bg-surface-container-low/50 p-4 shadow-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container font-headline text-sm font-bold text-on-primary">
                                            {stat.name.charAt(0).toUpperCase()}
                                        </div>
                                        <p className="text-sm font-bold text-on-surface">{stat.name}</p>
                                    </div>

                                    <div className="mt-4 space-y-2.5">
                                        <div className="grid grid-cols-2 gap-2.5">
                                            <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest/80 px-3 py-2.5 text-center">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-outline">{t('admin.analytics.th_confirmed')}</p>
                                                <p className="mt-0.5 text-xl font-extrabold tabular-nums text-emerald-600">{stat.confirmed_count}</p>
                                            </div>
                                            <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest/80 px-3 py-2.5 text-center">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-outline">{t('admin.analytics.th_revenue')}</p>
                                                <p className="mt-0.5 text-base font-extrabold tabular-nums text-on-surface">
                                                    {fmt(stat.revenue)} {symbol}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2.5">
                                            <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest/80 px-3 py-2 text-center">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-outline">{t('admin.analytics.th_pending')}</p>
                                                <p className="mt-0.5 text-lg font-semibold tabular-nums text-amber-600">{stat.pending_count}</p>
                                            </div>
                                            <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest/80 px-3 py-2 text-center">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-outline">{t('admin.analytics.th_cancelled')}</p>
                                                <p className="mt-0.5 text-lg font-semibold tabular-nums text-red-600">{stat.cancelled_count}</p>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[640px] border-collapse text-left">
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
                    </>
                )}
            </section>

            {/* Monthly overview — same logic as employee analytics */}
            <section className="mt-8 min-w-0 overflow-hidden rounded-2xl bg-surface-container-lowest ring-1 ring-slate-100 shadow-sm">
                <div className="border-b border-slate-50 bg-white px-4 py-4 sm:px-6 md:px-8">
                    <h3 className="font-headline text-base font-bold text-on-surface">{t('admin.analytics.monthly_overview')}</h3>
                    <p className="mt-0.5 text-xs text-on-surface-variant">
                        {t('admin.analytics.monthly_overview_hint')}
                    </p>
                </div>
                <div className="space-y-3 border-b border-slate-50 bg-white p-4 md:hidden">
                    {monthly_performance.map((m) => (
                        <article
                            key={m.month}
                            className="rounded-2xl border border-outline-variant/35 bg-surface-container-low/50 p-4 shadow-sm"
                        >
                            <p className="font-headline text-sm font-bold text-on-surface">{m.label}</p>
                            <div className="mt-3 space-y-2.5">
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest/80 px-3 py-2.5 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-outline">{t('admin.analytics.th_confirmed')}</p>
                                        <p className="mt-0.5 text-xl font-extrabold tabular-nums text-emerald-600">{m.confirmed}</p>
                                    </div>
                                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest/80 px-3 py-2.5 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-outline">{t('admin.analytics.th_revenue')}</p>
                                        <p className="mt-0.5 text-base font-extrabold tabular-nums text-on-surface">
                                            {fmt(m.revenue)} {symbol}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest/80 px-3 py-2 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-outline">{t('admin.analytics.th_pending')}</p>
                                        <p className="mt-0.5 text-lg font-semibold tabular-nums text-amber-600">{m.pending}</p>
                                    </div>
                                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest/80 px-3 py-2 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-outline">{t('admin.analytics.th_cancelled')}</p>
                                        <p className="mt-0.5 text-lg font-semibold tabular-nums text-red-600">{m.cancelled}</p>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[560px] border-collapse text-left">
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
