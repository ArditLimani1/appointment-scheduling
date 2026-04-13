import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { buildAdminAppointmentPutPayload } from '@/utils/appointmentPutPayload';
import { formatAppointmentDate } from '@/utils/appointmentDate';
import {
    appendAppointmentStatusParams,
    DEFAULT_APPOINTMENT_STATUS_FILTER,
    normalizeAppointmentStatusFilter,
} from '@/utils/appointmentStatusFilter';
import { shiftCalendarAnchor, todayYmd } from '@/utils/calendarNavigation';

const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'cancelled'];

const VIEW_OPTIONS = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
];

function parseYmd(ymd) {
    const [y, m, d] = String(ymd).split('-').map(Number);
    return new Date(y, m - 1, d);
}

function getRoutePathname(routeName) {
    return new URL(route(routeName), window.location.href).pathname;
}

function buildCalendarUrl(employeeCalendar, date, view, filters) {
    const params = new URLSearchParams();
    params.set('date', date);
    params.set('view', view);
    if (!employeeCalendar && filters.employee_id) {
        params.set('employee_id', String(filters.employee_id));
    }
    appendAppointmentStatusParams(params, filters.status);
    const qs = params.toString();
    const routeName = employeeCalendar ? 'employee.appointments.calendar' : 'admin.appointments.calendar';
    const path = getRoutePathname(routeName);
    return path + (qs ? `?${qs}` : '');
}

function formatRangeTitle(rangeStart, rangeEnd, view) {
    const a = parseYmd(rangeStart);
    if (view === 'day') {
        return a.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    return `${formatAppointmentDate(rangeStart, { day: 'numeric', month: 'short' })} – ${formatAppointmentDate(rangeEnd, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })}`;
}

function formatRangeSubtitle(rangeStart, rangeEnd, view) {
    if (view === 'day') {
        return formatAppointmentDate(rangeStart, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
    return `${formatAppointmentDate(rangeStart, { day: 'numeric', month: 'short' })} – ${formatAppointmentDate(rangeEnd, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })}`;
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
}) {
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
            view: filtersProp.view === 'day' || filtersProp.view === 'week' ? filtersProp.view : calendar_view === 'day' ? 'day' : 'week',
            date:
                filtersProp.date != null && String(filtersProp.date).match(/^\d{4}-\d{2}-\d{2}$/)
                    ? String(filtersProp.date).slice(0, 10)
                    : range_start,
        }),
        [filtersProp.employee_id, statusFilterKey, filtersProp.view, filtersProp.date, calendar_view, range_start],
    );

    const [localFilters, setLocalFilters] = useState(normalizedFilters);

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
            router.put(
                route('admin.appointments.edit', apt.id),
                buildAdminAppointmentPutPayload(apt, { date, start_time }),
                {
                    preserveScroll: true,
                    onError: (errs) => {
                        setDragSavingId(null);
                        const first = errs.start_time || errs.date || Object.values(errs)[0];
                        setMoveError(typeof first === 'string' ? first : 'Could not move appointment.');
                    },
                    onFinish: () => setDragSavingId(null),
                },
            );
        },
        [],
    );

    const employeeOptions = useMemo(
        () => [{ value: '', label: 'All Staff' }, ...employees.map((e) => ({ value: String(e.id), label: e.name }))],
        [employees],
    );

    const statusOptions = useMemo(
        () =>
            APPOINTMENT_STATUSES.map((status) => ({
                value: status,
                label: status.charAt(0).toUpperCase() + status.slice(1),
            })),
        [],
    );

    const titleMain = useMemo(
        () => formatRangeTitle(range_start, range_end, localFilters.view),
        [range_start, range_end, localFilters.view],
    );

    const titleSub = useMemo(
        () => formatRangeSubtitle(range_start, range_end, localFilters.view),
        [range_start, range_end, localFilters.view],
    );

    const employeeColorMap = useMemo(() => buildEmployeeColorMap(employees), [employees]);

    const Layout = employeeCalendar ? EmployeeLayout : AdminLayout;

    return (
        <Layout>
            <Head title="Appointments — Calendar" />

            <div className="w-full min-w-0 max-w-full">
                {employeeCalendar ? (
                    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <h1 className="mb-2 font-headline text-4xl font-extrabold tracking-tight text-on-surface">Appointments</h1>
                            <p className="text-lg text-on-surface-variant">Calendar · view only (contact your manager to reschedule).</p>
                        </div>
                        <div className="flex w-full shrink-0 justify-end sm:w-auto">
                            <Link
                                href={route('employee.appointments.index', {}, false)}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-on-surface hover:bg-slate-50"
                            >
                                <Icon name="view_list" size="text-lg" />
                                Table view
                            </Link>
                        </div>
                    </div>
                ) : (
                    <PageHeader
                        title="Appointments"
                        description="Day or week view. Pick a date to choose which day or week to show. Drag events to reschedule."
                    >
                        <Link
                            href={route('admin.appointments.index')}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-on-surface hover:bg-slate-50"
                        >
                            <Icon name="view_list" size="text-lg" />
                            List view
                        </Link>
                    </PageHeader>
                )}

                <div className="mb-6 rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-slate-100 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="font-headline text-xl font-extrabold text-on-surface sm:text-2xl">{titleMain}</p>
                            <p className="text-sm text-on-surface-variant">{titleSub}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={goPrev}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                                aria-label="Previous period"
                            >
                                <Icon name="chevron_left" />
                            </button>
                            <div className="flex h-11 items-stretch">
                                <FilterListbox
                                    value={localFilters.view}
                                    onChange={(v) => patchFilters({ view: v, date: localFilters.date })}
                                    options={VIEW_OPTIONS}
                                    minWidthClass="min-w-[104px]"
                                    compact
                                    showLabel={false}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={goNext}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                                aria-label="Next period"
                            >
                                <Icon name="chevron_right" />
                            </button>
                            <button
                                type="button"
                                onClick={goToday}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                                title="Go to today"
                                aria-label="Go to today"
                            >
                                <Icon name="calendar_today" />
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4 items-end">
                        {!employeeCalendar && (
                            <FilterListbox
                                label="Employee"
                                value={localFilters.employee_id}
                                onChange={(v) => patchFilters({ employee_id: v })}
                                options={employeeOptions}
                            />
                        )}
                        <DatePicker
                            label="Date"
                            value={localFilters.date}
                            onChange={(value) => patchFilters({ date: value || todayYmd() })}
                            placeholder="Select date"
                            portal
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
                                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-slate-50"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Staff</span>
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
                </div>

                {!employeeCalendar && moveError && (
                    <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                        <Icon name="error" className="shrink-0 text-red-600" />
                        <span>{moveError}</span>
                        <button type="button" className="ml-auto font-bold underline" onClick={() => setMoveError(null)}>
                            Dismiss
                        </button>
                    </div>
                )}

                <CalendarWeekGrid
                    columnDates={column_dates}
                    appointments={appointments}
                    employeeColorMap={employeeColorMap}
                    onEventClick={(apt) => setSelected(apt)}
                    onAppointmentMove={onAppointmentMove}
                    dragSavingId={dragSavingId}
                    readOnly={employeeCalendar}
                />

                {selected && (
                    <EditAppointmentModal
                        appointment={selected}
                        employees={employees}
                        services={services}
                        readOnly={employeeCalendar}
                        onClose={() => setSelected(null)}
                    />
                )}
            </div>
        </Layout>
    );
}
