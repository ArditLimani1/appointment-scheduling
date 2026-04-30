import { Head, Link, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import PageHeader from '@/Components/PageHeader';
import Icon from '@/Components/Icon';
import FilterListbox from '@/Components/FilterListbox';
import FilterStatusMulti from '@/Components/FilterStatusMulti';
import DatePicker from '@/Components/DatePicker';
import EditAppointmentModal from '@/Components/EditAppointmentModal';
import CalendarWeekGrid from '@/Components/Calendar/CalendarWeekGrid';
import { buildEmployeeColorMap, getEmployeeSlotStyles } from '@/utils/employeeCalendarColor';
import { buildAdminAppointmentPutPayload, buildEmployeeAppointmentPutPayload } from '@/utils/appointmentPutPayload';
import { formatAppointmentDate, patchSqMonthName } from '@/utils/appointmentDate';
import {
    appendAppointmentStatusParams,
    DEFAULT_APPOINTMENT_STATUS_FILTER,
    normalizeAppointmentStatusFilter,
} from '@/utils/appointmentStatusFilter';
import { shiftCalendarAnchor, todayYmd } from '@/utils/calendarNavigation';
import { useT } from '@/i18n/useT';

const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'cancelled'];

/** Headless UI Listbox can mis-handle empty-string values; use a sentinel for “all services”. */
const SERVICE_FILTER_ALL = 'all';

function parseYmd(ymd) {
    const [y, m, d] = String(ymd).split('-').map(Number);
    return new Date(y, m - 1, d);
}

function getRoutePathname(routeName) {
    return new URL(route(routeName), window.location.href).pathname;
}

function normalizeServiceFilterForState(serviceIdFromServer) {
    if (serviceIdFromServer == null || serviceIdFromServer === '') {
        return SERVICE_FILTER_ALL;
    }
    return String(serviceIdFromServer);
}

function buildCalendarUrl(employeeCalendar, date, view, filters) {
    const params = new URLSearchParams();
    params.set('date', date);
    params.set('view', view);
    if (!employeeCalendar && filters.employee_id) {
        params.set('employee_id', String(filters.employee_id));
    }
    appendAppointmentStatusParams(params, filters.status);
    const sid = filters.service_id;
    if (sid != null && sid !== '' && sid !== SERVICE_FILTER_ALL) {
        params.set('service_id', String(sid));
    }
    const qs = params.toString();
    const routeName = employeeCalendar ? 'employee.appointments.calendar' : 'admin.appointments.calendar';
    const path = getRoutePathname(routeName);
    return path + (qs ? `?${qs}` : '');
}

