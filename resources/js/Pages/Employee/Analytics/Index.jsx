import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import Icon from '@/Components/Icon';
import MetricCard from '@/Components/MetricCard';
import PageHeader from '@/Components/PageHeader';
import FilterListbox from '@/Components/FilterListbox';
import DatePicker from '@/Components/DatePicker';
import { useT } from '@/i18n/useT';
import { mergeDateFromChange, mergeDateToChange } from '@/utils/dateRangeFilters';

function getAnalyticsPathname() {
    return new URL(route('employee.analytics.index'), window.location.href).pathname;
}

function buildAnalyticsUrl(filters) {
    const queryParams = {};
    if (filters.date_from) queryParams.date_from = filters.date_from;
    if (filters.date_to) queryParams.date_to = filters.date_to;
    if (filters.service_id !== '' && filters.service_id != null) {
        queryParams.service_id = String(filters.service_id);
    }
    const queryString = new URLSearchParams(queryParams).toString();
    return getAnalyticsPathname() + (queryString ? `?${queryString}` : '');
}

function buildExportUrl(filters, routeName) {
    const queryParams = {};
    if (filters.date_from) queryParams.date_from = filters.date_from;
    if (filters.date_to) queryParams.date_to = filters.date_to;
    if (filters.service_id !== '' && filters.service_id != null) {
        queryParams.service_id = String(filters.service_id);
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
                {t('employee.analytics.export')}
                <Icon name="expand_more" size="text-base" className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-slate-100 shadow-xl z-50 overflow-hidden">
                    <a
                        href={buildExportUrl(filters, 'employee.analytics.export')}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-slate-50 transition-colors"
                    >
                        <Icon name="table_view" size="text-base" className="text-green-600" />
                        <span className="font-semibold">{t('employee.analytics.export_excel')}</span>
                    </a>
                    <a
                        href={buildExportUrl(filters, 'employee.analytics.export-pdf')}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-slate-50 transition-colors border-t border-slate-100"
                    >
                        <Icon name="picture_as_pdf" size="text-base" className="text-red-500" />
                        <span className="font-semibold">{t('employee.analytics.export_pdf')}</span>
                    </a>
                </div>
            )}
        </div>
    );
}

