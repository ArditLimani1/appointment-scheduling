import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import PageHeader from '@/Components/PageHeader';
import FilterListbox from '@/Components/FilterListbox';
import AppointmentStatusMenu from '@/Components/AppointmentStatusMenu';
import { formatAppointmentDate, formatTimeHm } from '@/utils/appointmentDate';

const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'cancelled'];

function currentMonthStart() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function currentMonthEnd() {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getRoutePathname(routeName) {
    return new URL(route(routeName), window.location.href).pathname;
}

function buildFilterQueryParams(filters) {
    const queryParams = {};
    if (filters.employee_id !== '' && filters.employee_id != null) {
        queryParams.employee_id = String(filters.employee_id);
    }
    if (filters.date_from) {
        queryParams.date_from = filters.date_from;
    }
    if (filters.date_to) {
        queryParams.date_to = filters.date_to;
    }
    if (filters.status) {
        queryParams.status = filters.status;
    }
    return queryParams;
}

function buildAppointmentsUrl(filters) {
    const queryParams = buildFilterQueryParams(filters);
    const queryString = new URLSearchParams(queryParams).toString();
    const pathname = getRoutePathname('admin.appointments.index');
    return pathname + (queryString ? `?${queryString}` : '');
}

function normalizeAppointments(appointments) {
    if (!appointments) return { rows: [], meta: null };
    if (Array.isArray(appointments)) return { rows: appointments, meta: null };
    if (Array.isArray(appointments.data)) return { rows: appointments.data, meta: appointments };
    return { rows: [], meta: null };
}

export default function Index({ appointments, employees, filters = {} }) {
    const { auth } = usePage().props;
    const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF' };
    const currencySymbol = CURRENCY_SYMBOLS[auth?.business?.currency] ?? auth?.business?.currency_symbol ?? '€';

    const { rows, meta } = useMemo(() => normalizeAppointments(appointments), [appointments]);
    const totalCount = meta?.total ?? rows.length;

    const [localFilters, setLocalFilters] = useState({
        employee_id: filters.employee_id != null && filters.employee_id !== '' ? String(filters.employee_id) : '',
        date_from: filters.date_from ?? currentMonthStart(),
        date_to: filters.date_to ?? currentMonthEnd(),
        status: filters.status ?? '',
    });

    useEffect(() => {
        setLocalFilters({
            employee_id: filters.employee_id != null && filters.employee_id !== '' ? String(filters.employee_id) : '',
            date_from: filters.date_from ?? currentMonthStart(),
            date_to: filters.date_to ?? currentMonthEnd(),
            status: filters.status ?? '',
        });
    }, [filters.employee_id, filters.date_from, filters.date_to, filters.status]);

    const visitOpts = useMemo(
        () => ({
            preserveState: false,
            replace: true,
            preserveScroll: true,
        }),
        [],
    );

    const patchFilters = useCallback((patch) => {
        setLocalFilters((currentFilters) => {
            const updatedFilters = { ...currentFilters, ...patch };
            router.get(buildAppointmentsUrl(updatedFilters), {}, visitOpts);
            return updatedFilters;
        });
    }, [visitOpts]);

    const clearFilters = () => {
        const defaultFilters = { employee_id: '', date_from: currentMonthStart(), date_to: currentMonthEnd(), status: '' };
        setLocalFilters(defaultFilters);
        router.get(buildAppointmentsUrl(defaultFilters), {}, visitOpts);
    };

    const updateStatus = (apt, status) => {
        router.patch(route('admin.appointments.update', apt.id), { status }, { preserveScroll: true });
    };

    const deleteAppointment = (apt) => {
        if (confirm('Delete this appointment?')) {
            router.delete(route('admin.appointments.destroy', apt.id), { preserveScroll: true });
        }
    };

    const exportUrl = () => {
        const queryParams = buildFilterQueryParams(localFilters);
        const queryString = new URLSearchParams(queryParams).toString();
        const pathname = getRoutePathname('admin.appointments.export');
        return pathname + (queryString ? `?${queryString}` : '');
    };

    const navigateToPage = (url) => {
        if (!url) return;
        try {
            const parsedUrl = new URL(url, window.location.href);
            const relativeUrl = parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
            router.get(relativeUrl, {}, { preserveState: false, preserveScroll: true });
        } catch {
            router.visit(url, { preserveState: false, preserveScroll: true });
        }
    };

    const employeeOptions = useMemo(
        () => [
            { value: '', label: 'All Staff' },
            ...employees.map((e) => ({ value: String(e.id), label: e.name })),
        ],
        [employees],
    );

    const statusOptions = useMemo(
        () => [
            { value: '', label: 'All Statuses' },
            ...APPOINTMENT_STATUSES.map((status) => ({
                value: status,
                label: status.replace('_', ' '),
            })),
        ],
        [],
    );

    return (
        <AdminLayout>
            <Head title="Appointments" />

            <PageHeader
                title="Appointments"
                description="View and manage all customer bookings. Results update when you change staff, dates, or status."
            >
                <a
                    href={exportUrl()}
                    className="flex items-center gap-2 rounded-xl bg-on-surface px-6 py-3 text-sm font-bold text-surface hover:opacity-90 transition-opacity shrink-0"
                >
                    <Icon name="download" size="text-lg" /> Export Excel
                </a>
            </PageHeader>

            <div className="mb-6 rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-slate-100 shadow-sm">
                <div className="flex flex-wrap gap-3 items-end">
                    <FilterListbox
                        label="Employee"
                        value={localFilters.employee_id}
                        onChange={(v) => patchFilters({ employee_id: v })}
                        options={employeeOptions}
                    />
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-1">From</label>
                        <input
                            type="date"
                            value={localFilters.date_from}
                            onChange={(e) => patchFilters({ date_from: e.target.value })}
                            className="w-full rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-on-primary-container/20"
                        />
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-1">To</label>
                        <input
                            type="date"
                            value={localFilters.date_to}
                            onChange={(e) => patchFilters({ date_to: e.target.value })}
                            className="w-full rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-on-primary-container/20"
                        />
                    </div>
                    <FilterListbox
                        label="Status"
                        value={localFilters.status}
                        onChange={(v) => patchFilters({ status: v })}
                        options={statusOptions}
                        minWidthClass="min-w-[140px]"
                    />
                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-slate-50 transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden ring-1 ring-slate-100 shadow-sm">
                <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-white">
                    <h3 className="font-headline font-bold text-base text-on-surface">All bookings</h3>
                    <p className="text-xs text-on-surface-variant">
                        {totalCount} appointment{totalCount !== 1 ? 's' : ''} total
                    </p>
                </div>

                {rows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                        <Icon name="event_busy" size="text-5xl" className="text-outline mb-3" />
                        <p className="text-sm text-on-surface-variant">No appointments match the selected filters.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Client</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Employee</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Service</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Date & Time</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Status</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-right">Price</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {rows.map((apt) => (
                                        <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <p className="font-headline font-bold text-on-surface text-sm">
                                                    {apt.client_first_name} {apt.client_last_name}
                                                </p>
                                                <p className="text-xs text-on-surface-variant">{apt.client_email || apt.client_phone || '—'}</p>
                                            </td>
                                            <td className="px-8 py-5 text-sm text-on-surface-variant">{apt.employee?.name ?? '—'}</td>
                                            <td className="px-8 py-5 text-sm text-on-surface-variant">{apt.service?.name || '—'}</td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-semibold text-on-surface">
                                                    {formatAppointmentDate(apt.date, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                                <p className="text-xs text-on-surface-variant">
                                                    {formatTimeHm(apt.start_time)} – {formatTimeHm(apt.end_time)}
                                                </p>
                                            </td>
                                            <td className="px-8 py-5 align-middle">
                                                <AppointmentStatusMenu status={apt.status} onChange={(s) => updateStatus(apt, s)} />
                                            </td>
                                            <td className="px-8 py-5 text-right text-sm font-bold text-on-surface">
                                                {Number(apt.price).toFixed(2)} {currencySymbol}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => deleteAppointment(apt)}
                                                    className="inline-flex rounded-lg p-2 text-outline hover:text-error hover:bg-error-container transition-colors"
                                                    title="Delete"
                                                >
                                                    <Icon name="delete" size="text-[18px]" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-8 py-4 bg-slate-50/30 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-50">
                            <p className="text-sm text-on-surface-variant">
                                {meta ? (
                                    <>
                                        Showing <span className="font-bold text-on-surface">{meta.from}</span>–
                                        <span className="font-bold text-on-surface">{meta.to}</span> of{' '}
                                        <span className="font-bold text-on-surface">{meta.total}</span>
                                    </>
                                ) : (
                                    <>
                                        Showing <span className="font-bold text-on-surface">{rows.length}</span> appointment
                                        {rows.length !== 1 ? 's' : ''}
                                    </>
                                )}
                            </p>
                            {meta && meta.last_page > 1 && (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={!meta.prev_page_url}
                                        onClick={() => navigateToPage(meta.prev_page_url)}
                                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-sm text-on-surface-variant px-2">
                                        Page {meta.current_page} of {meta.last_page}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={!meta.next_page_url}
                                        onClick={() => navigateToPage(meta.next_page_url)}
                                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
