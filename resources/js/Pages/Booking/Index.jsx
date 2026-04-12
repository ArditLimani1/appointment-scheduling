import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Icon from '@/Components/Icon';
import DatePicker from '@/Components/DatePicker';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateString(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildDateRange(maxWindow) {
    const days = [];
    const today = new Date();
    for (let i = 0; i <= (maxWindow || 30); i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        days.push(d);
    }
    return days;
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

function formatDateLabel(ds) {
    if (!ds) return null;
    const d = new Date(ds + 'T00:00:00');
    return `${DAY_SHORT[d.getDay()]}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
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

function BookingAccordionStep({
    id,
    number,
    title,
    summary,
    expanded,
    onHeaderClick,
    headerDisabled,
    children,
}) {
    return (
        <div
            className={`rounded-2xl border transition-shadow ${
                expanded
                    ? 'border-outline-variant shadow-sm bg-surface-container-lowest overflow-visible'
                    : 'border-outline-variant/50 bg-surface-container-lowest/70 overflow-hidden'
            }`}
        >
            <button
                type="button"
                aria-expanded={expanded}
                disabled={headerDisabled}
                onClick={() => {
                    if (!headerDisabled) {
                        onHeaderClick(id);
                    }
                }}
                className={`w-full flex items-center gap-4 px-5 py-4 sm:px-6 sm:py-5 text-left min-h-[4.5rem] ${
                    headerDisabled ? 'opacity-45 cursor-not-allowed' : 'hover:bg-surface-container-low/50'
                }`}
            >
                <span className="w-9 h-9 rounded-full bg-on-surface text-surface flex items-center justify-center font-bold text-sm shrink-0">
                    {number}
                </span>
                <div className="flex-1 min-w-0">
                    <h2 className="font-headline text-lg sm:text-xl font-bold tracking-tight text-on-surface">{title}</h2>
                    {!expanded && summary ? (
                        <p className="text-sm text-on-surface-variant mt-1 truncate">{summary}</p>
                    ) : null}
                </div>
                <Icon
                    name={expanded ? 'expand_less' : 'expand_more'}
                    className={headerDisabled ? 'text-outline shrink-0' : 'text-on-surface-variant shrink-0'}
                    size="text-2xl"
                />
            </button>
            {expanded ? (
                <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-1 border-t border-outline-variant/25">
                    {children}
                </div>
            ) : null}
        </div>
    );
}

export default function Index({ employees, services, business, slug, preselected_employee_id = null }) {
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
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');
    const [expandedSection, setExpandedSection] = useState(1);
    const isEmployeePreselected = !!preselected_employee_id && !!preselectedEmployee;

    const toggleAccordionSection = useCallback((id) => {
        setExpandedSection((current) => (current === id ? null : id));
    }, []);

    const identifierType = business?.client_identifier_type ?? 'phone';
    const identifierValue = identifierType === 'email' ? email : phone;

    const prevEmployeeDateKeyRef = useRef('');

    const fullDateRange = useMemo(
        () => buildDateRange(business?.max_booking_window || 30),
        [business?.max_booking_window]
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

    const selectedDateIsBookable = useMemo(() => {
        if (!selectedDate || bookableDates.length === 0) {
            return true;
        }
        return bookableDates.some((d) => toDateString(d) === selectedDate);
    }, [selectedDate, bookableDates]);

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
        setSelectedEmployee(null);
        setSelectedDate(null);
        setSelectedSlot(null);
        setSlots([]);
        setSlotsError(null);
        prevEmployeeDateKeyRef.current = '';
    }, [selectedServices.length]);

    useEffect(() => {
        if (!selectedEmployee || !selectedDate) {
            prevEmployeeDateKeyRef.current = '';
            setSlots([]);
            setSlotsError(null);
            setSelectedSlot(null);
            return;
        }

        const dateAllowed = bookableDates.length === 0
            || bookableDates.some((d) => toDateString(d) === selectedDate);
        if (!dateAllowed) {
            prevEmployeeDateKeyRef.current = '';
            setSlots([]);
            setSlotsError(null);
            setSelectedSlot(null);
            setLoadingSlots(false);
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
                        || 'Could not load available times.';
                    throw new Error(msg);
                }
                return response.json();
            })
            .then((responseData) => {
                const availableSlots = responseData.slots || [];
                setSlots(availableSlots);
                if (!employeeOrDateChanged) {
                    setSelectedSlot((prev) => (prev && availableSlots.includes(prev) ? prev : null));
                }
            })
            .catch((err) => {
                setSlots([]);
                setSlotsError(err.message || 'Could not load available times.');
                if (!employeeOrDateChanged) {
                    setSelectedSlot(null);
                }
            })
            .finally(() => setLoadingSlots(false));
    }, [selectedEmployee?.id, selectedDate, selectedServiceIdsKey, slug, bookableDates]);

    useEffect(() => {
        if (!selectedEmployee) {
            return;
        }
        if (bookableDates.length === 0) {
            setSelectedDate(null);
            setSelectedSlot(null);
            return;
        }
        if (!selectedDate) {
            setSelectedDate(toDateString(bookableDates[0]));
            setSelectedSlot(null);
        }
    }, [selectedEmployee?.id, bookableDates, selectedDate]);

    const { firstName, lastName } = useMemo(() => {
        const parts = fullName.trim().split(' ');
        return {
            firstName: parts[0] || '',
            lastName: parts.slice(1).join(' ') || '-',
        };
    }, [fullName]);

    const canSubmit = selectedServices.length > 0 && selectedEmployee && selectedDate && selectedSlot && firstName && identifierValue;

    const totalSteps = isEmployeePreselected ? 3 : 4;
    const progress = [selectedServices.length > 0, selectedEmployee, selectedDate && selectedSlot, firstName && identifierValue].filter(Boolean).length;

    const handleSubmit = () => {
        if (!canSubmit || submitting) return;
        setSubmitting(true);
        router.post(route('booking.store', { slug }), {
            employee_id: selectedEmployee.id,
            service_ids: selectedServices.map((s) => s.id),
            date: selectedDate,
            start_time: selectedSlot,
            client_first_name: firstName,
            client_last_name: lastName,
            ...(identifierType === 'phone' ? { client_phone: phone } : { client_email: email }),
            client_notes: notes,
        }, {
            onError: (errs) => { setErrors(errs); setSubmitting(false); },
            onSuccess: () => setSubmitting(false),
        });
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
        return `${selectedServices.length} services · ${servicesTotalPrice.toFixed(2)} ${currencySymbol}`;
    }, [selectedServices, servicesTotalPrice, currencySymbol]);
    const section2Summary = selectedEmployee?.name ?? null;
    const section3Summary = useMemo(() => {
        if (!selectedDate) return null;
        if (!selectedSlot) {
            return `${formatDateLabel(selectedDate)} — pick a time`;
        }
        const endHm = totalBookingMinutes > 0 ? addMinutesToTimeString(selectedSlot, totalBookingMinutes) : null;
        return endHm
            ? `${formatDateLabel(selectedDate)} · ${selectedSlot}–${endHm}`
            : `${formatDateLabel(selectedDate)} · ${selectedSlot}`;
    }, [selectedDate, selectedSlot, totalBookingMinutes]);
    const section4Summary =
        firstName.trim() && identifierValue.trim()
            ? `${firstName.trim()} · ${identifierValue.trim()}`
            : null;

    return (
        <div className="min-h-screen bg-surface font-body">
            <Head title="Book an Appointment" />

            <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-surface-container-highest">
                <div
                    className="bg-on-surface h-full transition-all duration-500"
                    style={{ width: `${(progress / totalSteps) * 100}%` }}
                />
            </div>

            <header className="sticky top-0 z-50 glass-header border-b border-outline-variant/20">
                <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3 min-w-0">
                        {businessLogoUrl ? (
                            <img
                                src={businessLogoUrl}
                                alt={`${business?.name || 'Business'} logo`}
                                className="h-11 w-11 rounded-2xl object-cover border border-outline-variant/30 bg-surface-container-low"
                            />
                        ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container">
                                <Icon name="storefront" size="text-xl" />
                            </div>
                        )}
                        <p className="text-xl font-extrabold tracking-tight text-on-surface font-headline truncate">
                            {business?.name || 'Scheduler'}
                        </p>
                    </div>
                    <a
                        href="/"
                        className="rounded-xl border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
                    >
                        Home
                    </a>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12 pb-32">
                <section className="mb-16">
                    <h1 className="font-headline text-5xl font-extrabold tracking-tight mb-4 text-on-surface">New Appointment</h1>
                    {isEmployeePreselected ? (
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-on-primary-container text-base font-bold font-headline shrink-0">
                                {preselectedEmployee.name.charAt(0).toUpperCase()}
                            </div>
                            <p className="text-on-surface-variant text-lg">
                                Booking with <span className="font-semibold text-on-surface">{preselectedEmployee.name}</span>
                                {preselectedEmployee.title ? ` · ${preselectedEmployee.title}` : ''}
                            </p>
                        </div>
                    ) : (
                        <p className="text-on-surface-variant text-lg max-w-xl">
                            Choose one or more services, pick a professional who offers them all, select a time, and confirm your details.
                        </p>
                    )}
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8 space-y-3">

                        <BookingAccordionStep
                            id={1}
                            number={1}
                            title="Select Services"
                            summary={section1Summary}
                            expanded={expandedSection === 1}
                            headerDisabled={false}
                            onHeaderClick={toggleAccordionSection}
                        >
                            <div className="space-y-4 pt-2">
                                <p className="text-sm text-on-surface-variant">
                                    Select every service you want in this visit. Only professionals who offer all of them will appear next.
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
                                                        <Icon name="schedule" size="text-sm" /> {svc.duration} min
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
                                        onClick={() => setExpandedSection(isEmployeePreselected ? 3 : 2)}
                                        className="w-full h-14 rounded-xl bg-on-surface text-surface font-headline font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                    >
                                        Continue
                                        <span className="font-medium opacity-90">
                                            ({selectedServices.length} service{selectedServices.length > 1 ? 's' : ''})
                                        </span>
                                    </button>
                                )}
                            </div>
                        </BookingAccordionStep>

                        {!isEmployeePreselected && (
                        <BookingAccordionStep
                            id={2}
                            number={2}
                            title="Select Professional"
                            summary={section2Summary}
                            expanded={expandedSection === 2}
                            headerDisabled={selectedServices.length === 0}
                            onHeaderClick={toggleAccordionSection}
                        >
                            <div className="pt-2 space-y-4">
                                {selectedServices.length > 0 && employeesForSelectedServices.length === 0 && (
                                    <p className="text-sm text-on-surface-variant">
                                        No professional offers all selected services together. Change your selection or contact the business.
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
                                                setExpandedSection(3);
                                            }}
                                            className={`p-6 rounded-xl text-left flex items-center gap-4 transition-all duration-200 ${
                                                selectedEmployee?.id === emp.id
                                                    ? 'ring-2 ring-on-surface bg-surface-container-low'
                                                    : 'bg-surface-container-low hover:bg-surface-container-high'
                                            }`}
                                        >
                                            <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-2xl font-bold font-headline shrink-0">
                                                {emp.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-headline font-bold text-lg text-on-surface">{emp.name}</p>
                                                <p className="text-sm text-on-surface-variant">{emp.title || 'Specialist'}</p>
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
                            title="Date & Time"
                            summary={section3Summary}
                            expanded={expandedSection === 3}
                            headerDisabled={selectedServices.length === 0 || !selectedEmployee}
                            onHeaderClick={toggleAccordionSection}
                        >
                            <div className="bg-surface-container-low p-6 sm:p-8 rounded-2xl space-y-8 mt-2">
                                {selectedServices.length > 0 && selectedEmployee && bookableDates.length > 0 && (
                                    <div className="rounded-2xl bg-surface-container-lowest p-4 ring-1 ring-slate-100 shadow-sm">
                                        <div className="flex flex-wrap gap-3 items-end">
                                            <DatePicker
                                                label="Date"
                                                value={selectedDate ?? ''}
                                                onChange={(value) => {
                                                    setSelectedDate(value || null);
                                                    setSelectedSlot(null);
                                                }}
                                                placeholder="Select a date"
                                            />
                                        </div>
                                        {selectedDate && !selectedDateIsBookable ? (
                                            <p className="mt-3 text-sm text-on-surface-variant">
                                                This professional is not available on that weekday. Choose another date.
                                            </p>
                                        ) : null}
                                    </div>
                                )}

                                {selectedServices.length > 0 && selectedEmployee && bookableDates.length === 0 && (
                                    <p className="text-sm text-on-surface-variant text-center py-4">
                                        No bookable days in this period for this professional. They may need to set working days in their schedule.
                                    </p>
                                )}

                                {selectedServices.length > 0 && selectedEmployee && selectedDate && selectedDateIsBookable && (
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
                                            <p className="text-sm text-on-surface-variant">No available slots on this date.</p>
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
                                                            setExpandedSection(4);
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
                            title="Your Details"
                            summary={section4Summary}
                            expanded={expandedSection === 4}
                            headerDisabled={
                                selectedServices.length === 0
                                || !selectedEmployee
                                || !selectedDate
                                || !selectedSlot
                            }
                            onHeaderClick={toggleAccordionSection}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                                <div className="sm:col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Full Name</label>
                                    <input
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        className="w-full h-14 px-6 rounded-xl border border-slate-100 bg-transparent focus:ring-2 focus:ring-on-surface/20 transition-all text-sm text-on-surface"
                                    />
                                    {errors.client_first_name && <p className="text-xs text-error mt-1">{errors.client_first_name}</p>}
                                </div>
                                {identifierType === 'phone' ? (
                                    <div className="sm:col-span-2 space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            className="w-full h-14 px-6 rounded-xl border border-slate-100 bg-transparent focus:ring-2 focus:ring-on-surface/20 transition-all placeholder:text-on-surface/40 text-sm text-on-surface"
                                            placeholder="+38349444348"
                                        />
                                        {errors.client_phone && <p className="text-xs text-error mt-1">{errors.client_phone}</p>}
                                    </div>
                                ) : (
                                    <div className="sm:col-span-2 space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="w-full h-14 px-6 rounded-xl border border-slate-100 bg-transparent focus:ring-2 focus:ring-on-surface/20 transition-all text-sm text-on-surface"
                                        />
                                        {errors.client_email && <p className="text-xs text-error mt-1">{errors.client_email}</p>}
                                    </div>
                                )}
                                <div className="sm:col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
                                        Notes <span className="normal-case font-normal">(optional)</span>
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full px-6 py-4 rounded-xl border border-slate-100 bg-transparent focus:ring-2 focus:ring-on-surface/20 transition-all text-sm text-on-surface resize-none"
                                    />
                                </div>
                            </div>
                        </BookingAccordionStep>

                    </div>

                    <aside className="lg:col-span-4">
                        <div className="sticky top-28 bg-surface-container-lowest p-8 rounded-2xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] space-y-8">
                            <h3 className="font-headline text-xl font-extrabold tracking-tight text-on-surface">Booking Summary</h3>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0">
                                        <Icon name="content_cut" className="text-on-surface-variant" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Services</p>
                                        {selectedServices.length > 0 ? (
                                            <ul className="space-y-2">
                                                {selectedServices.map((s) => (
                                                    <li key={s.id}>
                                                        <p className="font-bold text-on-surface">{s.name}</p>
                                                        <p className="text-sm text-on-surface-variant">{s.duration} min • {Number(s.price).toFixed(2)} {currencySymbol}</p>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-outline text-sm">Not selected</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0">
                                        <Icon name="person" className="text-on-surface-variant" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Professional</p>
                                        {selectedEmployee
                                            ? <p className="font-bold text-on-surface">{selectedEmployee.name}</p>
                                            : <p className="text-outline text-sm">Not selected</p>
                                        }
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0">
                                        <Icon name="event" className="text-on-surface-variant" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Date & Time</p>
                                        {selectedDate && selectedSlot
                                            ? (
                                                <p className="font-bold text-on-surface">
                                                    {formatDateLabel(selectedDate)}
                                                    {' · '}
                                                    {(() => {
                                                        const endHm = totalBookingMinutes > 0 ? addMinutesToTimeString(selectedSlot, totalBookingMinutes) : null;
                                                        return endHm ? `${selectedSlot}–${endHm}` : selectedSlot;
                                                    })()}
                                                </p>
                                            )
                                            : <p className="text-outline text-sm">Not selected</p>
                                        }
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-surface-container-high">
                                {selectedServices.length > 0 && (
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="font-medium text-on-surface-variant">Total Cost</span>
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
                                    {submitting ? 'Confirming...' : 'Confirm Booking'}
                                    {!submitting && <Icon name="arrow_forward" />}
                                </button>
                                <p className="text-center mt-4 text-xs text-on-surface-variant">
                                    By confirming, you agree to our Terms of Service.
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