export default function Index({
    filters = {},
    summary = {},
    service_stats = [],
    monthly_performance = [],
    service_options = [],
    currency_symbol,
    selected_service_name,
}) {
    const t = useT();
    const { auth } = usePage().props;
    const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF' };
    const symbol = CURRENCY_SYMBOLS[auth?.business?.currency] ?? currency_symbol ?? '€';

    const [localFilters, setLocalFilters] = useState({
        date_from: filters.date_from ?? currentMonthStart(),
        date_to: filters.date_to ?? currentMonthEnd(),
        service_id: filters.service_id != null ? String(filters.service_id) : '',
    });
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    useEffect(() => {
        setLocalFilters({
            date_from: filters.date_from ?? currentMonthStart(),
            date_to: filters.date_to ?? currentMonthEnd(),
            service_id: filters.service_id != null ? String(filters.service_id) : '',
        });
    }, [filters.date_from, filters.date_to, filters.service_id]);

    const visitOpts = useMemo(() => ({ preserveState: true, replace: true, preserveScroll: true }), []);

    const patchFilters = useCallback(
        (patch) => {
            setLocalFilters((current) => {
                const updated = { ...current, ...patch };
                router.get(buildAnalyticsUrl(updated), {}, visitOpts);
                return updated;
            });
        },
        [visitOpts]
    );

    const resetFilters = useCallback(() => {
        const defaultFilters = {
            date_from: currentMonthStart(),
            date_to: currentMonthEnd(),
            service_id: '',
        };
        setLocalFilters(defaultFilters);
        router.get(buildAnalyticsUrl(defaultFilters), {}, visitOpts);
    }, [visitOpts]);

    const serviceListboxOptions = useMemo(
        () => [
            { value: '', label: t('employee.analytics.all_services') },
            ...service_options.map((s) => ({ value: String(s.id), label: s.name })),
        ],
        [service_options, t]
    );

    const fmt = (num) =>
        Number(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <EmployeeLayout>
            <Head title={t('employee.analytics.head_title')} />

            <PageHeader
                title={t('employee.analytics.title')}
                description={t('employee.analytics.description')}
            >
                <ExportDropdown filters={localFilters} />
            </PageHeader>

            {/* Filters — same stacked / full-width pattern as admin analytics */}
            <section className="mb-8 rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-slate-100 shadow-sm sm:p-6">
                <div className="mb-3 lg:hidden">
                    <button
                        type="button"
                        onClick={() => setShowMobileFilters((v) => !v)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-slate-50"
                    >
                        <Icon name="tune" size="text-base" />
                        {showMobileFilters ? t('employee.analytics.hide_filters') : t('employee.analytics.show_filters')}
                        <Icon name={showMobileFilters ? 'expand_less' : 'expand_more'} size="text-base" />
                    </button>
                </div>
                <div className={`${showMobileFilters ? 'flex' : 'hidden'} min-w-0 flex-col gap-4 lg:flex lg:flex-row lg:flex-nowrap lg:items-end lg:gap-3 lg:w-full`}>
                    <DatePicker
                        className="w-full min-w-0 lg:flex-1 lg:min-w-0"
                        label={t('employee.analytics.from')}
                        value={localFilters.date_from}
                        maxDate={localFilters.date_to || ''}
                        onChange={(value) => patchFilters(mergeDateFromChange(localFilters, value))}
                        placeholder={t('employee.analytics.start_date_ph')}
                        buttonClassName="max-lg:!min-w-0"
                    />
                    <DatePicker
                        className="w-full min-w-0 lg:flex-1 lg:min-w-0"
                        label={t('employee.analytics.to')}
                        value={localFilters.date_to}
                        minDate={localFilters.date_from || ''}
                        onChange={(value) => patchFilters(mergeDateToChange(localFilters, value))}
                        placeholder={t('employee.analytics.end_date_ph')}
                        buttonClassName="max-lg:!min-w-0"
                    />
                    <FilterListbox
                        label={t('employee.analytics.service')}
                        value={localFilters.service_id}
                        onChange={(value) => patchFilters({ service_id: value })}
                        options={serviceListboxOptions}
                        minWidthClass="min-w-0"
                        wrapperClassName="flex w-full min-w-0 flex-col gap-1.5 lg:flex-1"
                    />
                    <div className="flex w-full shrink-0 items-end justify-stretch lg:w-auto lg:flex-none">
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="w-full max-lg:min-h-[2.75rem] rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-slate-50 lg:w-auto"
                        >
                            {t('employee.analytics.clear')}
                        </button>
                    </div>
                </div>
            </section>

            {/* Summary — same MetricCard grid pattern as admin analytics */}
            <section className="mb-8">
                <div className="grid grid-cols-2 gap-x-2 gap-y-3 sm:gap-6">
                    <MetricCard
                        icon="event_available"
                        iconBg="bg-primary-fixed"
                        iconClass="text-on-primary-fixed-variant"
                        label={t('employee.analytics.total_appointments')}
                        value={(summary.total_appointments ?? 0).toLocaleString()}
                    />
                    <MetricCard
                        icon="check_circle"
                        iconBg="bg-tertiary-fixed"
                        iconClass="text-on-tertiary-fixed-variant"
                        label={t('employee.analytics.confirmed')}
                        value={(summary.confirmed_count ?? 0).toLocaleString()}
                    />
                    <MetricCard
                        icon="schedule"
                        iconBg="bg-secondary-container"
                        iconClass="text-on-secondary-container"
                        label={t('employee.analytics.pending')}
                        value={(summary.pending_count ?? 0).toLocaleString()}
                    />
                    <MetricCard
                        icon="cancel"
                        iconBg="bg-error-container"
                        iconClass="text-on-error-container"
                        label={t('employee.analytics.cancelled')}
                        value={(summary.cancelled_count ?? 0).toLocaleString()}
                    />
                    <div className="col-span-2 max-sm:mt-2 sm:mt-0">
                        <MetricCard
                            variant="primary"
                            icon="payments"
                            label={t('employee.analytics.total_earnings')}
                            value={`${fmt(summary.revenue ?? 0)} ${symbol}`}
                            badge={t('employee.analytics.earnings_hint')}
                        />
                    </div>
                </div>
            </section>

            {selected_service_name && (
                <section className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-on-surface text-surface">
                            <Icon name="content_cut" size="text-xl" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-outline">{t('employee.analytics.filtered_service')}</p>
                            <p className="text-lg font-bold text-on-surface">{selected_service_name}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-on-surface-variant">{t('employee.analytics.service_earnings_period')}</p>
                        <p className="text-xl font-extrabold text-on-surface">
                            {fmt(summary.revenue ?? 0)} {symbol}
                        </p>
                    </div>
                </section>
            )}

            {/* By service */}
            <section className="mb-8 min-w-0 overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between border-b border-slate-50 bg-white px-4 py-4 sm:px-6 md:px-8">
                    <div className="min-w-0 pr-2">
                        <h3 className="font-headline text-base font-bold text-on-surface">{t('employee.analytics.performance_by_service')}</h3>
                        <p className="mt-0.5 text-xs text-on-surface-variant">{t('employee.analytics.performance_by_service_hint')}</p>
                    </div>
                </div>

                {service_stats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
                        <Icon name="query_stats" size="text-5xl" className="mb-3 text-outline" />
                        <p className="text-sm font-bold text-on-surface">{t('employee.analytics.no_appointments')}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">{t('employee.analytics.no_appointments_hint')}</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3 border-b border-slate-50 bg-white p-4 md:hidden">
                            {service_stats.map((row) => (
                                <article
                                    key={row.service_id}
                                    className="rounded-2xl border border-outline-variant/35 bg-surface-container-low/50 p-4 shadow-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container font-headline text-sm font-bold text-on-primary">
                                            {(row.service_name || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <p className="min-w-0 text-sm font-bold text-on-surface">{row.service_name}</p>
                                    </div>
                                    <div className="mt-4 space-y-2.5">
                                        <div className="grid grid-cols-2 gap-2.5">
                                            <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest/80 px-3 py-2.5 text-center">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
                                                    {t('employee.analytics.th_confirmed')}
                                                </p>
                                                <p className="mt-0.5 text-xl font-extrabold tabular-nums text-emerald-600">{row.confirmed_count}</p>
                                            </div>
                                            <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest/80 px-3 py-2.5 text-center">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
                                                    {t('employee.analytics.th_revenue')}
                                                </p>
                                                <p className="mt-0.5 text-base font-extrabold tabular-nums text-on-surface">
                                                    {fmt(row.revenue)} {symbol}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2.5">
                                            <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest/80 px-3 py-2 text-center">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
                                                    {t('employee.analytics.th_pending')}
                                                </p>
                                                <p className="mt-0.5 text-lg font-semibold tabular-nums text-amber-600">{row.pending_count}</p>
                                            </div>
                                            <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest/80 px-3 py-2 text-center">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
                                                    {t('employee.analytics.th_cancelled')}
                                                </p>
                                                <p className="mt-0.5 text-lg font-semibold tabular-nums text-red-600">{row.cancelled_count}</p>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[720px] border-collapse text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">
                                            {t('employee.analytics.th_service')}
                                        </th>
                                        <th className="px-8 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-outline">
                                            {t('employee.analytics.th_cancelled')}
                                        </th>
                                        <th className="px-8 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-outline">
                                            {t('employee.analytics.th_pending')}
                                        </th>
                                        <th className="px-8 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-outline">
                                            {t('employee.analytics.th_confirmed')}
                                        </th>
                                        <th className="px-8 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-outline">
                                            {t('employee.analytics.th_revenue')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {service_stats.map((row) => (
                                        <tr key={row.service_id} className="transition-colors hover:bg-slate-50/50">
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-bold text-on-surface">{row.service_name}</p>
                                            </td>
                                            <td className="px-8 py-5 text-center text-sm font-semibold text-red-600">{row.cancelled_count}</td>
                                            <td className="px-8 py-5 text-center text-sm font-semibold text-amber-600">{row.pending_count}</td>
                                            <td className="px-8 py-5 text-center text-sm font-semibold text-emerald-600">{row.confirmed_count}</td>
                                            <td className="px-8 py-5 text-center font-extrabold text-on-surface">
                                                {fmt(row.revenue)} {symbol}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </section>

            {/* Monthly overview */}
            <section className="mt-8 min-w-0 overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm ring-1 ring-slate-100">
                <div className="border-b border-slate-50 bg-white px-4 py-4 sm:px-6 md:px-8 md:py-5">
                    <h3 className="font-headline text-base font-bold text-on-surface">{t('employee.analytics.monthly_overview')}</h3>
                    <p className="mt-0.5 text-xs text-on-surface-variant">{t('employee.analytics.monthly_overview_hint')}</p>
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
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
                                            {t('employee.analytics.th_confirmed')}
                                        </p>
                                        <p className="mt-0.5 text-xl font-extrabold tabular-nums text-emerald-600">{m.confirmed}</p>
                                    </div>
                                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest/80 px-3 py-2.5 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
                                            {t('employee.analytics.th_revenue')}
                                        </p>
                                        <p className="mt-0.5 text-base font-extrabold tabular-nums text-on-surface">
                                            {fmt(m.revenue)} {symbol}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest/80 px-3 py-2 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
                                            {t('employee.analytics.th_pending')}
                                        </p>
                                        <p className="mt-0.5 text-lg font-semibold tabular-nums text-amber-600">{m.pending}</p>
                                    </div>
                                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest/80 px-3 py-2 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
                                            {t('employee.analytics.th_cancelled')}
                                        </p>
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
                                    {t('employee.analytics.th_month')}
                                </th>
                                <th className="px-8 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-outline">
                                    {t('employee.analytics.th_cancelled')}
                                </th>
                                <th className="px-8 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-outline">
                                    {t('employee.analytics.th_pending')}
                                </th>
                                <th className="px-8 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-outline">
                                    {t('employee.analytics.th_confirmed')}
                                </th>
                                <th className="px-8 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-outline">
                                    {t('employee.analytics.th_revenue')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {monthly_performance.map((m) => (
                                <tr key={m.month} className="transition-colors hover:bg-slate-50/50">
                                    <td className="px-8 py-4 text-sm font-semibold text-on-surface">{m.label}</td>
                                    <td className="px-8 py-4 text-center text-sm font-semibold text-red-600">{m.cancelled}</td>
                                    <td className="px-8 py-4 text-center text-sm font-semibold text-amber-600">{m.pending}</td>
                                    <td className="px-8 py-4 text-center text-sm font-semibold text-emerald-600">{m.confirmed}</td>
                                    <td className="px-8 py-4 text-center font-bold text-on-surface">
                                        {fmt(m.revenue)} {symbol}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </EmployeeLayout>
    );
}
