import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import Icon from '@/Components/Icon';
import PageHeader from '@/Components/PageHeader';
import FilterListbox from '@/Components/FilterListbox';
import DatePicker from '@/Components/DatePicker';
import { useT } from '@/i18n/useT';

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

    const visitOpts = useMemo(() => ({ preserveState: false, replace: true, preserveScroll: true }), []);

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

            <section className="mb-8 bg-surface-container-lowest rounded-2xl p-4 ring-1 ring-slate-100 shadow-sm md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:gap-4">
                    <DatePicker
                        className="w-full min-w-0 md:w-auto md:min-w-[12rem]"
                        buttonClassName="min-w-0 md:min-w-[190px]"
                        label={t('employee.analytics.from')}
                        value={localFilters.date_from}
                        onChange={(value) => patchFilters({ date_from: value })}
                        placeholder={t('employee.analytics.start_date_ph')}
                    />
                    <DatePicker
                        className="w-full min-w-0 md:w-auto md:min-w-[12rem]"
                        buttonClassName="min-w-0 md:min-w-[190px]"
                        label={t('employee.analytics.to')}
                        value={localFilters.date_to}
                        onChange={(value) => patchFilters({ date_to: value })}
                        placeholder={t('employee.analytics.end_date_ph')}
                    />
                    <FilterListbox
                        wrapperClassName="flex w-full min-w-0 flex-col gap-1.5 md:w-auto md:min-w-[12rem]"
                        minWidthClass="min-w-0"
                        label={t('employee.analytics.service')}
                        value={localFilters.service_id}
                        onChange={(value) => patchFilters({ service_id: value })}
                        options={serviceListboxOptions}
                    />
                    <div className="flex w-full items-end md:w-auto">
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="w-full rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-slate-50 md:w-auto"
                        >
                            {t('employee.analytics.reset')}
                        </button>
                    </div>
                </div>
            </section>

            {/* Summary widgets — compact 2×2 on mobile, full strip from sm */}
            <section className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
                <div className="rounded-xl border border-slate-100 bg-surface-container-lowest p-3 shadow-sm sm:rounded-2xl sm:p-6">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-outline sm:text-[10px]">
                        {t('employee.analytics.total_appointments')}
                    </p>
                    <p className="mt-1.5 font-headline text-xl font-extrabold text-on-surface sm:mt-2 sm:text-3xl">
                        {(summary.total_appointments ?? 0).toLocaleString()}
                    </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-surface-container-lowest p-3 shadow-sm sm:rounded-2xl sm:p-6">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-outline sm:text-[10px]">
                        {t('employee.analytics.confirmed')}
                    </p>
                    <p className="mt-1.5 font-headline text-xl font-extrabold text-emerald-700 sm:mt-2 sm:text-3xl">
                        {(summary.confirmed_count ?? 0).toLocaleString()}
                    </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-surface-container-lowest p-3 shadow-sm sm:rounded-2xl sm:p-6">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-outline sm:text-[10px]">
                        {t('employee.analytics.cancelled')}
                    </p>
                    <p className="mt-1.5 font-headline text-xl font-extrabold text-red-700 sm:mt-2 sm:text-3xl">
                        {(summary.cancelled_count ?? 0).toLocaleString()}
                    </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-surface-container-lowest p-3 shadow-sm sm:rounded-2xl sm:p-6">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-outline sm:text-[10px]">
                        {t('employee.analytics.pending')}
                    </p>
                    <p className="mt-1.5 font-headline text-xl font-extrabold text-amber-700 sm:mt-2 sm:text-3xl">
                        {(summary.pending_count ?? 0).toLocaleString()}
                    </p>
                </div>
                <div className="col-span-2 flex flex-col justify-center rounded-xl bg-primary-container p-4 shadow-lg sm:col-span-2 sm:rounded-2xl sm:p-6 lg:col-span-2 xl:col-span-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/70 sm:text-[10px]">
                        {t('employee.analytics.total_earnings')}
                    </p>
                    <p className="mt-0.5 font-headline text-2xl font-extrabold text-white sm:mt-1 sm:text-3xl md:text-4xl">
                        {fmt(summary.revenue ?? 0)} {symbol}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/60 sm:mt-1 sm:text-xs">{t('employee.analytics.earnings_hint')}</p>
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
            <section className="mb-8 overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm ring-1 ring-slate-100">
                <div className="border-b border-slate-50 bg-white px-4 py-4 md:px-8 md:py-5">
                    <h3 className="font-headline text-base font-bold text-on-surface">{t('employee.analytics.performance_by_service')}</h3>
                    <p className="mt-0.5 text-xs text-on-surface-variant">{t('employee.analytics.performance_by_service_hint')}</p>
                </div>

                {service_stats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
                        <Icon name="query_stats" className="mb-3 text-outline" size="text-5xl" />
                        <p className="text-sm font-bold text-on-surface">{t('employee.analytics.no_appointments')}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">{t('employee.analytics.no_appointments_hint')}</p>
                    </div>
                ) : (
                    <>
                        <div className="divide-y divide-slate-100 md:hidden">
                            {service_stats.map((row) => (
                                <article key={row.service_id} className="bg-white px-4 py-4">
                                    <h4 className="text-sm font-bold text-on-surface">{row.service_name}</h4>
                                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                        <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                                            <dt className="font-bold uppercase tracking-wider text-outline">
                                                {t('employee.analytics.th_cancelled')}
                                            </dt>
                                            <dd className="mt-1 text-lg font-semibold tabular-nums text-red-600">{row.cancelled_count}</dd>
                                        </div>
                                        <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                                            <dt className="font-bold uppercase tracking-wider text-outline">
                                                {t('employee.analytics.th_pending')}
                                            </dt>
                                            <dd className="mt-1 text-lg font-semibold tabular-nums text-amber-600">{row.pending_count}</dd>
                                        </div>
                                        <div className="col-span-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                                            <dt className="font-bold uppercase tracking-wider text-outline">
                                                {t('employee.analytics.th_confirmed')}
                                            </dt>
                                            <dd className="mt-1 text-lg font-extrabold tabular-nums text-emerald-600">{row.confirmed_count}</dd>
                                        </div>
                                        <div className="col-span-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                                            <dt className="font-bold uppercase tracking-wider text-outline">
                                                {t('employee.analytics.th_revenue')}
                                            </dt>
                                            <dd className="mt-1 text-lg font-extrabold tabular-nums text-on-surface">
                                                {fmt(row.revenue)} {symbol}
                                            </dd>
                                        </div>
                                    </dl>
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
            <section className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm ring-1 ring-slate-100">
                <div className="border-b border-slate-50 bg-white px-4 py-4 md:px-8 md:py-5">
                    <h3 className="font-headline text-base font-bold text-on-surface">{t('employee.analytics.monthly_overview')}</h3>
                    <p className="mt-0.5 text-xs text-on-surface-variant">{t('employee.analytics.monthly_overview_hint')}</p>
                </div>
                <div className="divide-y divide-slate-100 md:hidden">
                    {monthly_performance.map((m) => (
                        <article key={m.month} className="bg-white px-4 py-4">
                            <h4 className="text-sm font-bold text-on-surface">{m.label}</h4>
                            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                                    <dt className="font-bold uppercase tracking-wider text-outline">{t('employee.analytics.th_cancelled')}</dt>
                                    <dd className="mt-1 text-lg font-semibold tabular-nums text-red-600">{m.cancelled}</dd>
                                </div>
                                <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                                    <dt className="font-bold uppercase tracking-wider text-outline">{t('employee.analytics.th_pending')}</dt>
                                    <dd className="mt-1 text-lg font-semibold tabular-nums text-amber-600">{m.pending}</dd>
                                </div>
                                <div className="col-span-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                                    <dt className="font-bold uppercase tracking-wider text-outline">{t('employee.analytics.th_confirmed')}</dt>
                                    <dd className="mt-1 text-lg font-extrabold tabular-nums text-emerald-600">{m.confirmed}</dd>
                                </div>
                                <div className="col-span-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                                    <dt className="font-bold uppercase tracking-wider text-outline">{t('employee.analytics.th_revenue')}</dt>
                                    <dd className="mt-1 text-lg font-extrabold tabular-nums text-on-surface">
                                        {fmt(m.revenue)} {symbol}
                                    </dd>
                                </div>
                            </dl>
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
