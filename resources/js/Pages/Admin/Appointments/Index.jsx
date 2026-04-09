import { Head, Link, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import PageHeader from '@/Components/PageHeader';
import FilterListbox from '@/Components/FilterListbox';
import FilterStatusMulti from '@/Components/FilterStatusMulti';
import DatePicker from '@/Components/DatePicker';
import AppointmentStatusMenu from '@/Components/AppointmentStatusMenu';
import EditAppointmentModal from '@/Components/EditAppointmentModal';
import { formatAppointmentDate, formatTimeHm } from '@/utils/appointmentDate';
import {
    appendAppointmentStatusParams,
    DEFAULT_APPOINTMENT_STATUS_FILTER,
    normalizeAppointmentStatusFilter,
} from '@/utils/appointmentStatusFilter';

function DeleteConfirmModal({ appointment, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-red-100">
                        <Icon name="delete" size="text-xl" className="text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-extrabold text-on-surface">Delete Appointment</h2>
                        <p className="mt-1 text-sm text-on-surface-variant">
                            Are you sure you want to delete the appointment for{' '}
                            <span className="font-semibold text-on-surface">
                                {appointment.client_first_name} {appointment.client_last_name}
                            </span>
                            {' '}on{' '}
                            <span className="font-semibold text-on-surface">
                                {appointment.date ? String(appointment.date).slice(0, 10) : ''} at {appointment.start_time ? appointment.start_time.slice(0, 5) : ''}
                            </span>
                            ? This action cannot be undone.
                        </p>
                    </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors"
                    >
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

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

function appointmentsFiltersToSearchParams(filters) {
    const params = new URLSearchParams();
    if (filters.employee_id !== '' && filters.employee_id != null) {
        params.set('employee_id', String(filters.employee_id));
    }
    if (filters.date_from) {
        params.set('date_from', filters.date_from);
    }
    if (filters.date_to) {
        params.set('date_to', filters.date_to);
    }
    appendAppointmentStatusParams(params, filters.status);
    return params;
}

function buildAppointmentsUrl(filters) {
    const params = appointmentsFiltersToSearchParams(filters);
    const queryString = params.toString();
    const pathname = getRoutePathname('admin.appointments.index');
    return pathname + (queryString ? `?${queryString}` : '');
}

function normalizeAppointments(appointments) {
    if (!appointments) return { rows: [], meta: null };
    if (Array.isArray(appointments)) return { rows: appointments, meta: null };
    if (Array.isArray(appointments.data)) return { rows: appointments.data, meta: appointments };
    return { rows: [], meta: null };
}

function ExportDropdown({ excelUrl, pdfUrl }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    return (
        <div ref={ref} className="relative shrink-0">
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl bg-on-surface px-6 py-3 text-sm font-bold text-surface hover:opacity-90 transition-opacity"
            >
                <Icon name="download" size="text-lg" />
                Export
                <span className="ml-1 text-xs opacity-70">▾</span>
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white shadow-lg ring-1 ring-black/10 z-50 overflow-hidden">
                    <a
                        href={excelUrl}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        <Icon name="table_chart" size="text-base" /> Export Excel
                    </a>
                    <a
                        href={pdfUrl}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        <Icon name="picture_as_pdf" size="text-base" /> Export PDF
                    </a>
                </div>
            )}
        </div>
    );
}

export default function Index({ appointments, employees, services = [], filters = {} }) {
    const { auth } = usePage().props;
    const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF' };
    const currencySymbol = CURRENCY_SYMBOLS[auth?.business?.currency] ?? auth?.business?.currency_symbol ?? '€';

    const { rows, meta } = useMemo(() => normalizeAppointments(appointments), [appointments]);
    const totalCount = meta?.total ?? rows.length;

    const statusFilterKey = Array.isArray(filters.status)
        ? [...filters.status].sort().join('|')
        : String(filters.status ?? '');

    const [localFilters, setLocalFilters] = useState({
        employee_id: filters.employee_id != null && filters.employee_id !== '' ? String(filters.employee_id) : '',
        date_from: filters.date_from ?? currentMonthStart(),
        date_to: filters.date_to ?? currentMonthEnd(),
        status: normalizeAppointmentStatusFilter(filters.status),
    });

    useEffect(() => {
        setLocalFilters({
            employee_id: filters.employee_id != null && filters.employee_id !== '' ? String(filters.employee_id) : '',
            date_from: filters.date_from ?? currentMonthStart(),
            date_to: filters.date_to ?? currentMonthEnd(),
            status: normalizeAppointmentStatusFilter(filters.status),
        });
    }, [filters.employee_id, filters.date_from, filters.date_to, statusFilterKey]);

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
        const defaultFilters = {
            employee_id: '',
            date_from: currentMonthStart(),
            date_to: currentMonthEnd(),
            status: [...DEFAULT_APPOINTMENT_STATUS_FILTER],
        };
        setLocalFilters(defaultFilters);
        router.get(buildAppointmentsUrl(defaultFilters), {}, visitOpts);
    };

    const [editingAppointment, setEditingAppointment]   = useState(null);
    const [deletingAppointment, setDeletingAppointment] = useState(null);

    const updateStatus = (apt, status) => {
        router.patch(route('admin.appointments.update', apt.id), { status }, { preserveScroll: true });
    };

    const confirmDelete = () => {
        if (!deletingAppointment) return;
        router.delete(
            route('admin.appointments.destroy', deletingAppointment.id),
            {
                preserveScroll: true,
                onSuccess: () => setDeletingAppointment(null),
                onError:   () => setDeletingAppointment(null),
            }
        );
    };

    const buildExportUrl = (routeName) => {
        const params = appointmentsFiltersToSearchParams(localFilters);
        const queryString = params.toString();
        const pathname = getRoutePathname(routeName);
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
        () =>
            APPOINTMENT_STATUSES.map((status) => ({
                value: status,
                label: status.replace('_', ' '),
            })),
        [],
    );

    return (
        <AdminLayout>
            <Head title="Appointments" />

            <PageHeader
                title="Appointments"
                description="View and manage all customer bookings. Results update when you change staff, dates, or status."
            >
                <Link
                    href={route('admin.appointments.calendar')}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-on-surface hover:bg-slate-50"
                >
                    <Icon name="calendar_view_week" size="text-lg" />
                    Calendar
                </Link>
                <ExportDropdown
                    excelUrl={buildExportUrl('admin.appointments.export')}
                    pdfUrl={buildExportUrl('admin.appointments.export-pdf')}
                />
            </PageHeader>

            <div className="mb-6 rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-slate-100 shadow-sm">
                <div className="flex flex-wrap gap-3 items-end">
                    <FilterListbox
                        label="Employee"
                        value={localFilters.employee_id}
                        onChange={(v) => patchFilters({ employee_id: v })}
                        options={employeeOptions}
                    />
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
                    <FilterStatusMulti
                        label="Status"
                        value={localFilters.status}
                        onChange={(v) => patchFilters({ status: v })}
                        options={statusOptions}
                        minWidthClass="min-w-[200px]"
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
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingAppointment(apt)}
                                                        className="inline-flex rounded-lg p-2 text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Icon name="edit" size="text-[18px]" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingAppointment(apt)}
                                                        className="inline-flex rounded-lg p-2 text-outline hover:text-error hover:bg-error-container transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Icon name="delete" size="text-[18px]" />
                                                    </button>
                                                </div>
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
            {editingAppointment && (
                <EditAppointmentModal
                    appointment={editingAppointment}
                    employees={employees}
                    services={services}
                    onClose={() => setEditingAppointment(null)}
                />
            )}

            {deletingAppointment && (
                <DeleteConfirmModal
                    appointment={deletingAppointment}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeletingAppointment(null)}
                />
            )}
        </AdminLayout>
    );
}
