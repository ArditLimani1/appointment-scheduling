import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import Icon from '@/Components/Icon';
import PageHeader from '@/Components/PageHeader';
import FilterListbox from '@/Components/FilterListbox';
import DatePicker from '@/Components/DatePicker';

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
                Export
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
                        <span className="font-semibold">Export to Excel</span>
                    </a>
                    <a
                        href={buildExportUrl(filters, 'employee.analytics.export-pdf')}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-slate-50 transition-colors border-t border-slate-100"
                    >
                        <Icon name="picture_as_pdf" size="text-base" className="text-red-500" />
                        <span className="font-semibold">Export to PDF</span>
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

    const clearFilters = useCallback(() => {
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
            { value: '', label: 'All services' },
            ...service_options.map((s) => ({ value: String(s.id), label: s.name })),
        ],
        [service_options]
    );

    const fmt = (num) =>
        Number(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <EmployeeLayout>
            <Head title="Analytics" />

            <PageHeader
                title="Analytics"
                description="Review your appointments, revenue, and monthly trends. Filters apply to all sections and exports."
            >
                <ExportDropdown filters={localFilters} />
            </PageHeader>

            <section className="mb-8 bg-surface-container-lowest rounded-2xl p-6 ring-1 ring-slate-100 shadow-sm">
                <div className="flex flex-wrap gap-4 items-end">
                    <DatePicker
                        label="From"
                        value={localFilters.date_from}
                        onChange={(value) => patchFilters({ date_from: value })}
                        placeholder="Start date"
                    />
                    <DatePicker
                        label="To"
                        value={localFilters.date_to}
                        onChange={(value) => patchFilters({ date_to: value })}
                        placeholder="End date"
                    />
                    <FilterListbox
                        label="Service"
                        value={localFilters.service_id}
                        onChange={(value) => patchFilters({ service_id: value })}
                        options={serviceListboxOptions}
                    />
                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-slate-50 transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </section>

            {/* Summary widgets */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                <div className="bg-surface-container-lowest rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Total appointments</p>
                    <p className="mt-2 text-3xl font-extrabold font-headline text-on-surface">
                        {(summary.total_appointments ?? 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-surface-container-lowest rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Confirmed</p>
                    <p className="mt-2 text-3xl font-extrabold font-headline text-emerald-700">
                        {(summary.confirmed_count ?? 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-surface-container-lowest rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Cancelled</p>
                    <p className="mt-2 text-3xl font-extrabold font-headline text-red-700">
                        {(summary.cancelled_count ?? 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-surface-container-lowest rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Pending</p>
                    <p className="mt-2 text-3xl font-extrabold font-headline text-amber-700">
                        {(summary.pending_count ?? 0).toLocaleString()}
                    </p>
                </div>
                <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2 bg-primary-container rounded-2xl shadow-lg p-6 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Total earnings</p>
                    <p className="mt-1 text-3xl sm:text-4xl font-extrabold font-headline text-white">
                        {fmt(summary.revenue ?? 0)} {symbol}
                    </p>
                    <p className="mt-1 text-xs text-white/60">From confirmed appointments in this period</p>
                </div>
            </section>

            {selected_service_name && (
                <section className="mb-8 rounded-2xl border border-slate-200 bg-slate-50/80 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-on-surface text-surface">
                            <Icon name="content_cut" size="text-xl" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-outline">Filtered service</p>
                            <p className="text-lg font-bold text-on-surface">{selected_service_name}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-on-surface-variant">Earnings for this service (period)</p>
                        <p className="text-xl font-extrabold text-on-surface">
                            {fmt(summary.revenue ?? 0)} {symbol}
                        </p>
                    </div>
                </section>
            )}

            {/* By service */}
            <section className="bg-surface-container-lowest rounded-2xl overflow-hidden ring-1 ring-slate-100 shadow-sm mb-8">
                <div className="px-8 py-5 border-b border-slate-50 bg-white">
                    <h3 className="font-headline font-bold text-base text-on-surface">Performance by service</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                        Counts and revenue per service you performed in the selected range
                    </p>
                </div>

                {service_stats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                        <Icon name="query_stats" size="text-5xl" className="text-outline mb-3" />
                        <p className="text-sm font-bold text-on-surface">No appointments in this period</p>
                        <p className="text-xs text-on-surface-variant mt-1">Try changing dates or the service filter.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Service</th>
                                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">
                                        Cancelled
                                    </th>
                                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">
                                        Pending
                                    </th>
                                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">
                                        Confirmed
                                    </th>
                                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">
                                        Revenue
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {service_stats.map((row) => (
                                    <tr key={row.service_id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-bold text-on-surface">{row.service_name}</p>
                                        </td>
                                        <td className="px-8 py-5 text-center text-sm font-semibold text-red-600">
                                            {row.cancelled_count}
                                        </td>
                                        <td className="px-8 py-5 text-center text-sm font-semibold text-amber-600">
                                            {row.pending_count}
                                        </td>
                                        <td className="px-8 py-5 text-center text-sm font-semibold text-emerald-600">
                                            {row.confirmed_count}
                                        </td>
                                        <td className="px-8 py-5 text-center font-extrabold text-on-surface">
                                            {fmt(row.revenue)} {symbol}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Monthly overview */}
            <section className="bg-surface-container-lowest rounded-2xl overflow-hidden ring-1 ring-slate-100 shadow-sm">
                <div className="px-8 py-5 border-b border-slate-50 bg-white">
                    <h3 className="font-headline font-bold text-base text-on-surface">Monthly overview</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                        Each calendar month that falls inside your date range (zeros when no activity)
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Month</th>
                                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">
                                    Cancelled
                                </th>
                                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">
                                    Pending
                                </th>
                                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">
                                    Confirmed
                                </th>
                                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">
                                    Revenue
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {monthly_performance.map((m) => (
                                <tr key={m.month} className="hover:bg-slate-50/50 transition-colors">
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
