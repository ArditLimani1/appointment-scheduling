import { Head, Link, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import Icon from '@/Components/Icon';
import DatePicker from '@/Components/DatePicker';
import FilterListbox from '@/Components/FilterListbox';
import FilterStatusMulti from '@/Components/FilterStatusMulti';
import PageHeader from '@/Components/PageHeader';
import EmployeeRescheduleModal from '@/Components/EmployeeRescheduleModal';
import { appointmentStatusValue, formatAppointmentDate, formatTimeHm } from '@/utils/appointmentDate';
import {
    appendAppointmentStatusParams,
    DEFAULT_APPOINTMENT_STATUS_FILTER,
    normalizeAppointmentStatusFilter,
} from '@/utils/appointmentStatusFilter';

const STATUS_STYLES = {
    pending: { bg: 'bg-surface-container-highest text-on-surface-variant', label: 'Pending' },
    confirmed: { bg: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', label: 'Confirmed' },
    cancelled: { bg: 'bg-error-container text-on-error-container', label: 'Cancelled' },
};

const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'cancelled'];

/** Headless UI Listbox can mis-handle empty-string values; use a sentinel for “all services”. */
const SERVICE_FILTER_ALL = 'all';

function currentMonthStart() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function currentMonthEnd() {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getRoutePathname(routeName) {
    try {
        return new URL(route(routeName), window.location.href).pathname;
    } catch {
        return '#';
    }
}

function employeeAppointmentsFiltersToSearchParams(filters) {
    const params = new URLSearchParams();
    if (filters.date_from) {
        params.set('date_from', filters.date_from);
    }
    if (filters.date_to) {
        params.set('date_to', filters.date_to);
    }
    appendAppointmentStatusParams(params, filters.status);
    const sid = filters.service_id;
    if (sid != null && sid !== '' && sid !== SERVICE_FILTER_ALL) {
        params.set('service_id', String(sid));
    }
    const q = typeof filters.search === 'string' ? filters.search.trim() : '';
    if (q !== '') {
        params.set('search', q);
    }
    return params;
}

function buildEmployeeAppointmentsUrl(filters) {
    const params = employeeAppointmentsFiltersToSearchParams(filters);
    const queryString = params.toString();
    const pathname = getRoutePathname('employee.appointments.index');
    return pathname + (queryString ? `?${queryString}` : '');
}

function normalizeAppointments(appointments) {
    if (!appointments) return { rows: [], meta: null };
    if (Array.isArray(appointments)) return { rows: appointments, meta: null };
    if (!Array.isArray(appointments.data)) return { rows: [], meta: null };
    const rows = appointments.data;
    const inner = appointments.meta;
    if (inner && typeof inner === 'object' && !Array.isArray(inner) && inner.current_page !== undefined) {
        return {
            rows,
            meta: {
                ...inner,
                prev_page_url: appointments.prev_page_url ?? inner.prev_page_url,
                next_page_url: appointments.next_page_url ?? inner.next_page_url,
            },
        };
    }
    return { rows, meta: appointments };
}

function fmt(d, opts) {
    try {
        if (!d || Number.isNaN(d.getTime())) return '—';
        return new Intl.DateTimeFormat('en-GB', opts).format(d);
    } catch {
        return '—';
    }
}

function formatPrice(amount, symbol) {
    const n = amount != null && amount !== '' ? Number(amount) : 0;
    const safe = Number.isFinite(n) ? n : 0;
    return `${safe.toFixed(2)} ${symbol}`;
}

function normalizeServiceFilterForState(serviceIdFromServer) {
    if (serviceIdFromServer == null || serviceIdFromServer === '') {
        return SERVICE_FILTER_ALL;
    }
    return String(serviceIdFromServer);
}

function CancelConfirmModal({ appointment, onConfirm, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl">
                <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error-container">
                        <Icon name="warning" size="text-lg" className="text-on-error-container" />
                    </div>
                    <div>
                        <h3 className="font-headline text-base font-bold text-on-surface">Cancel Appointment</h3>
                        <p className="mt-1 text-sm text-on-surface-variant">
                            Are you sure you want to cancel this appointment?
                        </p>
                    </div>
                </div>

                <div className="mb-5 rounded-2xl bg-surface-container-low px-4 py-3 text-sm">
                    <p className="font-semibold text-on-surface">
                        {appointment.client_first_name} {appointment.client_last_name}
                    </p>
                    <p className="text-on-surface-variant mt-0.5">
                        {appointment.service?.name ?? 'Appointment'} · {formatTimeHm(appointment.start_time)}
                    </p>
                </div>

                <div className="flex gap-3 justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                        No, keep it
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-xl bg-error px-5 py-2 text-sm font-semibold text-on-error hover:opacity-90 transition-opacity"
                    >
                        Yes, cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

function AppointmentStatusBadge({ status }) {
    const v = appointmentStatusValue(status);
    const style = STATUS_STYLES[v] || STATUS_STYLES.pending;
    return (
        <span className={`shrink-0 px-3 py-1 text-[10px] font-extrabold uppercase rounded-full ${style.bg}`}>
            {style.label}
        </span>
    );
}

function ExportDropdown({ excelUrl, pdfUrl }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    return (
        <div ref={ref} className="relative shrink-0">
            <button
                type="button"
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

export default function EmployeeAppointmentsIndex({
    appointments,
    services = [],
    filters: filtersProp,
    employee_compact_mobile_appointments = false,
}) {
    const filters = filtersProp ?? {};
    const { auth } = usePage().props;
    const business = auth?.business;
    const permissions = Array.isArray(auth?.permissions) ? auth.permissions : [];
    const canAppointments = permissions.includes('employee.appointments');
    const currencySymbol = business?.currency_symbol ?? '€';

    const { rows, meta } = useMemo(() => normalizeAppointments(appointments), [appointments]);
    const totalCount = meta?.total ?? rows.length;

    const statusFilterKey = Array.isArray(filters.status)
        ? [...filters.status].sort().join('|')
        : String(filters.status ?? '');

    const searchFromServer = typeof filters.search === 'string' ? filters.search : '';

    const [localFilters, setLocalFilters] = useState({
        date_from: filters.date_from ?? currentMonthStart(),
        date_to: filters.date_to ?? currentMonthEnd(),
        status: normalizeAppointmentStatusFilter(filters.status),
        service_id: normalizeServiceFilterForState(filters.service_id),
        search: searchFromServer,
    });

    const [clientSearchDraft, setClientSearchDraft] = useState(searchFromServer);
    const searchDebounceRef = useRef(null);
    const clientSearchDraftRef = useRef(searchFromServer);

    useEffect(() => {
        clientSearchDraftRef.current = clientSearchDraft;
    }, [clientSearchDraft]);

    useEffect(() => {
        setLocalFilters({
            date_from: filters.date_from ?? currentMonthStart(),
            date_to: filters.date_to ?? currentMonthEnd(),
            status: normalizeAppointmentStatusFilter(filters.status),
            service_id: normalizeServiceFilterForState(filters.service_id),
            search: searchFromServer,
        });
        setClientSearchDraft(searchFromServer);
        clientSearchDraftRef.current = searchFromServer;
    }, [filters.date_from, filters.date_to, filters.service_id, filters.search, statusFilterKey]);

    useEffect(
        () => () => {
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
            }
        },
        [],
    );

    const visitOpts = useMemo(
        () => ({
            preserveState: false,
            replace: true,
            preserveScroll: true,
        }),
        [],
    );

    const patchFilters = useCallback(
        (patch) => {
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
                searchDebounceRef.current = null;
            }
            setLocalFilters((currentFilters) => {
                const updatedFilters = {
                    ...currentFilters,
                    ...patch,
                    search: clientSearchDraftRef.current.trim(),
                };
                router.get(buildEmployeeAppointmentsUrl(updatedFilters), {}, visitOpts);
                return updatedFilters;
            });
        },
        [visitOpts],
    );

    const clearFilters = () => {
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
            searchDebounceRef.current = null;
        }
        const defaultFilters = {
            date_from: currentMonthStart(),
            date_to: currentMonthEnd(),
            status: [...DEFAULT_APPOINTMENT_STATUS_FILTER],
            service_id: SERVICE_FILTER_ALL,
            search: '',
        };
        setClientSearchDraft('');
        clientSearchDraftRef.current = '';
        setLocalFilters(defaultFilters);
        router.get(buildEmployeeAppointmentsUrl(defaultFilters), {}, visitOpts);
    };

    const buildExportUrl = (routeName) => {
        const params = employeeAppointmentsFiltersToSearchParams(localFilters);
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

    const serviceList = Array.isArray(services) ? services : [];
    const serviceOptions = useMemo(
        () => [
            { value: SERVICE_FILTER_ALL, label: 'All services' },
            ...serviceList.map((s) => ({ value: String(s.id), label: s.name })),
        ],
        [serviceList],
    );

    const statusOptions = useMemo(
        () =>
            APPOINTMENT_STATUSES.map((status) => ({
                value: status,
                label: status.replace('_', ' '),
            })),
        [],
    );

    const [reschedulingApt, setReschedulingApt] = useState(null);
    const [cancellingApt, setCancellingApt] = useState(null);
    const isRange = localFilters.date_from !== localFilters.date_to;

    const rangeLabel = useMemo(() => {
        const from = localFilters.date_from ?? currentMonthStart();
        const to = localFilters.date_to ?? currentMonthEnd();
        const d1 = new Date(`${from}T12:00:00`);
        const d2 = new Date(`${to}T12:00:00`);
        if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) {
            return '—';
        }
        if (!isRange) {
            return fmt(d1, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        }
        return `${fmt(d1, { day: 'numeric', month: 'short', year: 'numeric' })} – ${fmt(d2, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }, [localFilters.date_from, localFilters.date_to, isRange]);

    const handleConfirm = (apt) => {
        router.patch(route('employee.appointments.update', apt.id), { status: 'confirmed' }, { preserveScroll: true });
    };

    const openCancelModal = (apt) => setCancellingApt(apt);
    const closeCancelModal = () => setCancellingApt(null);

    const confirmCancel = () => {
        if (!cancellingApt) return;
        const apt = cancellingApt;
        setCancellingApt(null);
        router.patch(route('employee.appointments.update', apt.id), { status: 'cancelled' }, { preserveScroll: true });
    };

    /** Same pattern as `Employee/Dashboard.jsx` — approval buttons grouped; reschedule is icon-only. */
    const renderMobileActions = (apt) => {
        const st = appointmentStatusValue(apt.status);
        const isCancelled = st === 'cancelled';
        const isPending = st === 'pending';
        const isConfirmed = st === 'confirmed';

        return (
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-outline-variant/25">
                {isPending && (
                    <button
                        type="button"
                        onClick={() => handleConfirm(apt)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-950 ring-1 ring-emerald-200/90"
                    >
                        <Icon name="check_circle" size="text-sm" /> Confirm
                    </button>
                )}
                {(isPending || isConfirmed) && (
                    <button
                        type="button"
                        onClick={() => openCancelModal(apt)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-950 ring-1 ring-red-200/90"
                    >
                        <Icon name="cancel" size="text-sm" /> Cancel
                    </button>
                )}
                {!isCancelled && (
                    <button
                        type="button"
                        onClick={() => setReschedulingApt(apt)}
                        className="inline-flex items-center justify-center rounded-xl bg-surface-container-high p-2 text-on-surface"
                        title="Reschedule"
                    >
                        <Icon name="edit_calendar" size="text-base" />
                    </button>
                )}
            </div>
        );
    };

    return (
        <EmployeeLayout>
            <Head title="Appointments" />

            <PageHeader
                title="Appointments"
                description="View and manage your bookings. Filter by date range, service, status, or client name."
            >
                {canAppointments ? (
                    <Link
                        href={route('employee.appointments.calendar', {}, false)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-on-surface hover:bg-slate-50"
                    >
                        <Icon name="calendar_view_week" size="text-lg" />
                        Calendar
                    </Link>
                ) : null}
                <ExportDropdown
                    excelUrl={buildExportUrl('employee.appointments.export')}
                    pdfUrl={buildExportUrl('employee.appointments.export-pdf')}
                />
            </PageHeader>

            <div className="mb-6 rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-slate-100 shadow-sm">
                <div className="flex flex-wrap gap-3 items-end">
                    <DatePicker
                        label="From"
                        value={localFilters.date_from}
                        onChange={(value) => {
                            if (!value) return;
                            const nextTo = localFilters.date_to >= value ? localFilters.date_to : value;
                            patchFilters({ date_from: value, date_to: nextTo });
                        }}
                        placeholder="Start date"
                    />
                    <DatePicker
                        label="To"
                        value={localFilters.date_to}
                        onChange={(value) => {
                            if (!value) return;
                            if (value < localFilters.date_from) {
                                patchFilters({ date_to: localFilters.date_from });
                            } else {
                                patchFilters({ date_to: value });
                            }
                        }}
                        placeholder="End date"
                    />
                    <FilterListbox
                        label="Service"
                        value={localFilters.service_id}
                        onChange={(v) => patchFilters({ service_id: v })}
                        options={serviceOptions}
                        wrapperClassName="flex w-full shrink-0 flex-col gap-1.5 min-w-[190px] max-w-full sm:w-[220px]"
                    />
                    <FilterStatusMulti
                        label="Status"
                        value={localFilters.status}
                        onChange={(v) => patchFilters({ status: v })}
                        options={statusOptions}
                        minWidthClass="min-w-[200px] max-w-full sm:w-[220px]"
                    />
                    <div className="flex w-full min-w-[min(100%,220px)] max-w-md shrink-0 flex-col gap-1.5 sm:flex-1 sm:min-w-[200px]">
                        <label htmlFor="employee-appointments-client-search" className="ml-1 text-[10px] font-bold uppercase tracking-widest text-outline">
                            Client
                        </label>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                                <Icon name="search" size="text-base" />
                            </span>
                            <input
                                id="employee-appointments-client-search"
                                type="search"
                                value={clientSearchDraft}
                                autoComplete="off"
                                placeholder="Search by name…"
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setClientSearchDraft(v);
                                    clientSearchDraftRef.current = v;
                                    if (searchDebounceRef.current) {
                                        clearTimeout(searchDebounceRef.current);
                                    }
                                    searchDebounceRef.current = setTimeout(() => {
                                        searchDebounceRef.current = null;
                                        const next = clientSearchDraftRef.current.trim();
                                        setLocalFilters((cur) => {
                                            const updated = { ...cur, search: next };
                                            router.get(buildEmployeeAppointmentsUrl(updated), {}, visitOpts);
                                            return updated;
                                        });
                                    }, 400);
                                }}
                                className="min-h-[2.75rem] w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-on-surface placeholder:text-outline shadow-none transition-colors focus:border-on-surface/20 focus:outline-none focus:ring-2 focus:ring-on-surface/10"
                            />
                        </div>
                    </div>
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
                    <h3 className="font-headline font-bold text-base text-on-surface">My bookings</h3>
                    <p className="text-xs text-on-surface-variant">
                        {totalCount} appointment{totalCount !== 1 ? 's' : ''} · {rangeLabel}
                    </p>
                </div>

                {rows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                        <Icon name="event_busy" size="text-5xl" className="text-outline mb-3" />
                        <p className="text-sm text-on-surface-variant">No appointments match the selected filters.</p>
                    </div>
                ) : (
                    <>
                        {employee_compact_mobile_appointments ? (
                            <div className="md:hidden space-y-3 p-4 bg-white border-b border-slate-50">
                                {rows.map((apt) => {
                                    const isCancelled = appointmentStatusValue(apt.status) === 'cancelled';
                                    return (
                                        <article
                                            key={apt.id}
                                            className={`rounded-2xl border border-outline-variant/35 p-4 shadow-sm ${
                                                isCancelled ? 'bg-error-container/15' : 'bg-surface-container-low/50'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    {isRange ? (
                                                        <p className="text-xs font-semibold text-on-surface-variant mb-1">
                                                            {formatAppointmentDate(apt.date, {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })}
                                                        </p>
                                                    ) : null}
                                                    <p className="font-bold text-on-surface leading-snug">
                                                        {apt.client_first_name} {apt.client_last_name}
                                                    </p>
                                                    <p className="text-sm text-on-surface-variant mt-0.5">
                                                        {apt.service?.name ?? 'Appointment'}
                                                    </p>
                                                </div>
                                                <AppointmentStatusBadge status={apt.status} />
                                            </div>
                                            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface">
                                                    <Icon name="schedule" size="text-sm" className="text-on-surface-variant" />
                                                    {formatTimeHm(apt.start_time)} – {formatTimeHm(apt.end_time)}
                                                </span>
                                                <span className="text-xs text-on-surface-variant">
                                                    {formatPrice(apt.price, currencySymbol)}
                                                </span>
                                            </div>
                                            <div className="mt-2 text-sm text-on-surface-variant break-words">
                                                {apt.client_email || apt.client_phone || '—'}
                                            </div>
                                            {renderMobileActions(apt)}
                                        </article>
                                    );
                                })}
                            </div>
                        ) : null}

                        <div
                            className={`overflow-x-auto px-4 sm:px-6 md:px-8${
                                employee_compact_mobile_appointments ? ' hidden md:block' : ''
                            }`}
                        >
                            <table className="w-full min-w-[800px] text-left">
                                <thead>
                                    <tr className="border-b border-surface-container-highest">
                                        <th className="pb-5 pr-3 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant min-w-0 w-[14%]">
                                            Client
                                        </th>
                                        <th className="pb-5 pr-3 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant min-w-0 w-[11%]">
                                            Service
                                        </th>
                                        <th className="pb-5 pr-3 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant whitespace-nowrap w-[9%]">
                                            Date
                                        </th>
                                        <th className="pb-5 pr-3 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant whitespace-nowrap w-[9%]">
                                            Time
                                        </th>
                                        <th className="pb-5 pr-3 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant text-right whitespace-nowrap w-[8%]">
                                            Price
                                        </th>
                                        <th className="pb-5 pl-6 pr-3 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant min-w-[7.5rem] w-[10%]">
                                            Status
                                        </th>
                                        <th className="pb-5 pr-3 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant min-w-0 w-[14%]">
                                            Contact
                                        </th>
                                        <th className="pb-5 pr-3 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant text-center min-w-0 w-[18%]">
                                            Approval
                                        </th>
                                        <th className="pb-5 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant text-center w-14 min-w-[3.5rem]">
                                            Edit
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-container-low">
                                    {rows.map((apt) => {
                                        const st = appointmentStatusValue(apt.status);
                                        const rowCancelled = st === 'cancelled';
                                        const isPending = st === 'pending';
                                        const isConfirmed = st === 'confirmed';
                                        return (
                                            <tr
                                                key={apt.id}
                                                className={`transition-colors align-middle ${
                                                    rowCancelled
                                                        ? 'bg-error-container/15'
                                                        : 'hover:bg-surface-container-low/50'
                                                }`}
                                            >
                                                <td className="py-4 pr-3 min-w-0">
                                                    <p className="font-bold text-on-surface truncate">
                                                        {apt.client_first_name} {apt.client_last_name}
                                                    </p>
                                                    {apt.client_notes ? (
                                                        <p className="mt-0.5 text-xs text-on-surface-variant italic line-clamp-1">
                                                            &ldquo;{apt.client_notes}&rdquo;
                                                        </p>
                                                    ) : null}
                                                </td>
                                                <td className="py-4 pr-3 min-w-0">
                                                    <span className="block truncate text-sm text-on-surface-variant">
                                                        {apt.service?.name ?? 'Appointment'}
                                                    </span>
                                                </td>
                                                <td className="py-4 pr-3 whitespace-nowrap">
                                                    <p className="text-on-surface text-sm font-semibold">
                                                        {formatAppointmentDate(apt.date, {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </p>
                                                </td>
                                                <td className="py-4 pr-3 whitespace-nowrap">
                                                    <p className="text-on-surface text-sm font-semibold tabular-nums">
                                                        {formatTimeHm(apt.start_time)} – {formatTimeHm(apt.end_time)}
                                                    </p>
                                                </td>
                                                <td className="py-4 pr-3 text-right whitespace-nowrap">
                                                    <span className="text-sm font-semibold text-on-surface tabular-nums">
                                                        {formatPrice(apt.price, currencySymbol)}
                                                    </span>
                                                </td>
                                                <td className="py-4 pl-6 pr-3">
                                                    <AppointmentStatusBadge status={apt.status} />
                                                </td>
                                                <td className="py-4 pr-3 min-w-0">
                                                    <span className="block truncate text-sm text-on-surface-variant" title={apt.client_email || apt.client_phone || undefined}>
                                                        {apt.client_email || apt.client_phone || '—'}
                                                    </span>
                                                </td>
                                                <td className="py-4 pr-3 text-center min-w-0">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {isPending && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleConfirm(apt)}
                                                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-950 ring-1 ring-emerald-200/90 hover:bg-emerald-100/90 transition-colors"
                                                            >
                                                                <Icon name="check_circle" size="text-sm" />
                                                                Confirm
                                                            </button>
                                                        )}
                                                        {(isPending || isConfirmed) && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openCancelModal(apt)}
                                                                className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-bold text-red-950 ring-1 ring-red-200/90 hover:bg-red-100/90 transition-colors"
                                                            >
                                                                <Icon name="cancel" size="text-sm" />
                                                                Cancel
                                                            </button>
                                                        )}
                                                        {rowCancelled && (
                                                            <span className="text-xs text-on-surface-variant/60">—</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 pr-0 text-center w-14 min-w-[3.5rem]">
                                                    {!rowCancelled ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setReschedulingApt(apt)}
                                                            className="inline-flex items-center justify-center rounded-xl bg-surface-container-high p-2 text-on-surface hover:bg-surface-container-highest transition-colors"
                                                            title="Reschedule"
                                                        >
                                                            <Icon name="edit_calendar" size="text-base" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-on-surface-variant/60">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
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
                                        Showing <span className="font-bold text-on-surface">{rows.length}</span>{' '}
                                        appointment
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

            {reschedulingApt && (
                <EmployeeRescheduleModal appointment={reschedulingApt} onClose={() => setReschedulingApt(null)} />
            )}

            {cancellingApt && (
                <CancelConfirmModal appointment={cancellingApt} onConfirm={confirmCancel} onClose={closeCancelModal} />
            )}
        </EmployeeLayout>
    );
}
