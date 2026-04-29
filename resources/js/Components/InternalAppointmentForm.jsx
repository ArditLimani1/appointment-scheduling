import BookingAccordionStep from '@/Components/BookingAccordionStep';
import DatePicker from '@/Components/DatePicker';
import Icon from '@/Components/Icon';
import { useT } from '@/i18n/useT';
import { Link, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    coercePhoneInput,
    sanitizeBookingNotes,
    sanitizeBookingPlainText,
    validateBookingDetails,
} from '@/utils/bookingClientDetails';
import { patchSqMonthName } from '@/utils/appointmentDate';

const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF' };

function toDateString(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addMinutesToTimeString(hm, addMins) {
    if (!hm || !Number.isFinite(addMins) || addMins <= 0) return null;
    const [hRaw, mRaw] = String(hm).split(':');
    const h = Number.parseInt(hRaw, 10);
    const m = Number.parseInt(mRaw, 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    const total = ((h * 60 + m + addMins) % (24 * 60) + (24 * 60)) % (24 * 60);
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function formatDateLabel(ds, locale) {
    if (!ds) return null;
    try {
        const d = new Date(ds + 'T00:00:00');
        const isSq = String(locale || '').toLowerCase().startsWith('sq');
        const monthStyle = isSq ? 'long' : 'short';
        let result = new Intl.DateTimeFormat(locale || 'sq-AL', {
            weekday: 'short',
            month: monthStyle,
            day: 'numeric',
        }).format(d);
        if (isSq) result = patchSqMonthName(result, d, monthStyle);
        return result;
    } catch {
        return ds;
    }
}

/**
 * Admin / employee internal create flow — same visual language as the public booking page
 * (hero, BookingAccordionStep, summary card, primary-gradient confirm).
 */
export default function InternalAppointmentForm({
    context,
    business,
    employees,
    services,
    preselectedEmployeeId,
    returnTo,
    bookingToday: bookingTodayProp,
    backHref: backHrefProp,
}) {
    const t = useT();
    const { localeBcp47 } = usePage().props;
    const isEmployeeContext = context === 'employee';
    const backHref =
        backHrefProp
        ?? (isEmployeeContext ? route('employee.appointments.index') : route('admin.appointments.index'));
    const tNs = isEmployeeContext ? 'employee' : 'admin';

    const STEP = useMemo(
        () =>
            isEmployeeContext
                ? { services: 1, datetime: 2, client: 3 }
                : { employee: 1, services: 2, datetime: 3, client: 4 },
        [isEmployeeContext],
    );

    const currencySymbol =
        CURRENCY_SYMBOLS[business?.currency] ?? business?.currency_symbol ?? '€';
    const identifierType = business?.client_identifier_type ?? 'phone';
    const bookingToday = bookingTodayProp || toDateString(new Date());

    const initialEmployee = useMemo(() => {
        if (preselectedEmployeeId) {
            return employees.find((e) => Number(e.id) === Number(preselectedEmployeeId)) ?? null;
        }
        return null;
    }, [employees, preselectedEmployeeId]);

    const [selectedEmployee, setSelectedEmployee] = useState(initialEmployee);
    const [selectedServices, setSelectedServices] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [slotsError, setSlotsError] = useState(null);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');
    const [serverErrors, setServerErrors] = useState({});
    const [clientFieldErrors, setClientFieldErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const [expandedSection, setExpandedSection] = useState(1);
    const prevEmployeeIdRef = useRef(selectedEmployee?.id ?? null);
    const prevServicesCountRef = useRef(0);
    const prevSlotRef = useRef(null);
    const slotRequestKeyRef = useRef('');

    const toggleAccordionSection = useCallback((id) => {
        setExpandedSection((current) => (current === id ? null : id));
    }, []);

    const detailsValidation = useMemo(
        () =>
            validateBookingDetails({
                fullName,
                phone,
                email,
                notes,
                identifierType,
            }),
        [fullName, phone, email, notes, identifierType],
    );

    const availableServices = useMemo(() => {
        if (!isEmployeeContext && !selectedEmployee) return [];
        const offeredIds = new Set((selectedEmployee?.services ?? []).map((s) => Number(s.id)));
        if (offeredIds.size === 0) return [];
        return services.filter((s) => offeredIds.has(Number(s.id)));
    }, [services, selectedEmployee, isEmployeeContext]);

    useEffect(() => {
        if (selectedServices.length === 0) return;
        const allowed = new Set(availableServices.map((s) => Number(s.id)));
        const filtered = selectedServices.filter((s) => allowed.has(Number(s.id)));
        if (filtered.length !== selectedServices.length) {
            setSelectedServices(filtered);
            setSelectedSlot(null);
        }
    }, [availableServices]); // eslint-disable-line react-hooks/exhaustive-deps

    const totalDurationMinutes = useMemo(
        () => selectedServices.reduce((sum, s) => sum + (Number(s.duration) || 0), 0),
        [selectedServices],
    );
    const totalPrice = useMemo(
        () => selectedServices.reduce((sum, s) => sum + Number(s.price || 0), 0),
        [selectedServices],
    );

    const selectedServiceIdsKey = useMemo(
        () => selectedServices.map((s) => Number(s.id)).sort((a, b) => a - b).join(','),
        [selectedServices],
    );

    useEffect(() => {
        const employeeId = selectedEmployee?.id ?? null;
        if (!employeeId || selectedServices.length === 0 || !selectedDate) {
            slotRequestKeyRef.current = '';
            setSlots([]);
            setSlotsError(null);
            setSelectedSlot(null);
            return;
        }

        const key = `${employeeId}|${selectedDate}|${selectedServiceIdsKey}`;
        slotRequestKeyRef.current = key;
        setLoadingSlots(true);
        setSlots([]);
        setSlotsError(null);

        const params = new URLSearchParams({ date: selectedDate });
        if (!isEmployeeContext) {
            params.set('employee_id', String(employeeId));
        }
        selectedServices.forEach((s) => params.append('service_ids[]', String(s.id)));

        const routeName = isEmployeeContext
            ? 'employee.appointments.internal-slots'
            : 'admin.appointments.internal-slots';

        fetch(route(routeName) + '?' + params.toString(), {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(async (response) => {
                if (!response.ok) {
                    const body = await response.json().catch(() => ({}));
                    throw new Error(
                        body?.errors?.date?.[0]
                            ?? body?.errors?.service_ids?.[0]
                            ?? body?.errors?.employee_id?.[0]
                            ?? body?.message
                            ?? t(`${tNs}.appointments.create_load_slots_error`),
                    );
                }
                return response.json();
            })
            .then((data) => {
                if (slotRequestKeyRef.current !== key) return;
                setSlots(data.slots ?? []);
                setSelectedSlot((prev) =>
                    prev && (data.slots ?? []).includes(prev) ? prev : null,
                );
            })
            .catch((err) => {
                if (slotRequestKeyRef.current !== key) return;
                setSlots([]);
                setSlotsError(err.message || t(`${tNs}.appointments.create_load_slots_error`));
                setSelectedSlot(null);
            })
            .finally(() => {
                if (slotRequestKeyRef.current === key) setLoadingSlots(false);
            });
    }, [
        selectedEmployee?.id,
        selectedDate,
        selectedServiceIdsKey,
        isEmployeeContext,
        tNs,
        t,
    ]);

    useEffect(() => {
        if (isEmployeeContext) return;
        const empId = selectedEmployee?.id ?? null;
        if (empId && prevEmployeeIdRef.current !== empId) {
            setExpandedSection(STEP.services);
        }
        if (!empId && prevEmployeeIdRef.current != null) {
            setExpandedSection(STEP.employee);
        }
        prevEmployeeIdRef.current = empId;
    }, [isEmployeeContext, selectedEmployee?.id, STEP.services, STEP.employee]);

    useEffect(() => {
        const n = selectedServices.length;
        // Only regress to services when all are cleared — do NOT auto-open datetime
        // after the first service, so users can multi-select like the guest flow.
        if (n === 0 && prevServicesCountRef.current > 0) {
            setExpandedSection(STEP.services);
        }
        prevServicesCountRef.current = n;
    }, [selectedServices.length, STEP.services]);

    useEffect(() => {
        if (selectedSlot && !prevSlotRef.current) {
            setExpandedSection(STEP.client);
        }
        if (!selectedSlot && prevSlotRef.current) {
            setExpandedSection(STEP.datetime);
        }
        prevSlotRef.current = selectedSlot;
    }, [selectedSlot, STEP.client, STEP.datetime]);

    const sectionServicesSummary = useMemo(() => {
        if (selectedServices.length === 0) return null;
        if (selectedServices.length === 1) {
            const s = selectedServices[0];
            return `${s.name} · ${Number(s.price).toFixed(2)} ${currencySymbol}`;
        }
        return `${t('booking_ui.steps.service_count_other', { count: selectedServices.length })} · ${totalPrice.toFixed(2)} ${currencySymbol}`;
    }, [selectedServices, totalPrice, currencySymbol, t]);

    const sectionDatetimeSummary = useMemo(() => {
        if (!selectedDate) return null;
        if (!selectedSlot) {
            return `${formatDateLabel(selectedDate, localeBcp47)} — ${t('booking_ui.steps.pick_time')}`;
        }
        const endHm = totalDurationMinutes > 0
            ? addMinutesToTimeString(selectedSlot, totalDurationMinutes)
            : null;
        return endHm
            ? `${formatDateLabel(selectedDate, localeBcp47)} · ${selectedSlot}–${endHm}`
            : `${formatDateLabel(selectedDate, localeBcp47)} · ${selectedSlot}`;
    }, [selectedDate, selectedSlot, totalDurationMinutes, localeBcp47, t]);

    const sectionClientSummary = useMemo(() => {
        if (!detailsValidation.ok) return null;
        const id = identifierType === 'email' ? email.trim() : phone.trim();
        const nm = fullName.trim();
        if (!nm || !id) return null;
        return `${nm} · ${id}`;
    }, [detailsValidation.ok, identifierType, email, phone, fullName]);

    const toggleService = (svc) => {
        setSelectedServices((prev) => {
            const exists = prev.some((s) => Number(s.id) === Number(svc.id));
            return exists ? prev.filter((s) => Number(s.id) !== Number(svc.id)) : [...prev, svc];
        });
        setSelectedSlot(null);
    };

    const canSubmit =
        selectedEmployee
        && selectedServices.length > 0
        && selectedDate
        && selectedSlot
        && detailsValidation.ok
        && !submitting;

    const handleSubmit = (e) => {
        e?.preventDefault?.();
        if (!canSubmit) {
            if (!detailsValidation.ok) {
                setClientFieldErrors(detailsValidation.errors);
                if (selectedSlot) {
                    setExpandedSection(STEP.client);
                }
            }
            return;
        }
        setClientFieldErrors({});
        setServerErrors({});
        setSubmitting(true);

        const { payload } = detailsValidation;
        const routeName = isEmployeeContext
            ? 'employee.appointments.store'
            : 'admin.appointments.store';

        const body = {
            service_ids: selectedServices.map((s) => Number(s.id)),
            date: selectedDate,
            start_time: selectedSlot,
            client_first_name: payload.first,
            client_last_name: payload.last,
            ...(identifierType === 'phone'
                ? { client_phone: payload.phone }
                : { client_email: payload.email }),
            client_notes: payload.notesSanitized,
            return_to: returnTo ?? undefined,
        };
        if (!isEmployeeContext && selectedEmployee) {
            body.employee_id = Number(selectedEmployee.id);
        }

        router.post(route(routeName), body, {
            preserveScroll: false,
            onError: (errs) => {
                setServerErrors(errs ?? {});
                setSubmitting(false);
                setExpandedSection(STEP.client);
            },
            onSuccess: () => setSubmitting(false),
        });
    };

    const employeeError = serverErrors.employee_id;
    const serviceError = serverErrors.service_ids || serverErrors['service_ids.0'];
    const dateError = serverErrors.date;
    const startTimeError = serverErrors.start_time;

    return (
        <form onSubmit={handleSubmit} className="font-body">
            <header className="glass-header -mx-4 mb-10 rounded-none border-b border-outline-variant/20 px-4 py-4 sm:-mx-8 sm:px-8">
                <div className="flex max-w-5xl items-center justify-start">
                    <Link
                        href={backHref}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-outline-variant/30 text-on-surface transition-colors hover:bg-surface-container-low"
                        aria-label={t(`${tNs}.appointments.create_back`)}
                    >
                        <Icon name="arrow_back" size="text-xl" />
                    </Link>
                </div>
            </header>

            <div className="mx-auto max-w-5xl px-0 pb-32">
                <section className="mb-16">
                    <h1 className="mb-4 font-headline text-5xl font-extrabold tracking-tight text-on-surface">
                        {t('booking_ui.hero.title')}
                    </h1>
                    <p className="max-w-xl text-lg text-on-surface-variant">
                        {t(`${tNs}.appointments.create_description`)}
                    </p>
                </section>

                <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                    <div className="space-y-3 lg:col-span-8">
                        {!isEmployeeContext && (
                            <BookingAccordionStep
                                id={STEP.employee}
                                number={1}
                                title={t('booking_ui.steps.professional')}
                                summary={selectedEmployee?.name ?? null}
                                expanded={expandedSection === STEP.employee}
                                headerDisabled={false}
                                onHeaderClick={toggleAccordionSection}
                            >
                                <div className="space-y-4 pt-2">
                                    <p className="text-sm text-on-surface-variant">
                                        {t('admin.appointments.create_step_employee_hint')}
                                    </p>
                                    {employeeError ? (
                                        <p className="text-sm text-error">{Array.isArray(employeeError) ? employeeError[0] : employeeError}</p>
                                    ) : null}
                                    {employees.length === 0 ? (
                                        <p className="text-sm text-on-surface-variant">
                                            {t('admin.appointments.create_no_employees')}
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            {employees.map((emp) => {
                                                const active = selectedEmployee?.id === emp.id;
                                                return (
                                                    <button
                                                        key={emp.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedEmployee(emp);
                                                            setSelectedServices([]);
                                                            setSelectedSlot(null);
                                                        }}
                                                        className={`flex items-center gap-4 rounded-xl p-6 text-left transition-all duration-200 ${
                                                            active
                                                                ? 'ring-2 ring-on-surface bg-surface-container-low'
                                                                : 'bg-surface-container-low hover:bg-surface-container-high'
                                                        }`}
                                                    >
                                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-on-surface font-headline text-2xl font-bold text-surface">
                                                            {emp.name?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-headline text-lg font-bold text-on-surface">{emp.name}</p>
                                                            <p className="text-sm text-on-surface-variant">
                                                                {emp.title || t('booking_ui.specialist_fallback')}
                                                            </p>
                                                        </div>
                                                        {active ? (
                                                            <Icon name="check_circle" filled className="shrink-0 text-on-surface" size="text-xl" />
                                                        ) : null}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {selectedEmployee ? (
                                        <button
                                            type="button"
                                            onClick={() => setExpandedSection(STEP.services)}
                                            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-on-surface font-headline text-sm font-bold text-surface transition-opacity hover:opacity-90 sm:text-base"
                                        >
                                            {t('booking_ui.steps.continue')}
                                        </button>
                                    ) : null}
                                </div>
                            </BookingAccordionStep>
                        )}

                        <BookingAccordionStep
                            id={STEP.services}
                            number={isEmployeeContext ? 1 : 2}
                            title={t('booking_ui.steps.services')}
                            summary={sectionServicesSummary}
                            expanded={expandedSection === STEP.services}
                            headerDisabled={!selectedEmployee}
                            onHeaderClick={toggleAccordionSection}
                        >
                            <div className="space-y-4 pt-2">
                                <p className="text-sm text-on-surface-variant">{t('booking_ui.steps.services_hint')}</p>
                                {serviceError ? (
                                    <p className="text-sm text-error">{Array.isArray(serviceError) ? serviceError[0] : serviceError}</p>
                                ) : null}
                                {!selectedEmployee ? (
                                    <p className="text-sm text-on-surface-variant">{t('admin.appointments.create_pick_employee_first')}</p>
                                ) : availableServices.length === 0 ? (
                                    <p className="text-sm text-on-surface-variant">{t(`${tNs}.appointments.create_no_services`)}</p>
                                ) : (
                                    availableServices.map((svc) => {
                                        const isSelected = selectedServices.some((s) => Number(s.id) === Number(svc.id));
                                        return (
                                            <button
                                                key={svc.id}
                                                type="button"
                                                onClick={() => toggleService(svc)}
                                                className={`flex w-full items-center justify-between rounded-2xl p-6 text-left transition-all duration-200 sm:p-8 ${
                                                    isSelected
                                                        ? 'ring-2 ring-on-surface bg-surface-container-low'
                                                        : 'bg-surface-container-low hover:bg-surface-container-high'
                                                }`}
                                            >
                                                <div>
                                                    <p className="mb-1 font-headline text-xl font-bold text-on-surface">{svc.name}</p>
                                                    <div className="flex items-center gap-4 text-sm font-medium text-on-surface-variant">
                                                        <span className="flex items-center gap-1">
                                                            <Icon name="schedule" size="text-sm" />
                                                            {svc.duration} {t('booking_ui.min_suffix')}
                                                        </span>
                                                        <span className="flex items-center gap-1 font-bold text-on-surface">
                                                            <Icon name="payments" size="text-sm" />
                                                            {Number(svc.price).toFixed(2)} {currencySymbol}
                                                        </span>
                                                    </div>
                                                    {svc.description ? (
                                                        <p className="mt-1.5 text-xs text-on-surface-variant">{svc.description}</p>
                                                    ) : null}
                                                </div>
                                                <div
                                                    className={`ml-6 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                                                        isSelected
                                                            ? 'border-on-surface bg-on-surface'
                                                            : 'border-outline-variant'
                                                    }`}
                                                    aria-hidden
                                                >
                                                    {isSelected ? <Icon name="check" className="text-surface" size="text-lg" /> : null}
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                                {selectedServices.length > 0 ? (
                                    <button
                                        type="button"
                                        onClick={() => setExpandedSection(STEP.datetime)}
                                        className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-on-surface font-headline text-sm font-bold text-surface transition-opacity hover:opacity-90 sm:text-base"
                                    >
                                        {t('booking_ui.steps.continue')}
                                        <span className="font-medium opacity-90">
                                            (
                                            {selectedServices.length > 1
                                                ? t('booking_ui.steps.service_count_other', { count: selectedServices.length })
                                                : t('booking_ui.steps.service_count_one', { count: selectedServices.length })}
                                            )
                                        </span>
                                    </button>
                                ) : null}
                            </div>
                        </BookingAccordionStep>

                        <BookingAccordionStep
                            id={STEP.datetime}
                            number={isEmployeeContext ? 2 : 3}
                            title={t('booking_ui.steps.datetime')}
                            summary={sectionDatetimeSummary}
                            expanded={expandedSection === STEP.datetime}
                            headerDisabled={!selectedEmployee || selectedServices.length === 0}
                            onHeaderClick={toggleAccordionSection}
                        >
                            <div className="mt-2 space-y-8 rounded-2xl bg-surface-container-low p-6 sm:p-8">
                                {dateError || startTimeError ? (
                                    <p className="text-sm text-error">
                                        {[dateError, startTimeError]
                                            .flatMap((e) => (Array.isArray(e) ? e : e ? [e] : []))
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </p>
                                ) : null}
                                {selectedServices.length > 0 && selectedEmployee ? (
                                    <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm ring-1 ring-slate-100">
                                        <div className="flex w-full justify-center">
                                            <DatePicker
                                                labelClassName="ml-0 w-full text-center"
                                                showClear={false}
                                                label={t('booking_ui.steps.date_label')}
                                                value={selectedDate ?? ''}
                                                onChange={(v) => {
                                                    setSelectedDate(v || null);
                                                    setSelectedSlot(null);
                                                }}
                                                placeholder={t('booking_ui.steps.date_placeholder')}
                                                minDate={bookingToday}
                                                todayDateString={bookingToday}
                                                className="w-full max-w-md"
                                                buttonClassName="w-full"
                                            />
                                        </div>
                                    </div>
                                ) : null}

                                {selectedServices.length > 0 && selectedEmployee && selectedDate ? (
                                    loadingSlots ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Icon name="sync" className="animate-spin text-outline" size="text-3xl" />
                                        </div>
                                    ) : slotsError ? (
                                        <div className="flex flex-col items-center px-2 py-8 text-center">
                                            <Icon name="error" className="mb-2 text-error" size="text-4xl" />
                                            <p className="text-sm font-medium text-error">{slotsError}</p>
                                        </div>
                                    ) : slots.length === 0 ? (
                                        <div className="flex flex-col items-center py-8 text-center">
                                            <Icon name="event_busy" className="mb-2 text-outline" size="text-4xl" />
                                            <p className="text-sm text-on-surface-variant">{t(`${tNs}.appointments.create_no_slots`)}</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                            {slots.map((slot) => {
                                                const endHm = totalDurationMinutes > 0
                                                    ? addMinutesToTimeString(slot, totalDurationMinutes)
                                                    : null;
                                                const label = endHm ? `${slot} - ${endHm}` : slot;
                                                const active = selectedSlot === slot;
                                                return (
                                                    <button
                                                        key={slot}
                                                        type="button"
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className={`flex min-h-14 items-center justify-center rounded-xl px-2 py-2 text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                                                            active
                                                                ? 'bg-on-surface text-surface shadow-md'
                                                                : 'bg-surface-container-lowest text-on-surface hover:bg-on-surface hover:text-surface'
                                                        }`}
                                                    >
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )
                                ) : null}
                            </div>
                        </BookingAccordionStep>

                        <BookingAccordionStep
                            id={STEP.client}
                            number={isEmployeeContext ? 3 : 4}
                            title={t('booking_ui.steps.details')}
                            summary={sectionClientSummary}
                            expanded={expandedSection === STEP.client}
                            headerDisabled={
                                !selectedEmployee || selectedServices.length === 0 || !selectedDate || !selectedSlot
                            }
                            onHeaderClick={toggleAccordionSection}
                        >
                            <div className="grid grid-cols-1 gap-6 pt-2 sm:grid-cols-2">
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                                        {t('booking_ui.steps.full_name')}
                                    </label>
                                    <input
                                        value={fullName}
                                        onChange={(e) => {
                                            setFullName(sanitizeBookingPlainText(e.target.value, 201));
                                            setClientFieldErrors((p) => ({ ...p, client_first_name: undefined, client_last_name: undefined }));
                                        }}
                                        maxLength={201}
                                        autoComplete="name"
                                        className="h-14 w-full rounded-xl border border-slate-100 bg-transparent px-6 text-sm text-on-surface transition-all focus:ring-2 focus:ring-on-surface/20"
                                    />
                                    {(serverErrors.client_first_name || clientFieldErrors.client_first_name) && (
                                        <p className="mt-1 text-xs text-error">{serverErrors.client_first_name || clientFieldErrors.client_first_name}</p>
                                    )}
                                    {(serverErrors.client_last_name || clientFieldErrors.client_last_name) && (
                                        <p className="mt-1 text-xs text-error">{serverErrors.client_last_name || clientFieldErrors.client_last_name}</p>
                                    )}
                                </div>
                                {identifierType === 'phone' ? (
                                    <div className="space-y-2 sm:col-span-2">
                                        <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                                            {t('booking_ui.steps.phone')}
                                        </label>
                                        <input
                                            type="tel"
                                            inputMode="tel"
                                            value={phone}
                                            onChange={(e) => {
                                                setPhone(coercePhoneInput(e.target.value));
                                                setClientFieldErrors((p) => ({ ...p, client_phone: undefined }));
                                            }}
                                            maxLength={24}
                                            autoComplete="tel"
                                            placeholder="+38349444348"
                                            className="h-14 w-full rounded-xl border border-slate-100 bg-transparent px-6 text-sm text-on-surface placeholder:text-on-surface/40 transition-all focus:ring-2 focus:ring-on-surface/20"
                                        />
                                        <p className="text-xs text-on-surface-variant">{t('booking_ui.steps.phone_hint')}</p>
                                        {(serverErrors.client_phone || clientFieldErrors.client_phone) && (
                                            <p className="mt-1 text-xs text-error">{serverErrors.client_phone || clientFieldErrors.client_phone}</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2 sm:col-span-2">
                                        <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                                            {t('booking_ui.steps.email')}
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(sanitizeBookingPlainText(e.target.value, 255));
                                                setClientFieldErrors((p) => ({ ...p, client_email: undefined }));
                                            }}
                                            maxLength={255}
                                            autoComplete="email"
                                            className="h-14 w-full rounded-xl border border-slate-100 bg-transparent px-6 text-sm text-on-surface transition-all focus:ring-2 focus:ring-on-surface/20"
                                        />
                                        {(serverErrors.client_email || clientFieldErrors.client_email) && (
                                            <p className="mt-1 text-xs text-error">{serverErrors.client_email || clientFieldErrors.client_email}</p>
                                        )}
                                    </div>
                                )}
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                                        {t('booking_ui.steps.notes')}{' '}
                                        <span className="font-normal normal-case">{t('booking_ui.steps.optional')}</span>
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => {
                                            setNotes(sanitizeBookingNotes(e.target.value, 2000));
                                            setClientFieldErrors((p) => ({ ...p, client_notes: undefined }));
                                        }}
                                        maxLength={2000}
                                        rows={3}
                                        className="w-full resize-none rounded-xl border border-slate-100 bg-transparent px-6 py-4 text-sm text-on-surface transition-all focus:ring-2 focus:ring-on-surface/20"
                                    />
                                    {(serverErrors.client_notes || clientFieldErrors.client_notes) && (
                                        <p className="mt-1 text-xs text-error">{serverErrors.client_notes || clientFieldErrors.client_notes}</p>
                                    )}
                                </div>
                            </div>
                        </BookingAccordionStep>
                    </div>

                    <aside className="lg:col-span-4">
                        <div className="sticky top-28 space-y-8 rounded-2xl bg-surface-container-lowest p-8 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)]">
                            <h3 className="font-headline text-xl font-extrabold tracking-tight text-on-surface">
                                {t('booking_ui.steps.summary_title')}
                            </h3>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-container-low">
                                        <Icon name="content_cut" className="text-on-surface-variant" />
                                    </div>
                                    <div>
                                        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                                            {t('booking_ui.steps.summary_services')}
                                        </p>
                                        {selectedServices.length > 0 ? (
                                            <ul className="space-y-2">
                                                {selectedServices.map((s) => (
                                                    <li key={s.id}>
                                                        <p className="font-bold text-on-surface">{s.name}</p>
                                                        <p className="text-sm text-on-surface-variant">
                                                            {s.duration} {t('booking_ui.min_suffix')} • {Number(s.price).toFixed(2)} {currencySymbol}
                                                        </p>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-outline">{t('booking_ui.steps.not_selected')}</p>
                                        )}
                                    </div>
                                </div>

                                {!isEmployeeContext ? (
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-container-low">
                                            <Icon name="person" className="text-on-surface-variant" />
                                        </div>
                                        <div>
                                            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                                                {t('booking_ui.steps.summary_professional')}
                                            </p>
                                            {selectedEmployee ? (
                                                <p className="font-bold text-on-surface">{selectedEmployee.name}</p>
                                            ) : (
                                                <p className="text-sm text-outline">{t('booking_ui.steps.not_selected')}</p>
                                            )}
                                        </div>
                                    </div>
                                ) : null}

                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-container-low">
                                        <Icon name="event" className="text-on-surface-variant" />
                                    </div>
                                    <div>
                                        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                                            {t('booking_ui.steps.summary_datetime')}
                                        </p>
                                        {selectedDate && selectedSlot ? (
                                            <p className="font-bold text-on-surface">
                                                {formatDateLabel(selectedDate, localeBcp47)}
                                                {' · '}
                                                {(() => {
                                                    const endHm = totalDurationMinutes > 0
                                                        ? addMinutesToTimeString(selectedSlot, totalDurationMinutes)
                                                        : null;
                                                    return endHm ? `${selectedSlot}–${endHm}` : selectedSlot;
                                                })()}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-outline">{t('booking_ui.steps.not_selected')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-surface-container-high pt-6">
                                {selectedServices.length > 0 ? (
                                    <div className="mb-6 flex items-center justify-between">
                                        <span className="font-medium text-on-surface-variant">{t('booking_ui.steps.summary_total')}</span>
                                        <span className="font-headline text-3xl font-extrabold text-on-surface">
                                            {totalPrice.toFixed(2)} {currencySymbol}
                                        </span>
                                    </div>
                                ) : null}
                                <p className="mb-4 text-xs text-on-surface-variant">{t(`${tNs}.appointments.create_status_note`)}</p>
                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className="primary-gradient flex h-16 w-full items-center justify-center gap-2 rounded-xl font-headline text-lg font-bold text-white shadow-xl shadow-black/10 transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {submitting ? t('booking_ui.steps.submitting') : t('booking_ui.steps.confirm')}
                                    {!submitting ? <Icon name="arrow_forward" /> : null}
                                </button>
                                <p className="mt-4 text-center text-xs text-on-surface-variant">{t('booking_ui.steps.terms_note')}</p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </form>
    );
}
