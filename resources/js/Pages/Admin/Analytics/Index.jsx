import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import PageHeader from '@/Components/PageHeader';
import FilterListbox from '@/Components/FilterListbox';
import DatePicker from '@/Components/DatePicker';

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

function buildExportUrl(filters) {
    const queryParams = {};
    if (filters.date_from) queryParams.date_from = filters.date_from;
    if (filters.date_to) queryParams.date_to = filters.date_to;
    if (filters.employee_id !== '' && filters.employee_id != null) {
        queryParams.employee_id = String(filters.employee_id);
    }
    const queryString = new URLSearchParams(queryParams).toString();
    const pathname = new URL(route('admin.analytics.export'), window.location.href).pathname;
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

export default function Index({
    total_appointments,
    total_revenue,
    employee_stats,
    employees,
    filters = {},
    currency_symbol,
}) {
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
        { value: '', label: 'All Employees' },
        ...employees.map((employee) => ({ value: String(employee.id), label: employee.name })),
    ], [employees]);

    const fmt = (num) => Number(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <AdminLayout>
            <Head title="Analytics" />

            <PageHeader
                title="Analytics"
                description="Track your business efficiency and financial growth through detailed appointment metrics."
            >
                <a
                    href={buildExportUrl(localFilters)}
                    className="flex items-center gap-2 rounded-xl bg-on-surface px-6 py-3 text-sm font-bold text-surface hover:opacity-90 transition-opacity shrink-0"
                >
                    <Icon name="download" size="text-lg" /> Export to Excel
                </a>
            </PageHeader>

            {/* Filters */}
            <section className="mb-8 bg-surface-container-lowest rounded-2xl p-6 ring-1 ring-slate-100 shadow-sm">
                <div className="flex flex-wrap gap-4 items-end">
                    <DatePicker
                        label="Start Date"
                        value={localFilters.date_from}
                        onChange={(value) => patchFilters({ date_from: value })}
                        placeholder="Start date"
                    />
                    <DatePicker
                        label="End Date"
                        value={localFilters.date_to}
                        onChange={(value) => patchFilters({ date_to: value })}
                        placeholder="End date"
                    />
                    <FilterListbox
                        label="Employee"
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
                            Reset
                        </button>
                    </div>
                </div>
            </section>

            {/* Widgets */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-surface-container-lowest rounded-3xl border border-slate-100 shadow-sm p-8 flex items-center justify-between">
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-outline uppercase tracking-widest">Total Appointments</p>
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
                        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Total Revenue</p>
                        <p className="text-5xl font-extrabold font-headline tracking-tight text-white">
                            {fmt(total_revenue)} {symbol}
                        </p>
                        <p className="text-xs text-white/60">Based on confirmed appointments</p>
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
                        <h3 className="font-headline font-bold text-base text-on-surface">Employee Performance</h3>
                        <p className="text-xs text-on-surface-variant mt-0.5">Breakdown of metrics by staff member</p>
                    </div>
                </div>

                {employee_stats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                        <Icon name="query_stats" size="text-5xl" className="text-outline mb-3" />
                        <p className="text-sm font-bold text-on-surface">No data for the selected period</p>
                        <p className="text-xs text-on-surface-variant mt-1">
                            Try adjusting the date range or employee filter.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Employee</th>
                                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-right">Cancelled</th>
                                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-right">Pending</th>
                                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-right">Confirmed</th>
                                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-right">Revenue</th>
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
                                        <td className="px-8 py-5 text-right">
                                            <span className="text-sm font-semibold text-red-600">{stat.cancelled_count}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="text-sm font-semibold text-amber-600">{stat.pending_count}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="text-sm font-semibold text-emerald-600">{stat.confirmed_count}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right font-extrabold text-on-surface">
                                            {fmt(stat.revenue)} {symbol}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </AdminLayout>
    );
}
