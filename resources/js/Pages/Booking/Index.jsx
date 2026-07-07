import BookingAccordionStep from '@/Components/BookingAccordionStep';
import LanguageSwitcher from '@/i18n/LanguageSwitcher';
import { useT } from '@/i18n/useT';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Icon from '@/Components/Icon';
import DatePicker from '@/Components/DatePicker';
import {
    coercePhoneInput,
    sanitizeBookingNotes,
    sanitizeBookingPlainText,
    validateBookingDetails,
} from '@/utils/bookingClientDetails';
import { patchSqMonthName } from '@/utils/appointmentDate';
import { resolveClientIdentifierType } from '@/utils/clientIdentification';

function toDateString(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildDateRangeFromAnchor(firstYmd, maxWindow) {
    const days = [];
    const [y, m, d] = firstYmd.split('-').map(Number);
    const start = new Date(y, m - 1, d);
    const cap = maxWindow ?? 30;
    for (let i = 0; i <= cap; i++) {
        const dt = new Date(start);
        dt.setDate(start.getDate() + i);
        days.push(dt);
    }
    return days;
}

/** Current HH:mm (24h) in an IANA timezone — for filtering same-day slots on the client. */
function formatNowHmInTimeZone(timeZone) {
    if (!timeZone) return null;
    try {
        const parts = new Intl.DateTimeFormat('en-GB', {
            timeZone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).formatToParts(new Date());
        const h = parts.find((p) => p.type === 'hour')?.value;
        const min = parts.find((p) => p.type === 'minute')?.value;
        if (h == null || min == null) return null;
        return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    } catch {
        return null;
    }
}

function filterSlotsNotInPastForToday(slots, dateYmd, businessTodayYmd, timeZone) {
    if (!dateYmd || dateYmd !== businessTodayYmd || !slots?.length) {
        return slots || [];
    }
    const hm = formatNowHmInTimeZone(timeZone);
    if (!hm) return slots;
    return slots.filter((s) => String(s) >= hm);
}

/** Monday = 0 … Sunday = 6 (same as employee schedule / server). */
function dateToScheduleDayIndex(d) {
    const dow = d.getDay();
    return dow === 0 ? 6 : dow - 1;
}

function employeeHasActiveScheduleDay(employee) {
    return (employee?.schedules || []).some((s) => s.is_active);
}

function employeeWorksOnLocalDate(employee, d) {
    const idx = dateToScheduleDayIndex(d);
    return (employee.schedules || []).some(
        (s) => Number(s.day_of_week) === idx && s.is_active
    );
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
        if (isSq) {
            result = patchSqMonthName(result, d, monthStyle);
        }
        return result;
    } catch {
        return ds;
    }
}

function addMinutesToTimeString(hm, addMins) {
    if (!hm || !Number.isFinite(addMins) || addMins <= 0) return null;
    const parts = hm.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    let total = h * 60 + m + addMins;
    total = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
    const hh = Math.floor(total / 60);
    const mm = total % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export default function Index({
    employees,
    services,
    business,
    slug,
    preselected_employee_id = null,
    booking_today: bookingTodayProp,
    booking_max_date: bookingMaxDateProp,
}) {
    const t = useT();
    const { localeBcp47, features } = usePage().props;
    const preselectedEmployee = preselected_employee_id
        ? (employees.find((e) => e.id === preselected_employee_id) ?? null)
        : null;

    const [selectedEmployee, setSelectedEmployee] = useState(preselectedEmployee);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedServices, setSelectedServices] = useState([]);
    const [slots, setSlots] = useState([]);
    const [slotsError, setSlotsError] = useState(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [clientFieldErrors, setClientFieldErrors] = useState({});
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');
    const [expandedSection, setExpandedSection] = useState(1);
    const step2Ref = useRef(null);
    const step3Ref = useRef(null);
    const step4Ref = useRef(null);
    const isEmployeePreselected = !!preselected_employee_id && !!preselectedEmployee;

    const toggleAccordionSection = useCallback((id) => {
        setExpandedSection((current) => (current === id ? null : id));
    }, []);

    const openStepAndScroll = useCallback((id, ref) => {
        setExpandedSection(id);
        requestAnimationFrame(() => {
            setTimeout(() => {
                const el = ref?.current;
                if (!el) return;
                const top = el.getBoundingClientRect().top + window.scrollY - 16;
                window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
            }, 40);
        });
    }, []);

    const identifierType = resolveClientIdentifierType(
        business?.client_identifier_type,
        features?.whatsapp ?? false,
    );

    const detailsValidation = useMemo(
        () =>
            validateBookingDetails({
                fullName,
                phone,
                email,
                notes,
                identifierType,
            }),
        [fullName, phone, email, notes, identifierType]
    );

    const prevEmployeeDateKeyRef = useRef('');

    const bookingToday = bookingTodayProp || toDateString(new Date());
    const bookingMaxDate =
        bookingMaxDateProp ||
        (() => {
            const [y, m, d] = bookingToday.split('-').map(Number);
            const t = new Date(y, m - 1, d);
            t.setDate(t.getDate() + (business?.max_booking_window || 30));
            return toDateString(t);
        })();

    const fullDateRange = useMemo(
        () => buildDateRangeFromAnchor(bookingToday, business?.max_booking_window || 30),
        [business?.max_booking_window, bookingToday]
    );

    const bookableDates = useMemo(() => {
        if (!selectedEmployee) {
            return fullDateRange;
        }
        const rows = selectedEmployee.schedules || [];
        if (rows.length === 0) {
            return fullDateRange;
        }
        if (!employeeHasActiveScheduleDay(selectedEmployee)) {
            return [];
        }
        return fullDateRange.filter((d) => employeeWorksOnLocalDate(selectedEmployee, d));
    }, [fullDateRange, selectedEmployee]);

    const selectedServiceIdsKey = useMemo(
        () => selectedServices.map((s) => s.id).sort((a, b) => a - b).join(','),
        [selectedServices]
    );

    const employeesForSelectedServices = useMemo(() => {
        if (selectedServices.length === 0) {
            return [];
        }
        const requiredIds = selectedServices.map((s) => s.id);
        return employees.filter((emp) => {
            const offered = (emp.services || []).map((s) => s.id);
            return requiredIds.every((id) => offered.includes(id));
        });
    }, [employees, selectedServices]);

    useEffect(() => {
        if (!selectedEmployee || selectedServices.length === 0) {
            return;
        }
        const requiredIds = selectedServices.map((s) => s.id);
        const offered = (selectedEmployee.services || []).map((s) => s.id);
        const ok = requiredIds.every((id) => offered.includes(id));
        if (!ok) {
            setSelectedEmployee(null);
            setSelectedDate(null);
            setSelectedSlot(null);
            setSlots([]);
            setSlotsError(null);
            prevEmployeeDateKeyRef.current = '';
        }
    }, [selectedServiceIdsKey, selectedEmployee]);

    const toggleService = (svc) => {
        setSelectedServices((prev) => {
            const exists = prev.some((s) => s.id === svc.id);
            if (exists) {
                return prev.filter((s) => s.id !== svc.id);
            }
            return [...prev, svc];
        });
        setSelectedDate(null);
        setSelectedSlot(null);
        setSlots([]);
        setSlotsError(null);
        prevEmployeeDateKeyRef.current = '';
    };

    useEffect(() => {
        if (selectedServices.length > 0) {
            return;
        }
        // When the employee is preselected via URL, keep them selected even when no services are chosen yet.
        if (!isEmployeePreselected) {
            setSelectedEmployee(null);
        }
        setSelectedDate(null);
        setSelectedSlot(null);
        setSlots([]);
        setSlotsError(null);
        prevEmployeeDateKeyRef.current = '';
    }, [selectedServices.length, isEmployeePreselected]);

    useEffect(() => {
        if (!selectedEmployee || !selectedDate) {
            prevEmployeeDateKeyRef.current = '';
            setSlots([]);
            setSlotsError(null);
            setSelectedSlot(null);
            return;
        }

        const employeeDateKey = `${selectedEmployee.id}|${selectedDate}`;
        const employeeOrDateChanged = prevEmployeeDateKeyRef.current !== employeeDateKey;
        if (employeeOrDateChanged) {
            prevEmployeeDateKeyRef.current = employeeDateKey;
            setSelectedSlot(null);
        }

        setLoadingSlots(true);
        setSlots([]);
        setSlotsError(null);

        const slotsRequestKey = `${selectedEmployee.id}|${selectedDate}`;

        const params = new URLSearchParams({
            employee_id: String(selectedEmployee.id),
            date: selectedDate,
        });
        selectedServices.forEach((s) => params.append('service_ids[]', String(s.id)));
        fetch(route('booking.slots', { slug }) + '?' + params.toString())
            .then(async (response) => {
                if (!response.ok) {
                    const body = await response.json().catch(() => ({}));
                    const msg =
                        body.errors?.date?.[0]
                        || body.errors?.service_ids?.[0]
                        || body.errors?.employee_id?.[0]
                        || body.message
                        || t('booking_ui.steps.load_times_error');
                    throw new Error(msg);
                }
                return response.json();
            })
            .then((responseData) => {
                if (prevEmployeeDateKeyRef.current !== slotsRequestKey) {
                    return;
                }
                const raw = responseData.slots || [];
                const availableSlots = filterSlotsNotInPastForToday(
                    raw,
                    selectedDate,
                    bookingToday,
                    business?.timezone
                );
                setSlots(availableSlots);
                if (!employeeOrDateChanged) {
                    setSelectedSlot((prev) => (prev && availableSlots.includes(prev) ? prev : null));
                }
            })
            .catch((err) => {
                setSlots([]);
                setSlotsError(err.message || t('booking_ui.steps.load_times_error'));
                if (!employeeOrDateChanged) {
                    setSelectedSlot(null);
                }
            })
            .finally(() => setLoadingSlots(false));
    }, [selectedEmployee?.id, selectedDate, selectedServiceIdsKey, slug, bookingToday, business?.timezone]);

    useEffect(() => {
        if (!selectedEmployee) {
            return;
        }
        if (!selectedDate) {
            // Always default to business "today"; backend availability decides slots.
            setSelectedDate(bookingToday);
            setSelectedSlot(null);
        }
    }, [selectedEmployee?.id, selectedDate, bookingToday]);

    const canSubmit =
        selectedServices.length > 0
        && selectedEmployee
        && selectedDate
        && selectedSlot
        && detailsValidation.ok;

    const totalSteps = isEmployeePreselected ? 3 : 4;
    const progress = [
        selectedServices.length > 0,
        selectedEmployee,
        selectedDate && selectedSlot,
        detailsValidation.ok,
    ].filter(Boolean).length;

    const handleSubmit = () => {
        if (!canSubmit || submitting) return;
        if (!detailsValidation.ok) {
            setClientFieldErrors(detailsValidation.errors);
            return;
        }
        setClientFieldErrors({});
        setSubmitting(true);
        const { payload } = detailsValidation;
        router.post(
            route('booking.store', { slug }),
            {
                employee_id: selectedEmployee.id,
                service_ids: selectedServices.map((s) => s.id),
                date: selectedDate,
                start_time: selectedSlot,
                client_first_name: payload.first,
                client_last_name: payload.last,
                ...(identifierType === 'phone' ? { client_phone: payload.phone } : { client_email: payload.email }),
                client_notes: payload.notesSanitized,
            },
            {
                onError: (errs) => {
                    setErrors(errs);
                    setClientFieldErrors({});
                    setSubmitting(false);
                },
                onSuccess: () => setSubmitting(false),
            }
        );
    };

    const currencySymbol = business?.currency_symbol ?? '€';
    const businessLogoUrl = business?.logo ? `/storage/${business.logo}` : null;

    const servicesTotalPrice = useMemo(
        () => selectedServices.reduce((sum, s) => sum + Number(s.price), 0),
        [selectedServices]
    );

    const totalBookingMinutes = useMemo(
        () => selectedServices.reduce((sum, s) => sum + (Number(s.duration) || 0), 0),
        [selectedServices]
    );

    const section1Summary = useMemo(() => {
        if (selectedServices.length === 0) return null;
        if (selectedServices.length === 1) {
            const s = selectedServices[0];
            return `${s.name} · ${Number(s.price).toFixed(2)} ${currencySymbol}`;
        }
        return `${t('booking_ui.steps.service_count_other', { count: selectedServices.length })} · ${servicesTotalPrice.toFixed(2)} ${currencySymbol}`;
    }, [selectedServices, servicesTotalPrice, currencySymbol]);
    const section2Summary = selectedEmployee?.name ?? null;
    const section3Summary = useMemo(() => {
        if (!selectedDate) return null;
        if (!selectedSlot) {
            return `${formatDateLabel(selectedDate, localeBcp47)} — ${t('booking_ui.steps.pick_time')}`;
        }
        const endHm = totalBookingMinutes > 0 ? addMinutesToTimeString(selectedSlot, totalBookingMinutes) : null;
        return endHm
            ? `${formatDateLabel(selectedDate, localeBcp47)} · ${selectedSlot}–${endHm}`
            : `${formatDateLabel(selectedDate, localeBcp47)} · ${selectedSlot}`;
    }, [selectedDate, selectedSlot, totalBookingMinutes, localeBcp47]);
    const section4Summary = useMemo(() => {
        if (!detailsValidation.ok) return null;
        const id = identifierType === 'email' ? email.trim() : phone.trim();
        const nm = fullName.trim();
        if (!nm || !id) return null;
        return `${nm} · ${id}`;
    }, [detailsValidation.ok, identifierType, email, phone, fullName]);

    return (
        <div className="min-h-screen bg-surface font-body">
            <Head title={t('booking_ui.head_title')} />

            <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-surface-container-highest">
                <div
                    className="bg-on-surface h-full transition-all duration-500"
                    style={{ width: `${(progress / totalSteps) * 100}%` }}
                />
            </div>

            <header className="sticky top-0 z-50 glass-header border-b border-outline-variant/20">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        {businessLogoUrl ? (
                            <img
                                src={businessLogoUrl}
                                alt={`${business?.name || t('booking_ui.hero.default_business')} logo`}
                                className="h-11 w-11 rounded-2xl object-cover border border-outline-variant/30 bg-surface-container-low"
                            />
                        ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container">
                                <Icon name="storefront" size="text-xl" />
                            </div>
                        )}
                        <p className="text-xl font-extrabold tracking-tight text-on-surface font-headline truncate">
                            {business?.name || t('booking_ui.hero.default_business')}
                        </p>
                    </div>
                    <LanguageSwitcher className="shrink-0" />
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12 pb-32">
                <section className="mb-16">
                    <h1 className="font-headline text-5xl font-extrabold tracking-tight mb-4 text-on-surface">{t('booking_ui.hero.title')}</h1>
                    {isEmployeePreselected ? (
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-on-surface text-surface shrink-0">
                                <Icon name="person" size="text-lg" />
                            </div>
                            <p className="text-on-surface-variant text-lg">
                                {t('booking_ui.hero.with_professional')}{' '}
                                <span className="font-semibold text-on-surface">{preselectedEmployee.name}</span>
                                {preselectedEmployee.title ? ` · ${preselectedEmployee.title}` : ''}
                            </p>
                        </div>
                    ) : (
                        <p className="text-on-surface-variant text-lg max-w-xl">
                            {t('booking_ui.hero.subtitle')}
                        </p>
                    )}
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8 space-y-3">

                        <BookingAccordionStep
                            id={1}
                            number={1}
                            title={t('booking_ui.steps.services')}
                            summary={section1Summary}
                            expanded={expandedSection === 1}
                            headerDisabled={false}
                            onHeaderClick={toggleAccordionSection}
                        >
                            <div className="space-y-4 pt-2">
                                <p className="text-sm text-on-surface-variant">
                                    {t('booking_ui.steps.services_hint')}
                                </p>
                                {services.map((svc) => {
                                    const isSelected = selectedServices.some((s) => s.id === svc.id);
                                    return (
                                        <button
                                            key={svc.id}
                                            type="button"
                                            onClick={() => toggleService(svc)}
                                            className={`w-full p-6 sm:p-8 rounded-2xl flex items-center justify-between text-left transition-all duration-200 ${
                                                isSelected
                                                    ? 'ring-2 ring-on-surface bg-surface-container-low'
                                                    : 'bg-surface-container-low hover:bg-surface-container-high'
                                            }`}
                                        >
                                            <div>
                                                <p className="font-headline font-bold text-xl mb-1 text-on-surface">{svc.name}</p>
                                                <div className="flex items-center gap-4 text-on-surface-variant text-sm font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <Icon name="schedule" size="text-sm" /> {svc.duration} {t('booking_ui.min_suffix')}
                                                    </span>
                                                    <span className="flex items-center gap-1 font-bold text-on-surface">
                                                        <Icon name="payments" size="text-sm" /> {Number(svc.price).toFixed(2)} {currencySymbol}
                                                    </span>
                                                </div>
                                                {svc.description && (
                                                    <p className="text-xs text-on-surface-variant mt-1.5">{svc.description}</p>
                                                )}
                                            </div>
                                            <div
                                                className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 ml-6 transition-all ${
                                                    isSelected
                                                        ? 'border-on-surface bg-on-surface'
                                                        : 'border-outline-variant'
                                                }`}
                                                aria-hidden
                                            >
                                                {isSelected && (
                                                    <Icon name="check" size="text-lg" className="text-surface" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                                {selectedServices.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (isEmployeePreselected) {
                                                openStepAndScroll(3, step3Ref);
                                            } else {
                                                openStepAndScroll(2, step2Ref);
                                            }
                                        }}
                                        className="w-full h-14 rounded-xl bg-on-surface text-surface font-headline font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                    >
                                        {t('booking_ui.steps.continue')}
                                        <span className="font-medium opacity-90">
                                            ({selectedServices.length > 1
                                                ? t('booking_ui.steps.service_count_other', { count: selectedServices.length })
                                                : t('booking_ui.steps.service_count_one', { count: selectedServices.length })})
                                        </span>
                                    </button>
                                )}
                            </div>
                        </BookingAccordionStep>

                        {!isEmployeePreselected && (
                        <BookingAccordionStep
                            id={2}
                            number={2}
                            title={t('booking_ui.steps.professional')}
                            summary={section2Summary}
                            expanded={expandedSection === 2}
                            headerDisabled={selectedServices.length === 0}
                            onHeaderClick={toggleAccordionSection}
                            containerRef={step2Ref}
                        >
                            <div className="pt-2 space-y-4">
                                {selectedServices.length > 0 && employeesForSelectedServices.length === 0 && (
                                    <p className="text-sm text-on-surface-variant">
                                        {t('booking_ui.steps.professional_empty')}
                                    </p>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {selectedServices.length > 0 && employeesForSelectedServices.map(emp => (
                                        <button
                                            key={emp.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedEmployee(emp);
                                                setSelectedSlot(null);
                                                openStepAndScroll(3, step3Ref);
                                            }}
                                            className={`p-6 rounded-xl text-left flex items-center gap-4 transition-all duration-200 ${
                                                selectedEmployee?.id === emp.id
                                                    ? 'ring-2 ring-on-surface bg-surface-container-low'
                                                    : 'bg-surface-container-low hover:bg-surface-container-high'
                                            }`}
                                        >
                                            <div className="w-16 h-16 rounded-full bg-on-surface flex items-center justify-center text-surface shrink-0">
                                                <Icon name="person" size="text-2xl" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-headline font-bold text-lg text-on-surface">{emp.name}</p>
                                                <p className="text-sm text-on-surface-variant">{emp.title || t('booking_ui.specialist_fallback')}</p>
                                            </div>
                                            {selectedEmployee?.id === emp.id && (
                                                <Icon name="check_circle" size="text-xl" filled className="text-on-surface shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </BookingAccordionStep>
                        )}

                        <BookingAccordionStep
                            id={3}
                            number={isEmployeePreselected ? 2 : 3}
                            title={t('booking_ui.steps.datetime')}
                            summary={section3Summary}
                            expanded={expandedSection === 3}
                            headerDisabled={selectedServices.length === 0 || !selectedEmployee}
                            onHeaderClick={toggleAccordionSection}
                            containerRef={step3Ref}
                        >
                            <div className="bg-surface-container-low p-6 sm:p-8 rounded-2xl space-y-8 mt-2">
                                {selectedServices.length > 0 && selectedEmployee && (
                                    <div className="rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-slate-100 shadow-sm">
                                        <div className="flex w-full justify-center">
                                            <DatePicker
                                                labelClassName="text-center w-full ml-0"
                                                showClear={false}
                                                label={t('booking_ui.steps.date_label')}
                                                value={selectedDate ?? ''}
                                                onChange={(value) => {
                                                    setSelectedDate(value || null);
                                                    setSelectedSlot(null);
                                                }}
                                                placeholder={t('booking_ui.steps.date_placeholder')}
                                                minDate={bookingToday}
                                                maxDate={bookingMaxDate}
                                                todayDateString={bookingToday}
                                                className="w-full max-w-md"
                                                buttonClassName="w-full"
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedServices.length > 0 && selectedEmployee && selectedDate && (
                                    loadingSlots ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Icon name="sync" size="text-3xl" className="text-outline animate-spin" />
                                        </div>
                                    ) : slotsError ? (
                                        <div className="flex flex-col items-center py-8 text-center px-2">
                                            <Icon name="error" size="text-4xl" className="text-error mb-2" />
                                            <p className="text-sm text-error font-medium">{slotsError}</p>
                                        </div>
                                    ) : slots.length === 0 ? (
                                        <div className="flex flex-col items-center py-8 text-center">
                                            <Icon name="event_busy" size="text-4xl" className="text-outline mb-2" />
                                            <p className="text-sm text-on-surface-variant">{t('booking_ui.steps.no_slots')}</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                            {slots.map(slot => {
                                                const endHm = totalBookingMinutes > 0 ? addMinutesToTimeString(slot, totalBookingMinutes) : null;
                                                const label = endHm ? `${slot} - ${endHm}` : slot;
                                                return (
                                                    <button
                                                        key={slot}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedSlot(slot);
                                                            openStepAndScroll(4, step4Ref);
                                                        }}
                                                        className={`min-h-14 rounded-xl flex items-center justify-center px-2 py-2 font-bold text-sm whitespace-nowrap transition-all duration-200 ${
                                                            selectedSlot === slot
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
                                )}
                            </div>
                        </BookingAccordionStep>

                        <BookingAccordionStep
                            id={4}
                            number={isEmployeePreselected ? 3 : 4}
                            title={t('booking_ui.steps.details')}
                            summary={section4Summary}
                            expanded={expandedSection === 4}
                            headerDisabled={
                                selectedServices.length === 0
                                || !selectedEmployee
                                || !selectedDate
                                || !selectedSlot
                            }
                            onHeaderClick={toggleAccordionSection}
                            containerRef={step4Ref}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                                <div className="sm:col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">{t('booking_ui.steps.full_name')}</label>
                                    <input
                                        value={fullName}
                                        onChange={(e) => {
                                            setFullName(sanitizeBookingPlainText(e.target.value, 201));
                                            setClientFieldErrors((prev) => ({ ...prev, client_first_name: undefined, client_last_name: undefined }));
                                        }}
                                        maxLength={201}
                                        autoComplete="name"
                                        className="w-full h-14 px-6 rounded-xl border border-slate-100 bg-transparent focus:ring-2 focus:ring-on-surface/20 transition-all text-base text-on-surface"
                                    />
                                    {(errors.client_first_name || clientFieldErrors.client_first_name) && (
                                        <p className="text-xs text-error mt-1">{errors.client_first_name || clientFieldErrors.client_first_name}</p>
                                    )}
                                    {(errors.client_last_name || clientFieldErrors.client_last_name) && (
                                        <p className="text-xs text-error mt-1">{errors.client_last_name || clientFieldErrors.client_last_name}</p>
                                    )}
                                </div>
                                {identifierType === 'phone' ? (
                                    <div className="sm:col-span-2 space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">{t('booking_ui.steps.phone')}</label>
                                        <input
                                            type="tel"
                                            inputMode="tel"
                                            value={phone}
                                            onChange={(e) => {
                                                setPhone(coercePhoneInput(e.target.value));
                                                setClientFieldErrors((prev) => ({ ...prev, client_phone: undefined }));
                                            }}
                                            maxLength={24}
                                            autoComplete="tel"
                                            className="w-full h-14 px-6 rounded-xl border border-slate-100 bg-transparent focus:ring-2 focus:ring-on-surface/20 transition-all placeholder:text-on-surface/40 text-base text-on-surface"
                                            placeholder="+38349444348"
                                        />
                                        <p className="text-xs text-on-surface-variant">{t('booking_ui.steps.phone_hint')}</p>
                                        {(errors.client_phone || clientFieldErrors.client_phone) && (
                                            <p className="text-xs text-error mt-1">{errors.client_phone || clientFieldErrors.client_phone}</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="sm:col-span-2 space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">{t('booking_ui.steps.email')}</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(sanitizeBookingPlainText(e.target.value, 255));
                                                setClientFieldErrors((prev) => ({ ...prev, client_email: undefined }));
                                            }}
                                            maxLength={255}
                                            autoComplete="email"
                                            className="w-full h-14 px-6 rounded-xl border border-slate-100 bg-transparent focus:ring-2 focus:ring-on-surface/20 transition-all text-base text-on-surface"
                                        />
                                        {(errors.client_email || clientFieldErrors.client_email) && (
                                            <p className="text-xs text-error mt-1">{errors.client_email || clientFieldErrors.client_email}</p>
                                        )}
                                    </div>
                                )}
                                <div className="sm:col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
                                        {t('booking_ui.steps.notes')} <span className="normal-case font-normal">{t('booking_ui.steps.optional')}</span>
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => {
                                            setNotes(sanitizeBookingNotes(e.target.value, 2000));
                                            setClientFieldErrors((prev) => ({ ...prev, client_notes: undefined }));
                                        }}
                                        maxLength={2000}
                                        rows={3}
                                        className="w-full px-6 py-4 rounded-xl border border-slate-100 bg-transparent focus:ring-2 focus:ring-on-surface/20 transition-all text-base text-on-surface resize-none"
                                    />
                                    {(errors.client_notes || clientFieldErrors.client_notes) && (
                                        <p className="text-xs text-error mt-1">{errors.client_notes || clientFieldErrors.client_notes}</p>
                                    )}
                                </div>
                            </div>
                        </BookingAccordionStep>

                    </div>

                    <aside className="lg:col-span-4">
                        <div className="sticky top-28 bg-surface-container-lowest p-8 rounded-2xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] space-y-8">
                            <h3 className="font-headline text-xl font-extrabold tracking-tight text-on-surface">{t('booking_ui.steps.summary_title')}</h3>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0">
                                        <Icon name="design_services" className="text-on-surface-variant" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">{t('booking_ui.steps.summary_services')}</p>
                                        {selectedServices.length > 0 ? (
                                            <ul className="space-y-2">
                                                {selectedServices.map((s) => (
                                                    <li key={s.id}>
                                                        <p className="font-bold text-on-surface">{s.name}</p>
                                                        <p className="text-sm text-on-surface-variant">{s.duration} {t('booking_ui.min_suffix')} • {Number(s.price).toFixed(2)} {currencySymbol}</p>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-outline text-sm">{t('booking_ui.steps.not_selected')}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0">
                                        <Icon name="person" className="text-on-surface-variant" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">{t('booking_ui.steps.summary_professional')}</p>
                                        {selectedEmployee
                                            ? <p className="font-bold text-on-surface">{selectedEmployee.name}</p>
                                            : <p className="text-outline text-sm">{t('booking_ui.steps.not_selected')}</p>
                                        }
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0">
                                        <Icon name="event" className="text-on-surface-variant" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">{t('booking_ui.steps.summary_datetime')}</p>
                                        {selectedDate && selectedSlot
                                            ? (
                                                <div className="space-y-1">
                                                    <p className="font-bold text-on-surface">
                                                        {formatDateLabel(selectedDate, localeBcp47)}
                                                    </p>
                                                    <p className="font-bold text-on-surface whitespace-nowrap">
                                                        {(() => {
                                                            const endHm = totalBookingMinutes > 0 ? addMinutesToTimeString(selectedSlot, totalBookingMinutes) : null;
                                                            return endHm ? `${selectedSlot}–${endHm}` : selectedSlot;
                                                        })()}
                                                    </p>
                                                </div>
                                            )
                                            : <p className="text-outline text-sm">{t('booking_ui.steps.not_selected')}</p>
                                        }
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-surface-container-high">
                                {selectedServices.length > 0 && (
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="font-medium text-on-surface-variant">{t('booking_ui.steps.summary_total')}</span>
                                        <span className="font-headline text-3xl font-extrabold text-on-surface">
                                            {servicesTotalPrice.toFixed(2)} {currencySymbol}
                                        </span>
                                    </div>
                                )}
                                <button
                                    onClick={handleSubmit}
                                    disabled={!canSubmit || submitting}
                                    className="w-full h-16 rounded-xl primary-gradient text-white font-headline font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-black/10"
                                >
                                    {submitting ? t('booking_ui.steps.submitting') : t('booking_ui.steps.confirm')}
                                    {!submitting && <Icon name="arrow_forward" />}
                                </button>
                                <p className="text-center mt-4 text-xs text-on-surface-variant">
                                    {t('booking_ui.steps.terms_note')}
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
