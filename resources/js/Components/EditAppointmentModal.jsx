import { useEffect, useMemo, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import Icon from '@/Components/Icon';
import DatePicker from '@/Components/DatePicker';
import FilterListbox from '@/Components/FilterListbox';
import { appointmentStatusValue, formatAppointmentDate, formatTimeHm } from '@/utils/appointmentDate';

function toDateString(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const TABS = [
    { id: 'schedule', label: 'Service & Schedule', icon: 'calendar_month' },
    { id: 'client',   label: 'Client Details',     icon: 'person'         },
];

const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF' };

function statusLabel(status) {
    const v = appointmentStatusValue(status);
    return v.charAt(0).toUpperCase() + v.slice(1);
}

export default function EditAppointmentModal({
    appointment,
    employees,
    services,
    onClose,
    readOnly = false,
    employeeMode = false,
}) {
    const { auth } = usePage().props;
    const currencySymbol = CURRENCY_SYMBOLS[auth?.business?.currency] ?? auth?.business?.currency_symbol ?? '€';
    const employeeCanEditService = (auth?.business?.allow_employee_service_edit ?? true) === true;
    const lockServiceForEmployee = employeeMode && !employeeCanEditService;
    /** Employee modal: when service editing is disabled, do not show service or price anywhere. */
    const hideServiceAndPriceForEmployee = lockServiceForEmployee;

    const identifierType = (appointment.client_email && appointment.client_email.trim()) ? 'email' : 'phone';
    const today    = toDateString(new Date());

    // Normalize: Eloquent 'date' cast serializes as ISO datetime in JSON
    // (e.g. "2026-04-07T00:00:00.000000Z"). Slice to plain YYYY-MM-DD.
    const apptDate = appointment.date ? String(appointment.date).slice(0, 10) : today;
    const isPast   = apptDate < today;
    const statusVal = appointmentStatusValue(appointment.status);
    const employeeCancelledView = employeeMode && statusVal === 'cancelled';
    const effectiveReadOnly = readOnly || employeeCancelledView;

    const [activeTab, setActiveTab] = useState('schedule');

    const [form, setForm] = useState({
        client_first_name: appointment.client_first_name ?? '',
        client_last_name:  appointment.client_last_name ?? '',
        client_phone:      appointment.client_phone ?? '',
        client_email:      appointment.client_email ?? '',
        client_notes:      appointment.client_notes ?? '',
        service_id:        String(appointment.service_id ?? ''),
        status:            appointment.status ?? 'pending',
        employee_id:       String(appointment.employee_id ?? ''),
        date:              apptDate,
        start_time:        appointment.start_time ? appointment.start_time.slice(0, 5) : '',
    });

    const [slots, setSlots]               = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [errors, setErrors]             = useState({});
    const [submitting, setSubmitting]     = useState(false);
    const prevKeyRef                      = useRef('');

    const patch = (field, value) => setForm((f) => ({ ...f, [field]: value }));

    // Employees who can perform the selected service
    const eligibleEmployees = useMemo(() => {
        if (!form.service_id) return employees;
        const sid = Number(form.service_id);
        return employees.filter((e) => e.service_ids.includes(sid));
    }, [employees, form.service_id]);

    // Reset employee if no longer eligible after service change
    useEffect(() => {
        if (effectiveReadOnly || employeeMode) {
            return;
        }
        const eligible = eligibleEmployees.some((e) => String(e.id) === form.employee_id);
        if (!eligible && eligibleEmployees.length > 0) {
            patch('employee_id', String(eligibleEmployees[0].id));
        }
    }, [eligibleEmployees, effectiveReadOnly, employeeMode]);

    // Fetch slots whenever employee + date + service are all set (admin); date + service (employee)
    useEffect(() => {
        if (effectiveReadOnly) {
            return;
        }
        if (employeeMode) {
            const key = `e|${appointment.id}|${form.date}|${form.service_id}`;
            if (!form.date || !form.service_id) {
                prevKeyRef.current = '';
                setSlots([]);
                return;
            }
            if (prevKeyRef.current === key) return;
            prevKeyRef.current = key;

            setLoadingSlots(true);
            setSlots([]);

            const params = new URLSearchParams({
                date: form.date,
                service_id: form.service_id,
            });

            fetch(route('employee.appointments.slots', appointment.id) + '?' + params.toString(), {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            })
                .then((r) => r.json())
                .then((data) => setSlots(data.slots ?? []))
                .catch(() => setSlots([]))
                .finally(() => setLoadingSlots(false));
            return;
        }

        const key = `${form.employee_id}|${form.date}|${form.service_id}`;
        if (!form.employee_id || !form.date || !form.service_id) {
            prevKeyRef.current = '';
            setSlots([]);
            return;
        }
        if (prevKeyRef.current === key) return;
        prevKeyRef.current = key;

        setLoadingSlots(true);
        setSlots([]);

        const params = new URLSearchParams({
            employee_id: form.employee_id,
            service_id:  form.service_id,
            date:        form.date,
            exclude_id:  appointment.id,
        });

        fetch(route('admin.appointments.slots') + '?' + params.toString(), {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((r) => r.json())
            .then((data) => setSlots(data.slots ?? []))
            .catch(() => setSlots([]))
            .finally(() => setLoadingSlots(false));
    }, [form.employee_id, form.date, form.service_id, effectiveReadOnly, employeeMode, appointment.id]);

    /** True when the form still reflects the same service as the persisted appointment (not mid-edit service switch). */
    const sameServiceAsRecord = useMemo(
        () => String(form.service_id) === String(appointment.service_id ?? ''),
        [form.service_id, appointment.service_id],
    );

    /**
     * HH:MM options from the API for the current service. Optionally include the saved start time when it is missing
     * from the slot list only for the original service (e.g. legacy time in a break). After a service change, only
     * slots returned for the new service are shown.
     */
    const slotOptions = useMemo(() => {
        const set = new Set((slots || []).map((s) => formatTimeHm(s)));
        const cur = formatTimeHm(form.start_time);
        const saved = formatTimeHm(appointment.start_time);
        if (sameServiceAsRecord && form.date === apptDate && cur && saved && cur === saved) {
            set.add(cur);
        }
        return [...set].sort();
    }, [slots, form.start_time, form.date, apptDate, appointment.start_time, sameServiceAsRecord]);

    // Drop invalid time when slots update: keep selection only if it appears in API slots, or (same service only)
    // if it is the saved time missing from the list (break edge case). Changing service re-validates against new slots.
    useEffect(() => {
        if (effectiveReadOnly) {
            return;
        }
        if (!slots.length) {
            return;
        }
        const cur = formatTimeHm(form.start_time);
        if (!cur) {
            return;
        }
        if (slots.some((s) => formatTimeHm(s) === cur)) {
            return;
        }
        const saved = formatTimeHm(appointment.start_time);
        if (sameServiceAsRecord && form.date === apptDate && cur === saved) {
            return;
        }
        patch('start_time', '');
    }, [slots, form.start_time, form.date, effectiveReadOnly, apptDate, appointment.start_time, sameServiceAsRecord]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (effectiveReadOnly) {
            return;
        }
        if (submitting) return;
        setSubmitting(true);
        if (employeeMode) {
            router.put(
                route('employee.appointments.edit', appointment.id),
                {
                    service_id: Number(form.service_id),
                    status: form.status,
                    date: form.date,
                    start_time: form.start_time,
                },
                {
                    onError: (errs) => {
                        setErrors(errs);
                        setSubmitting(false);
                        setActiveTab('schedule');
                    },
                    onSuccess: () => {
                        setSubmitting(false);
                        onClose();
                    },
                },
            );
            return;
        }
        router.put(
            route('admin.appointments.edit', appointment.id),
            {
                client_first_name: form.client_first_name,
                client_last_name:  form.client_last_name,
                client_phone:      identifierType === 'phone' ? form.client_phone : (appointment.client_phone ?? null),
                client_email:      identifierType === 'email' ? form.client_email : (appointment.client_email ?? null),
                client_notes:      form.client_notes,
                service_id:        Number(form.service_id),
                status:            form.status,
                employee_id:       Number(form.employee_id),
                date:              form.date,
                start_time:        form.start_time,
            },
            {
                onError:   (errs) => {
                    setErrors(errs);
                    setSubmitting(false);
                    // Switch to the tab that contains the error
                    const scheduleFields = ['service_id', 'employee_id', 'date', 'start_time'];
                    const hasScheduleErr = scheduleFields.some((f) => errs[f]);
                    if (hasScheduleErr) setActiveTab('schedule');
                    else setActiveTab('client');
                },
                onSuccess: () => { setSubmitting(false); onClose(); },
            }
        );
    };

    const labelCls = 'block text-[10px] font-bold uppercase tracking-widest text-outline mb-0.5';
    const inputCls =
        'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-on-surface/10';

    // Count errors per tab for badge
    const scheduleErrors = ['service_id', 'employee_id', 'date', 'start_time'].filter((f) => errors[f]).length;
    const clientErrors   = ['client_first_name', 'client_last_name', 'client_phone', 'client_email'].filter((f) => errors[f]).length;

    const employeeName =
        employees.find((e) => String(e.id) === String(appointment.employee_id))?.name ?? '—';
    const serviceName = appointment.service?.name ?? services.find((s) => String(s.id) === String(appointment.service_id))?.name ?? '—';

    const readOnlyRow = (label, value) => (
        <div className="sm:col-span-2">
            <p className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-on-surface">{value || '—'}</p>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="relative flex max-h-[min(92vh,880px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

                {/* Header */}
                <div className="flex shrink-0 items-center justify-between rounded-t-2xl border-b border-slate-100 bg-white px-4 py-3 sm:px-5">
                    <h2 className="font-headline text-lg font-extrabold text-on-surface">
                        {effectiveReadOnly ? 'Appointment details' : employeeMode ? 'Edit your appointment' : 'Edit Appointment'}
                    </h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                        <Icon name="close" size="text-xl" className="text-on-surface-variant" />
                    </button>
                </div>

                {/* Past-date warning */}
                {!effectiveReadOnly && isPast && (
                    <div className="mx-4 mt-2 flex shrink-0 items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 sm:mx-5">
                        <Icon name="warning" size="text-base" className="mt-0.5 shrink-0 text-amber-500" />
                        <p className="text-xs text-amber-900 sm:text-sm">
                            <span className="font-bold">Past date.</span> Continue only if you mean to change it.
                        </p>
                    </div>
                )}

                {/* Tabs */}
                {!effectiveReadOnly && !employeeMode && (
                <div className="mt-1 flex shrink-0 border-b border-slate-100 px-4 sm:px-5">
                    {TABS.map((tab) => {
                        const errCount = tab.id === 'schedule' ? scheduleErrors : clientErrors;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`mr-4 flex items-center gap-1.5 border-b-2 px-0.5 py-2 text-sm font-semibold transition-colors sm:mr-6 ${
                                    activeTab === tab.id
                                        ? 'border-on-surface text-on-surface'
                                        : 'border-transparent text-on-surface-variant hover:text-on-surface'
                                }`}
                            >
                                <Icon name={tab.icon} size="text-base" />
                                {tab.label}
                                {errCount > 0 && (
                                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-error text-white text-[9px] font-bold">
                                        {errCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
                )}

                {/* Tab content — scrollable */}
                <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 pb-4 sm:px-5">

                        {effectiveReadOnly && (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <p className="sm:col-span-2 text-xs text-on-surface-variant">
                                    {employeeCancelledView
                                        ? 'Cancelled appointments cannot be edited.'
                                        : 'This booking is view-only. Contact your manager to make changes.'}
                                </p>
                                {!hideServiceAndPriceForEmployee && readOnlyRow('Service', serviceName)}
                                {readOnlyRow('Status', statusLabel(appointment.status))}
                                {readOnlyRow('Staff', employeeName)}
                                {readOnlyRow(
                                    'Date',
                                    formatAppointmentDate(appointment.date, {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    }),
                                )}
                                {readOnlyRow(
                                    'Time',
                                    `${formatTimeHm(appointment.start_time)} – ${formatTimeHm(appointment.end_time)}`,
                                )}
                                {!hideServiceAndPriceForEmployee && readOnlyRow(
                                    'Payment',
                                    `${Number(appointment.price ?? 0).toFixed(2)} ${currencySymbol}`,
                                )}
                                {readOnlyRow('Client', `${appointment.client_first_name ?? ''} ${appointment.client_last_name ?? ''}`.trim())}
                                {readOnlyRow('Phone', appointment.client_phone || '—')}
                                {readOnlyRow('Email', appointment.client_email || '—')}
                                {appointment.client_notes ? readOnlyRow('Notes', appointment.client_notes) : null}
                            </div>
                        )}

                        {/* ── Tab: Service & Schedule ── */}
                        {!effectiveReadOnly && activeTab === 'schedule' && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {!lockServiceForEmployee && (
                                        <FilterListbox
                                            label="Service"
                                            compact
                                            value={form.service_id}
                                            onChange={(v) => { patch('service_id', v); }}
                                            options={services.map((s) => ({ value: String(s.id), label: `${s.name} (${s.duration} min)` }))}
                                            minWidthClass="w-full"
                                        />
                                    )}
                                    <FilterListbox
                                        label="Status"
                                        compact
                                        value={form.status}
                                        onChange={(v) => patch('status', v)}
                                        options={[
                                            { value: 'pending', label: 'Pending' },
                                            { value: 'confirmed', label: 'Confirmed' },
                                            { value: 'cancelled', label: 'Cancelled' },
                                        ]}
                                        minWidthClass={lockServiceForEmployee ? 'w-full sm:max-w-md' : 'w-full'}
                                    />
                                </div>
                                {errors.service_id && <p className="text-xs text-error">{errors.service_id}</p>}
                                {errors.status && <p className="text-xs text-error">{errors.status}</p>}

                                {!employeeMode && (
                                    <>
                                        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2">
                                            <FilterListbox
                                                label="Employee"
                                                compact
                                                value={form.employee_id}
                                                onChange={(v) => { patch('employee_id', v); patch('start_time', ''); }}
                                                options={eligibleEmployees.map((e) => ({ value: String(e.id), label: e.name }))}
                                                minWidthClass="w-full"
                                            />
                                            <div>
                                                <span className={labelCls}>Payment</span>
                                                <div className="flex h-[42px] items-center rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm font-bold text-on-surface">
                                                    {Number(appointment.price ?? 0).toFixed(2)}
                                                    <span className="ml-1 font-semibold text-on-surface-variant">{currencySymbol}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {errors.employee_id && <p className="text-xs text-error">{errors.employee_id}</p>}
                                        {form.service_id && eligibleEmployees.length === 0 && (
                                            <p className="text-xs text-amber-600">No employee offers this service.</p>
                                        )}
                                    </>
                                )}

                                {employeeMode && !lockServiceForEmployee && (
                                    <div>
                                        <span className={labelCls}>Payment</span>
                                        <div className="flex h-[42px] items-center rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm font-bold text-on-surface">
                                            {Number(appointment.price ?? 0).toFixed(2)}
                                            <span className="ml-1 font-semibold text-on-surface-variant">{currencySymbol}</span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-on-surface-variant">
                                            Price updates when you change the service.
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className={labelCls}>Date</label>
                                    <DatePicker
                                        value={form.date}
                                        onChange={(v) => { patch('date', v || apptDate); patch('start_time', ''); }}
                                        placeholder="Pick a date"
                                        portal
                                    />
                                    {errors.date && <p className="text-xs text-error mt-0.5">{errors.date}</p>}
                                </div>

                                <div>
                                    <label className={labelCls}>Time</label>
                                    {(!employeeMode && (!form.employee_id || !form.date || !form.service_id)) ? (
                                        <p className="py-1 text-xs text-on-surface-variant">Choose service, employee, and date first.</p>
                                    ) : (employeeMode && (!form.date || !form.service_id)) ? (
                                        <p className="py-1 text-xs text-on-surface-variant">
                                            {lockServiceForEmployee ? 'Choose a date first.' : 'Choose service and date first.'}
                                        </p>
                                    ) : loadingSlots ? (
                                        <div className="flex items-center gap-2 py-1 text-xs text-on-surface-variant">
                                            <Icon name="sync" size="text-sm" className="animate-spin" /> Loading…
                                        </div>
                                    ) : slotOptions.length === 0 ? (
                                        <p className="py-1 text-xs text-on-surface-variant">No slots this day.</p>
                                    ) : (
                                        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
                                            {slotOptions.map((slotHm) => (
                                                <button
                                                    key={slotHm}
                                                    type="button"
                                                    onClick={() => patch('start_time', slotHm)}
                                                    className={`h-8 rounded-lg text-[11px] font-bold transition-all ${
                                                        formatTimeHm(form.start_time) === slotHm
                                                            ? 'bg-on-surface text-surface'
                                                            : 'bg-slate-100 text-on-surface hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {slotHm}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {errors.start_time && <p className="text-xs text-error mt-0.5">{errors.start_time}</p>}
                                </div>
                            </div>
                        )}

                        {/* ── Tab: Client Details ── */}
                        {!effectiveReadOnly && !employeeMode && activeTab === 'client' && (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className={labelCls}>First Name</label>
                                        <input
                                            value={form.client_first_name}
                                            onChange={(e) => patch('client_first_name', e.target.value)}
                                            className={inputCls}
                                            required
                                        />
                                        {errors.client_first_name && <p className="text-xs text-error mt-1">{errors.client_first_name}</p>}
                                    </div>
                                    <div>
                                        <label className={labelCls}>Last Name</label>
                                        <input
                                            value={form.client_last_name}
                                            onChange={(e) => patch('client_last_name', e.target.value)}
                                            className={inputCls}
                                            required
                                        />
                                        {errors.client_last_name && <p className="text-xs text-error mt-1">{errors.client_last_name}</p>}
                                    </div>
                                    <div className="sm:col-span-2">
                                        {identifierType === 'phone' ? (
                                            <>
                                                <label className={labelCls}>Phone Number</label>
                                                <input
                                                    type="tel"
                                                    value={form.client_phone}
                                                    onChange={(e) => patch('client_phone', e.target.value)}
                                                    className={inputCls}
                                                />
                                                {errors.client_phone && <p className="text-xs text-error mt-1">{errors.client_phone}</p>}
                                            </>
                                        ) : (
                                            <>
                                                <label className={labelCls}>Email</label>
                                                <input
                                                    type="email"
                                                    value={form.client_email}
                                                    onChange={(e) => patch('client_email', e.target.value)}
                                                    className={inputCls}
                                                />
                                                {errors.client_email && <p className="text-xs text-error mt-1">{errors.client_email}</p>}
                                            </>
                                        )}
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className={labelCls}>Notes <span className="normal-case font-normal">(optional)</span></label>
                                        <textarea
                                            value={form.client_notes}
                                            onChange={(e) => patch('client_notes', e.target.value)}
                                            rows={2}
                                            className={`${inputCls} resize-none`}
                                        />
                                    </div>
                            </div>
                        )}
                    </div>

                    {/* Footer — always visible */}
                    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
                        {effectiveReadOnly ? (
                            <div className="flex w-full justify-end">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-xl bg-on-surface px-5 py-2 text-sm font-bold text-surface transition-opacity hover:opacity-90"
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="min-w-0 text-[11px] text-on-surface-variant">
                                    {form.start_time ? (
                                        <span className="font-medium text-on-surface">
                                            {form.date} · {form.start_time}
                                        </span>
                                    ) : (
                                        <span className="italic">No time selected</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || !form.start_time}
                                        className="rounded-xl bg-on-surface px-5 py-2 text-sm font-bold text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {submitting ? 'Saving…' : 'Save'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
