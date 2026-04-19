import { useEffect, useMemo, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import Icon from '@/Components/Icon';
import DatePicker from '@/Components/DatePicker';
import FilterListbox from '@/Components/FilterListbox';
import { useT } from '@/i18n/useT';
import { appointmentStatusValue, formatAppointmentDate, formatTimeHm } from '@/utils/appointmentDate';

function toDateString(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF' };

export default function EditAppointmentModal({
    appointment,
    employees,
    services,
    onClose,
    readOnly = false,
    employeeMode = false,
}) {
    const t = useT();
    const tabs = useMemo(
        () => [
            { id: 'schedule', label: t('components.edit_appointment.tab_schedule'), icon: 'calendar_month' },
            { id: 'client', label: t('components.edit_appointment.tab_client'), icon: 'person' },
        ],
        [t],
    );
    const { auth } = usePage().props;
    const currencySymbol = CURRENCY_SYMBOLS[auth?.business?.currency] ?? auth?.business?.currency_symbol ?? '€';
    const employeeCanEditService = (auth?.business?.allow_employee_service_edit ?? true) === true;
    const lockServiceForEmployee = employeeMode && !employeeCanEditService;
    /** Employee modal: when service editing is disabled, do not show service or price anywhere. */
    const hideServiceAndPriceForEmployee = lockServiceForEmployee;

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
                client_phone:      trimToNull(form.client_phone),
                client_email:      trimToNull(form.client_email),
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
                        {effectiveReadOnly
                            ? t('components.edit_appointment.title_readonly')
                            : employeeMode
                              ? t('components.edit_appointment.title_edit_employee')
                              : t('components.edit_appointment.title_edit')}
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
                            <span className="font-bold">{t('components.edit_appointment.past_date_title')}</span>{' '}
                            {t('components.edit_appointment.past_date_body')}
                        </p>
                    </div>
                )}

                {/* Tabs */}
                {!effectiveReadOnly && !employeeMode && (
                <div className="mt-1 flex shrink-0 border-b border-slate-100 px-4 sm:px-5">
                    {tabs.map((tab) => {
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
                                        ? t('components.edit_appointment.readonly_cancelled')
                                        : t('components.edit_appointment.readonly_view_only')}
                                </p>
                                {!hideServiceAndPriceForEmployee &&
                                    readOnlyRow(t('components.edit_appointment.service'), serviceName)}
                                {readOnlyRow(
                                    t('components.edit_appointment.status'),
                                    t(`common.status.${appointmentStatusValue(appointment.status)}`),
                                )}
                                {readOnlyRow(t('components.edit_appointment.staff'), employeeName)}
                                {readOnlyRow(
                                    t('components.edit_appointment.date'),
                                    formatAppointmentDate(appointment.date, {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    }),
                                )}
                                {readOnlyRow(
                                    t('components.edit_appointment.time'),
                                    `${formatTimeHm(appointment.start_time)} – ${formatTimeHm(appointment.end_time)}`,
                                )}
                                {!hideServiceAndPriceForEmployee &&
                                    readOnlyRow(
                                        t('components.edit_appointment.payment'),
                                        `${Number(appointment.price ?? 0).toFixed(2)} ${currencySymbol}`,
                                    )}
                                {readOnlyRow(
                                    t('components.edit_appointment.client'),
                                    `${appointment.client_first_name ?? ''} ${appointment.client_last_name ?? ''}`.trim(),
                                )}
                                {readOnlyRow(t('components.edit_appointment.phone'), appointment.client_phone || '—')}
                                {readOnlyRow(t('components.edit_appointment.email'), appointment.client_email || '—')}
                                {appointment.client_notes
                                    ? readOnlyRow(t('components.edit_appointment.notes'), appointment.client_notes)
                                    : null}
                            </div>
                        )}

                        {/* ── Tab: Service & Schedule ── */}
                        {!effectiveReadOnly && activeTab === 'schedule' && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {!lockServiceForEmployee && (
                                        <FilterListbox
                                            label={t('components.edit_appointment.service')}
                                            compact
                                            value={form.service_id}
                                            onChange={(v) => { patch('service_id', v); }}
                                            options={services.map((s) => ({
                                                value: String(s.id),
                                                label: t('components.edit_appointment.service_option', {
                                                    name: s.name,
                                                    duration: s.duration,
                                                }),
                                            }))}
                                            minWidthClass="w-full"
                                        />
                                    )}
                                    <FilterListbox
                                        label={t('components.edit_appointment.status')}
                                        compact
                                        value={form.status}
                                        onChange={(v) => patch('status', v)}
                                        options={[
                                            { value: 'pending', label: t('common.status.pending') },
                                            { value: 'confirmed', label: t('common.status.confirmed') },
                                            { value: 'cancelled', label: t('common.status.cancelled') },
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
                                                label={t('components.edit_appointment.employee')}
                                                compact
                                                value={form.employee_id}
                                                onChange={(v) => { patch('employee_id', v); patch('start_time', ''); }}
                                                options={eligibleEmployees.map((e) => ({ value: String(e.id), label: e.name }))}
                                                minWidthClass="w-full"
                                            />
                                            <div>
                                                <span className={labelCls}>{t('components.edit_appointment.payment')}</span>
                                                <div className="flex h-[42px] items-center rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm font-bold text-on-surface">
                                                    {Number(appointment.price ?? 0).toFixed(2)}
                                                    <span className="ml-1 font-semibold text-on-surface-variant">{currencySymbol}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {errors.employee_id && <p className="text-xs text-error">{errors.employee_id}</p>}
                                        {form.service_id && eligibleEmployees.length === 0 && (
                                            <p className="text-xs text-amber-600">{t('components.edit_appointment.no_employee_service')}</p>
                                        )}
                                    </>
                                )}

                                {employeeMode && !lockServiceForEmployee && (
                                    <div>
                                        <span className={labelCls}>{t('components.edit_appointment.payment')}</span>
                                        <div className="flex h-[42px] items-center rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm font-bold text-on-surface">
                                            {Number(appointment.price ?? 0).toFixed(2)}
                                            <span className="ml-1 font-semibold text-on-surface-variant">{currencySymbol}</span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-on-surface-variant">
                                            {t('components.edit_appointment.price_updates_hint')}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className={labelCls}>{t('components.edit_appointment.date')}</label>
                                    <DatePicker
                                        value={form.date}
                                        onChange={(v) => { patch('date', v || apptDate); patch('start_time', ''); }}
                                        placeholder={t('components.edit_appointment.date_placeholder')}
                                        portal
                                    />
                                    {errors.date && <p className="text-xs text-error mt-0.5">{errors.date}</p>}
                                </div>

                                <div>
                                    <label className={labelCls}>{t('components.edit_appointment.time')}</label>
                                    {(!employeeMode && (!form.employee_id || !form.date || !form.service_id)) ? (
                                        <p className="py-1 text-xs text-on-surface-variant">
                                            {t('components.edit_appointment.choose_staff_first')}
                                        </p>
                                    ) : (employeeMode && (!form.date || !form.service_id)) ? (
                                        <p className="py-1 text-xs text-on-surface-variant">
                                            {lockServiceForEmployee
                                                ? t('components.edit_appointment.choose_date_first')
                                                : t('components.edit_appointment.choose_service_date_first')}
                                        </p>
                                    ) : loadingSlots ? (
                                        <div className="flex items-center gap-2 py-1 text-xs text-on-surface-variant">
                                            <Icon name="sync" size="text-sm" className="animate-spin" />{' '}
                                            {t('components.edit_appointment.loading_slots')}
                                        </div>
                                    ) : slotOptions.length === 0 ? (
                                        <p className="py-1 text-xs text-on-surface-variant">{t('components.edit_appointment.no_slots')}</p>
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
                                        <label className={labelCls}>{t('components.edit_appointment.first_name')}</label>
                                        <input
                                            value={form.client_first_name}
                                            onChange={(e) => patch('client_first_name', e.target.value)}
                                            className={inputCls}
                                            required
                                        />
                                        {errors.client_first_name && <p className="text-xs text-error mt-1">{errors.client_first_name}</p>}
                                    </div>
                                    <div>
                                        <label className={labelCls}>{t('components.edit_appointment.last_name')}</label>
                                        <input
                                            value={form.client_last_name}
                                            onChange={(e) => patch('client_last_name', e.target.value)}
                                            className={inputCls}
                                            required
                                        />
                                        {errors.client_last_name && <p className="text-xs text-error mt-1">{errors.client_last_name}</p>}
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className={labelCls}>{t('components.edit_appointment.phone')}</label>
                                        <input
                                            type="tel"
                                            value={form.client_phone}
                                            onChange={(e) => patch('client_phone', e.target.value)}
                                            className={inputCls}
                                        />
                                        {errors.client_phone && <p className="text-xs text-error mt-1">{errors.client_phone}</p>}
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className={labelCls}>{t('components.edit_appointment.email')}</label>
                                        <input
                                            type="email"
                                            value={form.client_email}
                                            onChange={(e) => patch('client_email', e.target.value)}
                                            className={inputCls}
                                        />
                                        {errors.client_email && <p className="text-xs text-error mt-1">{errors.client_email}</p>}
                                        <p className="mt-1 text-[11px] text-on-surface-variant">
                                            Appointment update emails are sent only when an email address is saved.
                                        </p>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className={labelCls}>
                                            {t('components.edit_appointment.notes')}{' '}
                                            <span className="normal-case font-normal">
                                                {t('components.edit_appointment.notes_optional')}
                                            </span>
                                        </label>
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
                                    {t('components.edit_appointment.close')}
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
                                        <span className="italic">{t('components.edit_appointment.footer_no_time')}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-slate-50"
                                    >
                                        {t('components.edit_appointment.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || !form.start_time}
                                        className="rounded-xl bg-on-surface px-5 py-2 text-sm font-bold text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {submitting ? t('components.edit_appointment.saving') : t('components.edit_appointment.save')}
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
