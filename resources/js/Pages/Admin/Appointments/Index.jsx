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
import { useT } from '@/i18n/useT';
import { appointmentStatusValue, formatAppointmentDate, formatTimeHm } from '@/utils/appointmentDate';
import {
    appendAppointmentStatusParams,
    DEFAULT_APPOINTMENT_STATUS_FILTER,
    normalizeAppointmentStatusFilter,
} from '@/utils/appointmentStatusFilter';

function DeleteConfirmModal({ appointment, onConfirm, onCancel }) {
    const t = useT();
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-red-100">
                        <Icon name="delete" size="text-xl" className="text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-extrabold text-on-surface">{t('admin.appointments.delete_title')}</h2>
                        <p className="mt-1 text-sm text-on-surface-variant">
                            {t('admin.appointments.delete_prompt', {
                                name: `${appointment.client_first_name} ${appointment.client_last_name}`,
                                date: appointment.date ? String(appointment.date).slice(0, 10) : '',
                                time: appointment.start_time ? appointment.start_time.slice(0, 5) : '',
                            })}
                        </p>
                    </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-slate-50 transition-colors"
                    >
                        {t('common.actions.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors"
                    >
                        {t('admin.appointments.delete_confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
}

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
    const sid = filters.service_id;
    if (sid != null && sid !== '' && sid !== SERVICE_FILTER_ALL) {
        params.set('service_id', String(sid));
    }
    return params;
}

function buildAppointmentsUrl(filters) {
    const params = appointmentsFiltersToSearchParams(filters);
    const queryString = params.toString();
    const pathname = getRoutePathname('admin.appointments.index');
    return pathname + (queryString ? `?${queryString}` : '');
}

function normalizeServiceFilterForState(serviceIdFromServer) {
    if (serviceIdFromServer == null || serviceIdFromServer === '') {
        return SERVICE_FILTER_ALL;
    }
    return String(serviceIdFromServer);
}

function normalizeAppointments(appointments) {
    if (!appointments) return { rows: [], meta: null };
    if (Array.isArray(appointments)) return { rows: appointments, meta: null };
    if (Array.isArray(appointments.data)) return { rows: appointments.data, meta: appointments };
    return { rows: [], meta: null };
}

function ExportDropdown({ excelUrl, pdfUrl }) {
    const t = useT();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    return (
        <div ref={ref} className="relative w-full shrink-0 sm:w-auto">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-on-surface px-6 py-3 text-sm font-bold text-surface transition-opacity hover:opacity-90 sm:w-auto"
            >
                <Icon name="download" size="text-lg" />
                {t('common.actions.export')}
                <span className="ml-1 text-xs opacity-70">▾</span>
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white shadow-lg ring-1 ring-black/10 z-50 overflow-hidden">
                    <a
                        href={excelUrl}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        <Icon name="table_chart" size="text-base" /> {t('admin.appointments.export_excel')}
                    </a>
                    <a
                        href={pdfUrl}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        <Icon name="picture_as_pdf" size="text-base" /> {t('admin.appointments.export_pdf')}
                    </a>
                </div>
            )}
        </div>
    );
}

export default function Index({
    appointments,
    employees,
    services = [],
    filters = {},
    admin_compact_mobile_appointments = false,
}) {
    const t = useT();
    const page = usePage();
    const { auth } = page.props;
    const inertiaUrl = typeof page.url === 'string' ? page.url : `${window.location.pathname}${window.location.search}`;
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
        service_id: normalizeServiceFilterForState(filters.service_id),
    });

    useEffect(() => {
        setLocalFilters({
            employee_id: filters.employee_id != null && filters.employee_id !== '' ? String(filters.employee_id) : '',
            date_from: filters.date_from ?? currentMonthStart(),
            date_to: filters.date_to ?? currentMonthEnd(),
            status: normalizeAppointmentStatusFilter(filters.status),
            service_id: normalizeServiceFilterForState(filters.service_id),
        });
    }, [filters.employee_id, filters.date_from, filters.date_to, filters.service_id, statusFilterKey]);

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
            service_id: SERVICE_FILTER_ALL,
        };
        setLocalFilters(defaultFilters);
        router.get(buildAppointmentsUrl(defaultFilters), {}, visitOpts);
    };

    const [editingAppointment, setEditingAppointment]   = useState(null);
    const [deletingAppointment, setDeletingAppointment] = useState(null);
    const openedFromEditQueryRef = useRef(null);

    useEffect(() => {
        let u;
        try {
            u = new URL(inertiaUrl, window.location.origin);
        } catch {
            return;
        }
        const editRaw = u.searchParams.get('edit');
        if (!editRaw) {
            openedFromEditQueryRef.current = null;
            return;
        }
        const id = parseInt(editRaw, 10);
        if (Number.isNaN(id)) {
            return;
        }
        const found = rows.find((r) => Number(r.id) === id);
        if (!found) {
            return;
        }
        const dedupeKey = `${inertiaUrl}|${id}`;
        if (openedFromEditQueryRef.current === dedupeKey) {
            return;
        }
        openedFromEditQueryRef.current = dedupeKey;
        setEditingAppointment(found);
        u.searchParams.delete('edit');
        const qs = u.searchParams.toString();
        const clean = `${u.pathname}${qs ? `?${qs}` : ''}`;
        window.history.replaceState(window.history.state, '', clean);
    }, [inertiaUrl, rows]);

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
            { value: '', label: t('admin.appointments.all_staff') },
            ...employees.map((e) => ({ value: String(e.id), label: e.name })),
        ],
        [employees, t],
    );

    const statusOptions = useMemo(
        () =>
            APPOINTMENT_STATUSES.map((status) => ({
                value: status,
                label: t(`common.status.${status}`),
            })),
        [t],
    );

    const serviceOptions = useMemo(
        () => [
            { value: SERVICE_FILTER_ALL, label: t('admin.appointments.all_services') },
            ...services.map((s) => ({ value: String(s.id), label: s.name })),
        ],
        [services, t],
    );

    return (
        <AdminLayout>
            <Head title={t('admin.appointments.head_title')} />

            <PageHeader
                title={t('admin.appointments.title')}
                description={t('admin.appointments.description')}
            >
                <Link
                    href={route('admin.appointments.calendar')}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-slate-50 sm:w-auto"
                >
                    <Icon name="calendar_view_week" size="text-lg" />
                    {t('admin.appointments.calendar')}
                </Link>
                <ExportDropdown
                    excelUrl={buildExportUrl('admin.appointments.export')}
                    pdfUrl={buildExportUrl('admin.appointments.export-pdf')}
                />
            </PageHeader>

            <div className="mb-6 rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-slate-100 shadow-sm">
                <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:flex-nowrap lg:items-end lg:gap-3 lg:w-full">
                    <FilterListbox
                        label={t('admin.appointments.employee')}
                        value={localFilters.employee_id}
                        onChange={(v) => patchFilters({ employee_id: v })}
                        options={employeeOptions}
                        minWidthClass="min-w-0"
                        wrapperClassName="flex w-full min-w-0 flex-col gap-1.5 lg:flex-1"
                    />
                    <FilterListbox
                        label={t('admin.appointments.service')}
                        value={localFilters.service_id}
                        onChange={(v) => patchFilters({ service_id: v })}
                        options={serviceOptions}
                        minWidthClass="min-w-0"
                        wrapperClassName="flex w-full min-w-0 flex-col gap-1.5 lg:flex-1"
                    />
                    <DatePicker
                        className="w-full min-w-0 lg:flex-1 lg:min-w-0"
                        label={t('admin.appointments.from')}
                        value={localFilters.date_from}
                        onChange={(value) => patchFilters({ date_from: value })}
                        placeholder={t('admin.appointments.start_date_ph')}
                        buttonClassName="max-lg:!min-w-0"
                    />
                    <DatePicker
                        className="w-full min-w-0 lg:flex-1 lg:min-w-0"
                        label={t('admin.appointments.to')}
                        value={localFilters.date_to}
                        onChange={(value) => patchFilters({ date_to: value })}
                        placeholder={t('admin.appointments.end_date_ph')}
                        buttonClassName="max-lg:!min-w-0"
                    />
                    <FilterStatusMulti
                        label={t('admin.appointments.status')}
                        value={localFilters.status}
                        onChange={(v) => patchFilters({ status: v })}
                        options={statusOptions}
                        minWidthClass="w-full min-w-0"
                        className="lg:flex-1 lg:min-w-0"
                    />
                    <div className="flex w-full shrink-0 items-end justify-stretch lg:w-auto lg:flex-none">
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="w-full max-lg:min-h-[2.75rem] rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-slate-50 lg:w-auto"
                        >
                            {t('admin.appointments.clear')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="min-w-0 bg-surface-container-lowest overflow-hidden rounded-2xl ring-1 ring-slate-100 shadow-sm">
                <div className="flex flex-col gap-2 border-b border-slate-50 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 md:px-8">
                    <h3 className="font-headline text-base font-bold text-on-surface">{t('admin.appointments.all_bookings')}</h3>
                    <p className="text-xs text-on-surface-variant">
                        {totalCount === 1
                            ? t('admin.appointments.appointment_total_one', { count: totalCount })
                            : t('admin.appointments.appointment_total_other', { count: totalCount })}
                    </p>
                </div>

                {rows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
                        <Icon name="event_busy" size="text-5xl" className="text-outline mb-3" />
                        <p className="text-sm text-on-surface-variant">{t('admin.appointments.empty')}</p>
                    </div>
                ) : (
                    <>
                        {admin_compact_mobile_appointments ? (
                            <div className="space-y-3 border-b border-slate-50 bg-white p-4 md:hidden">
                                {rows.map((apt) => {
                                    const st = appointmentStatusValue(apt.status);
                                    const rowCancelled = st === 'cancelled';
                                    return (
                                        <article
                                            key={apt.id}
                                            className={`rounded-2xl border border-outline-variant/35 p-4 shadow-sm ${
                                                rowCancelled ? 'bg-error-container/15' : 'bg-surface-container-low/50'
                                            }`}
                                        >
                                            <div className="min-w-0">
                                                <p className="font-headline text-sm font-bold leading-snug text-on-surface">
                                                    {apt.employee?.name ?? '—'}
                                                </p>

                                                <dl className="mt-3 space-y-2 text-xs">
                                                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest/70 px-3 py-2">
                                                        <dt className="text-[10px] font-bold uppercase tracking-wider text-outline">
                                                            {t('admin.appointments.service')}
                                                        </dt>
                                                        <dd className="mt-1 flex items-baseline justify-between gap-2">
                                                            <span className="min-w-0 truncate text-sm text-on-surface-variant">
                                                                {apt.service?.name || '—'}
                                                            </span>
                                                            <span className="shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums text-on-surface">
                                                                {Number(apt.price).toFixed(2)}
                                                                {'\u00a0'}
                                                                {currencySymbol}
                                                            </span>
                                                        </dd>
                                                    </div>

                                                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest/70 px-3 py-2">
                                                        <dt className="text-[10px] font-bold uppercase tracking-wider text-outline">
                                                            {t('admin.dashboard.th_date')} & {t('admin.dashboard.th_time')}
                                                        </dt>
                                                        <dd className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-on-surface-variant">
                                                            <span>
                                                                {formatAppointmentDate(apt.date, {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                })}
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 font-semibold text-on-surface">
                                                                <Icon name="schedule" size="text-sm" className="text-on-surface-variant" />
                                                                {formatTimeHm(apt.start_time)} - {formatTimeHm(apt.end_time)}
                                                            </span>
                                                        </dd>
                                                    </div>

                                                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest/70 px-3 py-2">
                                                        <dt className="text-[10px] font-bold uppercase tracking-wider text-outline">
                                                            {t('admin.appointments.th_client')}
                                                        </dt>
                                                        <dd className="mt-1">
                                                            <p className="text-sm font-semibold text-on-surface">
                                                                {apt.client_first_name} {apt.client_last_name}
                                                            </p>
                                                            <p className="mt-0.5 break-words text-xs text-on-surface-variant">
                                                                {apt.client_email || apt.client_phone || '—'}
                                                            </p>
                                                        </dd>
                                                    </div>
                                                </dl>
                                            </div>
                                            <div className="mt-3 w-full min-w-0 max-w-full">
                                                <AppointmentStatusMenu
                                                    layout="block"
                                                    status={apt.status}
                                                    onChange={(s) => updateStatus(apt, s)}
                                                />
                                            </div>
                                            <div className="mt-3 mx-auto w-full max-w-[19rem] border-t border-outline-variant/25 pt-3">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingAppointment(apt)}
                                                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-surface-container-high px-3 py-2.5 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container-highest sm:text-sm"
                                                    >
                                                        <Icon name="edit" size="text-lg" className="shrink-0" />
                                                        <span className="truncate">{t('admin.appointments.edit')}</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingAppointment(apt)}
                                                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-950 transition-colors hover:bg-red-100/90 sm:text-sm"
                                                    >
                                                        <Icon name="delete" size="text-lg" className="shrink-0" />
                                                        <span className="truncate">{t('admin.appointments.delete')}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        ) : null}

                        <div
                            className={`overflow-x-auto px-4 sm:px-6 md:px-8 ${
                                admin_compact_mobile_appointments ? 'hidden md:block' : ''
                            }`}
                        >
                            <table className="w-full min-w-[760px] border-collapse text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-outline sm:px-6 lg:px-8">
                                            {t('admin.appointments.th_client')}
                                        </th>
                                        <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-outline sm:px-6 lg:px-8">
                                            {t('admin.appointments.th_employee')}
                                        </th>
                                        <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-outline sm:px-6 lg:px-8">
                                            {t('admin.appointments.th_service')}
                                        </th>
                                        <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-outline sm:px-6 lg:px-8">
                                            {t('admin.appointments.th_datetime')}
                                        </th>
                                        <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-outline sm:px-6 lg:px-8">
                                            {t('admin.appointments.th_status')}
                                        </th>
                                        <th className="min-w-[5.5rem] whitespace-nowrap px-4 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-outline sm:px-6 lg:px-8">
                                            {t('admin.appointments.th_price')}
                                        </th>
                                        <th className="px-4 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-outline sm:px-6 lg:px-8">
                                            {t('admin.appointments.th_actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {rows.map((apt) => (
                                        <tr key={apt.id} className="transition-colors hover:bg-slate-50/50">
                                            <td className="px-4 py-5 sm:px-6 lg:px-8">
                                                <p className="font-headline text-sm font-bold text-on-surface">
                                                    {apt.client_first_name} {apt.client_last_name}
                                                </p>
                                                <p className="text-xs text-on-surface-variant">{apt.client_email || apt.client_phone || '—'}</p>
                                            </td>
                                            <td className="px-4 py-5 text-sm text-on-surface-variant sm:px-6 lg:px-8">{apt.employee?.name ?? '—'}</td>
                                            <td className="px-4 py-5 text-sm text-on-surface-variant sm:px-6 lg:px-8">{apt.service?.name || '—'}</td>
                                            <td className="px-4 py-5 sm:px-6 lg:px-8">
                                                <p className="text-sm font-semibold text-on-surface">
                                                    {formatAppointmentDate(apt.date, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                                <p className="text-xs text-on-surface-variant">
                                                    {formatTimeHm(apt.start_time)} – {formatTimeHm(apt.end_time)}
                                                </p>
                                            </td>
                                            <td className="px-4 py-5 align-middle sm:px-6 lg:px-8">
                                                <AppointmentStatusMenu status={apt.status} onChange={(s) => updateStatus(apt, s)} />
                                            </td>
                                            <td className="min-w-[5.5rem] whitespace-nowrap px-4 py-5 text-right text-sm font-bold tabular-nums text-on-surface sm:px-6 lg:px-8">
                                                {Number(apt.price).toFixed(2)}
                                                {'\u00a0'}
                                                {currencySymbol}
                                            </td>
                                            <td className="px-4 py-5 text-right sm:px-6 lg:px-8">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingAppointment(apt)}
                                                        className="inline-flex rounded-lg p-2 text-outline transition-colors hover:bg-surface-container hover:text-on-surface"
                                                        title={t('admin.appointments.edit')}
                                                    >
                                                        <Icon name="edit" size="text-[18px]" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingAppointment(apt)}
                                                        className="inline-flex rounded-lg p-2 text-outline transition-colors hover:bg-error-container hover:text-error"
                                                        title={t('admin.appointments.delete')}
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

                        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-50 bg-slate-50/30 px-4 py-4 sm:flex-row sm:px-6 md:px-8">
                            <p className="text-sm text-on-surface-variant">
                                {meta ? (
                                    <>
                                        {t('admin.appointments.showing_range', {
                                            from: meta.from,
                                            to: meta.to,
                                            total: meta.total,
                                        })}
                                    </>
                                ) : (
                                    <>
                                        {rows.length === 1
                                            ? t('admin.appointments.showing_count_one', { count: rows.length })
                                            : t('admin.appointments.showing_count_other', { count: rows.length })}
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
                                        {t('admin.appointments.previous')}
                                    </button>
                                    <span className="text-sm text-on-surface-variant px-2">
                                        {t('admin.appointments.page_of', { current: meta.current_page, last: meta.last_page })}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={!meta.next_page_url}
                                        onClick={() => navigateToPage(meta.next_page_url)}
                                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white"
                                    >
                                        {t('admin.appointments.next')}
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