function formatRangeTitle(rangeStart, rangeEnd, view, localeBcp47) {
    const a = parseYmd(rangeStart);
    const isSq = String(localeBcp47 || '').toLowerCase().startsWith('sq');
    const monthStyle = isSq ? 'long' : 'short';
    if (view === 'day') {
        let result = a.toLocaleDateString(localeBcp47 || undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        if (isSq) result = patchSqMonthName(result, a, 'long');
        return result;
    }
    return `${formatAppointmentDate(rangeStart, { day: 'numeric', month: monthStyle }, localeBcp47)} – ${formatAppointmentDate(rangeEnd, {
        day: 'numeric',
        month: monthStyle,
        year: 'numeric',
    }, localeBcp47)}`;
}

function formatRangeSubtitle(rangeStart, rangeEnd, view, localeBcp47) {
    const monthStyle = String(localeBcp47 || '').toLowerCase().startsWith('sq') ? 'long' : 'short';
    if (view === 'day') {
        return formatAppointmentDate(rangeStart, { weekday: 'short', month: monthStyle, day: 'numeric', year: 'numeric' }, localeBcp47);
    }
    return `${formatAppointmentDate(rangeStart, { day: 'numeric', month: monthStyle }, localeBcp47)} – ${formatAppointmentDate(rangeEnd, {
        day: 'numeric',
        month: monthStyle,
        year: 'numeric',
    }, localeBcp47)}`;
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
        <div ref={ref} className="relative shrink-0">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-on-surface px-6 py-3 text-sm font-bold text-surface transition-opacity hover:opacity-90"
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

export default function Calendar({
    appointments = [],
    employees = [],
    services = [],
    range_start,
    range_end,
    column_dates = [],
    calendar_view = 'week',
    filters: filtersProp = {},
    employee_calendar: employeeCalendar = false,
    calendar_hours: calendarHours = null,
    slot_duration: slotDuration = 30,
    calendar_day_breaks: calendarDayBreaks = {},
    calendar_day_offs: calendarDayOffs = [],
    /** Per employee id (string keys): breaks per date — used while dragging so overlays match that staff member, not merged lunches. */
    calendar_employee_day_breaks: calendarEmployeeDayBreaks = {},
    calendar_employee_day_offs: calendarEmployeeDayOffs = {},
}) {
    const t = useT();
    const { localeBcp47 } = usePage().props;
    const [selected, setSelected] = useState(null);
    const [dragSavingId, setDragSavingId] = useState(null);
    const [moveError, setMoveError] = useState(null);

    const statusFilterKey = Array.isArray(filtersProp.status)
        ? [...filtersProp.status].sort().join('|')
        : String(filtersProp.status ?? '');

    const normalizedFilters = useMemo(
        () => ({
            employee_id: filtersProp.employee_id != null && filtersProp.employee_id !== '' ? String(filtersProp.employee_id) : '',
            status: normalizeAppointmentStatusFilter(filtersProp.status),
            service_id: normalizeServiceFilterForState(filtersProp.service_id),
            view: filtersProp.view === 'day' || filtersProp.view === 'week' ? filtersProp.view : calendar_view === 'day' ? 'day' : 'week',
            date:
                filtersProp.date != null && String(filtersProp.date).match(/^\d{4}-\d{2}-\d{2}$/)
                    ? String(filtersProp.date).slice(0, 10)
                    : range_start,
        }),
        [filtersProp.employee_id, filtersProp.service_id, statusFilterKey, filtersProp.view, filtersProp.date, calendar_view, range_start],
    );

    const [localFilters, setLocalFilters] = useState(normalizedFilters);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    useEffect(() => {
        setLocalFilters(normalizedFilters);
    }, [normalizedFilters]);

    const visitOpts = useMemo(
        () => ({
            preserveState: true,
            preserveScroll: true,
            replace: true,
        }),
        [],
    );

    const navigate = useCallback(
        (date, view) => {
            router.get(buildCalendarUrl(employeeCalendar, date, view, localFilters), {}, visitOpts);
        },
        [employeeCalendar, localFilters, visitOpts],
    );

    const patchFilters = useCallback(
        (patch) => {
            const next = { ...localFilters, ...patch };
            if (employeeCalendar) {
                next.employee_id =
                    filtersProp.employee_id != null && filtersProp.employee_id !== ''
                        ? String(filtersProp.employee_id)
                        : next.employee_id;
            }
            if (!next.date || !String(next.date).match(/^\d{4}-\d{2}-\d{2}$/)) {
                next.date = todayYmd();
            }
            setLocalFilters(next);
            router.get(buildCalendarUrl(employeeCalendar, next.date, next.view, next), {}, visitOpts);
        },
        [employeeCalendar, filtersProp.employee_id, localFilters, visitOpts],
    );

    const clearFilters = useCallback(() => {
        const next = {
            employee_id: employeeCalendar ? localFilters.employee_id : '',
            status: [...DEFAULT_APPOINTMENT_STATUS_FILTER],
            service_id: SERVICE_FILTER_ALL,
            date: todayYmd(),
            view: localFilters.view,
        };
        setLocalFilters(next);
        router.get(buildCalendarUrl(employeeCalendar, next.date, next.view, next), {}, visitOpts);
    }, [employeeCalendar, localFilters.employee_id, localFilters.view, visitOpts]);

    const goPrev = useCallback(() => {
        const next = shiftCalendarAnchor(localFilters.date, localFilters.view, -1);
        navigate(next, localFilters.view);
    }, [localFilters.date, localFilters.view, navigate]);

    const goNext = useCallback(() => {
        const next = shiftCalendarAnchor(localFilters.date, localFilters.view, 1);
        navigate(next, localFilters.view);
    }, [localFilters.date, localFilters.view, navigate]);

    const goToday = useCallback(() => {
        navigate(todayYmd(), localFilters.view);
    }, [localFilters.view, navigate]);

    const onAppointmentMove = useCallback(
        (apt, { date, start_time }) => {
            setMoveError(null);
            setDragSavingId(apt.id);
            const url = employeeCalendar
                ? route('employee.appointments.edit', apt.id)
                : route('admin.appointments.edit', apt.id);
            const body = employeeCalendar
                ? buildEmployeeAppointmentPutPayload(apt, { date, start_time })
                : buildAdminAppointmentPutPayload(apt, { date, start_time });
            router.put(url, body, {
                preserveScroll: true,
                onError: (errs) => {
                    setDragSavingId(null);
                    const first = errs.start_time || errs.date || Object.values(errs)[0];
                    setMoveError(typeof first === 'string' ? first : t('admin.calendar.move_error'));
                },
                onFinish: () => setDragSavingId(null),
            });
        },
        [employeeCalendar, t],
    );

    const employeeOptions = useMemo(
        () => [{ value: '', label: t('admin.appointments.all_staff') }, ...employees.map((e) => ({ value: String(e.id), label: e.name }))],
        [employees, t],
    );
    const viewOptions = useMemo(
        () => [
            { value: 'day', label: t('admin.calendar.day') },
            { value: 'week', label: t('admin.calendar.week') },
        ],
        [t],
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
            { value: SERVICE_FILTER_ALL, label: t('admin.calendar.all_services') },
            ...services.map((s) => ({ value: String(s.id), label: s.name })),
        ],
        [services, t],
    );

    const titleMain = useMemo(
        () => formatRangeTitle(range_start, range_end, localFilters.view, localeBcp47),
        [range_start, range_end, localFilters.view, localeBcp47],
    );

    const titleSub = useMemo(
        () => formatRangeSubtitle(range_start, range_end, localFilters.view, localeBcp47),
        [range_start, range_end, localFilters.view, localeBcp47],
    );

    const employeeColorMap = useMemo(() => buildEmployeeColorMap(employees), [employees]);

    const buildExportUrl = useCallback(
        (routeName) => {
            const params = new URLSearchParams();
            params.set('date_from', range_start);
            params.set('date_to', range_end);
            appendAppointmentStatusParams(params, localFilters.status);
            const sid = localFilters.service_id;
            if (sid != null && sid !== '' && sid !== SERVICE_FILTER_ALL) {
                params.set('service_id', String(sid));
            }
            if (!employeeCalendar && localFilters.employee_id) {
                params.set('employee_id', String(localFilters.employee_id));
            }
            const queryString = params.toString();
            const pathname = getRoutePathname(routeName);
            return pathname + (queryString ? `?${queryString}` : '');
        },
        [range_start, range_end, localFilters.status, localFilters.service_id, localFilters.employee_id, employeeCalendar],
    );

    const selfViewEmployeeId = useMemo(() => {
        if (!employeeCalendar) {
            return null;
        }
        const fromFilter = normalizedFilters.employee_id ? Number(normalizedFilters.employee_id) : null;
        if (fromFilter && Number.isFinite(fromFilter)) {
            return fromFilter;
        }
        if (employees[0]?.id != null) {
            return Number(employees[0].id);
        }
        return null;
    }, [employeeCalendar, normalizedFilters.employee_id, employees]);

    /** Match Employee Appointments Index (xl) vs Admin Appointments Index (lg) filter bar breakpoints. */
    const calendarFilterBarClasses = useMemo(
        () =>
            employeeCalendar
                ? {
                      row: 'mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4 xl:flex-row xl:flex-wrap xl:items-end',
                      employeeWrap: 'flex w-full min-w-0 flex-col gap-1.5 xl:min-w-[180px] xl:flex-1',
                      dateGrow: 'w-full min-w-0 xl:w-auto',
                      dateBtnPad: 'max-xl:!min-w-0',
                      serviceWrap: 'flex w-full min-w-0 shrink-0 flex-col gap-1.5 xl:w-[220px]',
                      statusMin: 'w-full min-w-0 max-w-full xl:min-w-[200px] xl:w-[220px]',
                      clearWrap: 'flex w-full shrink-0 items-end justify-end xl:ml-auto xl:w-auto xl:justify-end',
                      clearBtn:
                          'w-full rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-slate-50 max-xl:min-h-[2.75rem] xl:mr-2 xl:w-auto',
                      navWrap: 'grid w-full grid-cols-[1fr_1.45fr_1fr_1fr] items-center gap-2 xl:hidden',
                      clearControlsWrap: 'hidden xl:flex xl:items-center xl:gap-2',
                  }
                : {
                      row: 'mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4 lg:flex-row lg:flex-wrap lg:items-end',
                      employeeWrap: 'flex w-full min-w-0 flex-col gap-1.5 lg:min-w-[180px] lg:flex-1',
                      dateGrow: 'w-full min-w-0 lg:w-auto',
                      dateBtnPad: 'max-lg:!min-w-0',
                      serviceWrap: 'flex w-full min-w-0 shrink-0 flex-col gap-1.5 lg:w-[220px]',
                      statusMin: 'w-full min-w-0 max-w-full lg:min-w-[200px] lg:w-[220px]',
                      clearWrap: 'flex w-full shrink-0 items-end justify-end lg:ml-auto lg:w-auto lg:justify-end',
                      clearBtn:
                          'w-full rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-slate-50 max-lg:min-h-[2.75rem] lg:mr-2 lg:w-auto',
                      navWrap: 'grid w-full grid-cols-[1fr_1.45fr_1fr_1fr] items-center gap-2 lg:hidden',
                      clearControlsWrap: 'hidden lg:flex lg:items-center lg:gap-2',
                  },
        [employeeCalendar],
    );

    const Layout = employeeCalendar ? EmployeeLayout : AdminLayout;

    return (
        <Layout>
            <Head title={t('admin.calendar.head_title')} />

            <div className="w-full min-w-0 max-w-full">
                {employeeCalendar ? (
                    <PageHeader
                        title={t('admin.appointments.title')}
                        description={t('admin.calendar.employee_description')}
                    >
                        <Link
                            href={`${route('employee.appointments.index', {}, false)}?list=1`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-on-surface hover:bg-slate-50"
                        >
                            <Icon name="view_list" size="text-lg" />
                            {t('admin.calendar.table_view')}
                        </Link>
                        <ExportDropdown
                            excelUrl={buildExportUrl('employee.appointments.export')}
                            pdfUrl={buildExportUrl('employee.appointments.export-pdf')}
                        />
                    </PageHeader>
                ) : (
                    <PageHeader
                        title={t('admin.appointments.title')}
                        description={t('admin.calendar.description')}
                    >
                        <Link
                            href={`${route('admin.appointments.index', {}, false)}?list=1`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-on-surface hover:bg-slate-50"
                        >
                            <Icon name="view_list" size="text-lg" />
                            {t('admin.calendar.table_view')}
                        </Link>
                        <ExportDropdown
                            excelUrl={buildExportUrl('admin.appointments.export')}
                            pdfUrl={buildExportUrl('admin.appointments.export-pdf')}
                        />
                    </PageHeader>
                )}

                <div className="mb-6 rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-slate-100 shadow-sm">
                    <div className={calendarFilterBarClasses.navWrap}>
                        <button
                            type="button"
                            onClick={goPrev}
                            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                            aria-label={t('admin.calendar.previous_period')}
                        >
                            <Icon name="chevron_left" />
                        </button>
                        <div className="flex h-11 w-full items-stretch">
                            <FilterListbox
                                value={localFilters.view}
                                onChange={(v) => patchFilters({ view: v, date: localFilters.date })}
                                options={viewOptions}
                                minWidthClass="w-full min-w-0"
                                compact
                                showLabel={false}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={goNext}
                            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                            aria-label={t('admin.calendar.next_period')}
                        >
                            <Icon name="chevron_right" />
                        </button>
                        <button
                            type="button"
                            onClick={goToday}
                            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                            title={t('admin.calendar.today')}
                            aria-label={t('admin.calendar.today')}
                        >
                            <Icon name="calendar_today" />
                        </button>
                    </div>

                    <div className="mt-3 md:hidden">
                        <button
                            type="button"
                            onClick={() => setShowMobileFilters((v) => !v)}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-slate-50"
                        >
                            <Icon name="tune" size="text-base" />
                            {showMobileFilters ? t('admin.calendar.hide_filters') : t('admin.calendar.show_filters')}
                            <Icon name={showMobileFilters ? 'expand_less' : 'expand_more'} size="text-base" />
                        </button>
                    </div>

                    <div className={`${showMobileFilters ? 'flex' : 'hidden'} md:flex ${calendarFilterBarClasses.row}`}>
                        {!employeeCalendar && (
                            <FilterListbox
                                label={t('admin.calendar.employee')}
                                value={localFilters.employee_id}
                                onChange={(v) => patchFilters({ employee_id: v })}
                                options={employeeOptions}
                                minWidthClass="min-w-0"
                                wrapperClassName={calendarFilterBarClasses.employeeWrap}
                            />
                        )}
                        <DatePicker
                            className={calendarFilterBarClasses.dateGrow}
                            buttonClassName={calendarFilterBarClasses.dateBtnPad}
                            label={t('admin.calendar.date')}
                            value={localFilters.date}
                            onChange={(value) => patchFilters({ date: value || todayYmd() })}
                            placeholder={t('admin.calendar.date_ph')}
                            portal
                        />
                        <FilterListbox
                            label={t('admin.calendar.service')}
                            value={localFilters.service_id}
                            onChange={(v) => patchFilters({ service_id: v })}
                            options={serviceOptions}
                            minWidthClass="min-w-0"
                            wrapperClassName={calendarFilterBarClasses.serviceWrap}
                        />
                        <FilterStatusMulti
                            label={t('admin.calendar.status')}
                            value={localFilters.status}
                            onChange={(v) => patchFilters({ status: v })}
                            options={statusOptions}
                            minWidthClass={calendarFilterBarClasses.statusMin}
                        />
                        <div className={calendarFilterBarClasses.clearWrap}>
                            <button type="button" onClick={clearFilters} className={calendarFilterBarClasses.clearBtn}>
                                {t('admin.calendar.clear')}
                            </button>
                            <div className={calendarFilterBarClasses.clearControlsWrap}>
                                <button
                                    type="button"
                                    onClick={goPrev}
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                                    aria-label={t('admin.calendar.previous_period')}
                                >
                                    <Icon name="chevron_left" />
                                </button>
                                <div className="flex h-11 items-stretch">
                                    <FilterListbox
                                        value={localFilters.view}
                                        onChange={(v) => patchFilters({ view: v, date: localFilters.date })}
                                        options={viewOptions}
                                        minWidthClass="min-w-[104px]"
                                        compact
                                        showLabel={false}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={goNext}
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                                    aria-label={t('admin.calendar.next_period')}
                                >
                                    <Icon name="chevron_right" />
                                </button>
                                <button
                                    type="button"
                                    onClick={goToday}
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                                    title={t('admin.calendar.today')}
                                    aria-label={t('admin.calendar.today')}
                                >
                                    <Icon name="calendar_today" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {!employeeCalendar && (
                        <div className={`${showMobileFilters ? 'flex' : 'hidden'} mt-4 flex-wrap items-center gap-4 border-t border-slate-100 pt-4 md:flex`}>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-outline">{t('admin.calendar.staff')}</span>
                            <div className="flex flex-wrap gap-4">
                                {employees.map((e) => (
                                    <div key={e.id} className="flex items-center gap-2">
                                        <span
                                            className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/15 shadow-sm ring-1 ring-black/5"
                                            style={{ backgroundColor: getEmployeeSlotStyles(employeeColorMap, e.id).swatch }}
                                            aria-hidden
                                        />
                                        <span className="text-sm font-semibold text-on-surface">{e.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {moveError && (
                    <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                        <Icon name="error" className="shrink-0 text-red-600" />
                        <span>{moveError}</span>
                        <button type="button" className="ml-auto font-bold underline" onClick={() => setMoveError(null)}>
                            {t('admin.calendar.dismiss')}
                        </button>
                    </div>
                )}

                <CalendarWeekGrid
                    columnDates={column_dates}
                    appointments={appointments}
                    employeeColorMap={employeeColorMap}
                    hideEmployeeName={employeeCalendar}
                    onEventClick={(apt) => setSelected(apt)}
                    onAppointmentMove={onAppointmentMove}
                    dragSavingId={dragSavingId}
                    readOnly={false}
                    calendarHours={employeeCalendar ? calendarHours : null}
                    slotDurationMinutes={slotDuration}
                    calendarDayBreaks={calendarDayBreaks}
                    calendarDayOffs={calendarDayOffs}
                    calendarEmployeeDayBreaks={calendarEmployeeDayBreaks}
                    calendarEmployeeDayOffs={calendarEmployeeDayOffs}
                    slotValidationMode={employeeCalendar ? 'employee' : 'admin'}
                    alwaysShowScheduleHighlights={employeeCalendar}
                    selfViewEmployeeId={selfViewEmployeeId}
                />

                {selected && (
                    <EditAppointmentModal
                        appointment={selected}
                        employees={employees}
                        services={services}
                        readOnly={false}
                        employeeMode={employeeCalendar}
                        onClose={() => setSelected(null)}
                    />
                )}
            </div>
        </Layout>
    );
}
