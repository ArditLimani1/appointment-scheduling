import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Icon from '@/Components/Icon';

const STEPS = ['Provider', 'Service', 'Date & Time', 'Your Details'];

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildCalendarDays(year, month) {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1; // Mon-based
    const days = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(d);
    return days;
}

function toDateString(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ─── Step components ─────────────────────────────────────────────────────────

function StepProvider({ employees, selected, onSelect }) {
    return (
        <div>
            <h2 className="text-2xl font-black font-headline text-on-surface mb-1">Choose Your Provider</h2>
            <p className="text-sm text-on-surface-variant mb-6">Select the team member you'd like to book with.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {employees.map(emp => (
                    <button
                        key={emp.id}
                        onClick={() => onSelect(emp)}
                        className={`rounded-3xl border p-5 text-left transition-all hover:scale-[1.01] ${
                            selected?.id === emp.id
                                ? 'border-primary bg-primary-container/20 ring-2 ring-primary'
                                : 'border-outline-variant bg-surface-container-lowest hover:border-primary/50'
                        }`}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-on-primary-container text-lg font-bold font-headline">
                                {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold font-headline text-on-surface">{emp.name}</p>
                                <p className="text-xs text-on-surface-variant">{emp.title || 'Specialist'}</p>
                            </div>
                            {selected?.id === emp.id && (
                                <Icon name="check_circle" size="text-xl" filled className="ml-auto text-primary" />
                            )}
                        </div>
                        {emp.services?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {emp.services.slice(0, 3).map(s => (
                                    <span key={s.id} className="rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-medium text-on-secondary-container">
                                        {s.name}
                                    </span>
                                ))}
                                {emp.services.length > 3 && (
                                    <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] text-on-surface-variant">
                                        +{emp.services.length - 3} more
                                    </span>
                                )}
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

function StepService({ employee, services, selected, onSelect }) {
    const available = employee?.services?.length
        ? services.filter(s => employee.services.some(es => es.id === s.id))
        : services;

    return (
        <div>
            <h2 className="text-2xl font-black font-headline text-on-surface mb-1">Select a Service</h2>
            <p className="text-sm text-on-surface-variant mb-6">
                {employee ? `Services offered by ${employee.name}.` : 'Choose what you need.'}
            </p>
            {available.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                    <Icon name="content_cut" size="text-4xl" className="text-outline mb-3" />
                    <p className="text-on-surface-variant">No services available for this provider.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {available.map(svc => (
                        <button
                            key={svc.id}
                            onClick={() => onSelect(svc)}
                            className={`rounded-3xl border p-5 text-left transition-all hover:scale-[1.01] ${
                                selected?.id === svc.id
                                    ? 'border-primary bg-primary-container/20 ring-2 ring-primary'
                                    : 'border-outline-variant bg-surface-container-lowest hover:border-primary/50'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-container-low">
                                    <Icon name={svc.icon || 'content_cut'} size="text-xl" className="text-on-surface-variant" />
                                </div>
                                {svc.is_popular && (
                                    <span className="rounded-full bg-primary-container px-2 py-0.5 text-[10px] font-bold text-on-primary-container uppercase tracking-wide">
                                        Popular
                                    </span>
                                )}
                                {selected?.id === svc.id && (
                                    <Icon name="check_circle" size="text-xl" filled className="text-primary" />
                                )}
                            </div>
                            <p className="font-bold font-headline text-on-surface">{svc.name}</p>
                            {svc.description && (
                                <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{svc.description}</p>
                            )}
                            <div className="mt-3 flex items-center justify-between">
                                <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                                    <Icon name="schedule" size="text-sm" />{svc.duration} min
                                </span>
                                <span className="font-black font-headline text-on-surface">{business?.currency_symbol ?? '€'}{Number(svc.price).toFixed(2)}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function StepDateTime({ employee, service, settings, selectedDate, onDateSelect, selectedSlot, onSlotSelect }) {
    const today = new Date();
    const [calYear, setCalYear] = useState(today.getFullYear());
    const [calMonth, setCalMonth] = useState(today.getMonth());
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + (settings?.max_booking_window || 30));

    const calDays = buildCalendarDays(calYear, calMonth);
    const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    const prevMonth = () => {
        if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
        else setCalMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
        else setCalMonth(m => m + 1);
    };

    const isDayDisabled = (day) => {
        if (!day) return true;
        const d = new Date(calYear, calMonth, day);
        const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return d < todayMid || d > maxDate;
    };

    const handleDayClick = (day) => {
        if (isDayDisabled(day)) return;
        const ds = toDateString(calYear, calMonth, day);
        onDateSelect(ds);
    };

    useEffect(() => {
        if (!selectedDate || !employee) return;
        setLoadingSlots(true);
        setSlots([]);
        onSlotSelect(null);
        const params = new URLSearchParams({
            employee_id: employee.id,
            date: selectedDate,
            ...(service ? { service_id: service.id } : {}),
        });
        fetch(route('booking.slots', { slug }) + '?' + params)
            .then(r => r.json())
            .then(data => { setSlots(data.slots || []); })
            .catch(() => setSlots([]))
            .finally(() => setLoadingSlots(false));
    }, [selectedDate, employee?.id, service?.id]);

    return (
        <div>
            <h2 className="text-2xl font-black font-headline text-on-surface mb-1">Pick a Date & Time</h2>
            <p className="text-sm text-on-surface-variant mb-6">Select an available slot that works for you.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calendar */}
                <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant p-5">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={prevMonth} className="rounded-xl p-2 text-on-surface-variant hover:bg-surface-container-low transition-colors">
                            <Icon name="chevron_left" size="text-xl" />
                        </button>
                        <span className="font-bold font-headline text-on-surface">
                            {MONTH_NAMES[calMonth]} {calYear}
                        </span>
                        <button onClick={nextMonth} className="rounded-xl p-2 text-on-surface-variant hover:bg-surface-container-low transition-colors">
                            <Icon name="chevron_right" size="text-xl" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 mb-2">
                        {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
                            <div key={d} className="text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant py-1">
                                {d}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {calDays.map((day, i) => {
                            if (!day) return <div key={`pad-${i}`} />;
                            const ds = toDateString(calYear, calMonth, day);
                            const isSelected = ds === selectedDate;
                            const disabled = isDayDisabled(day);
                            return (
                                <button
                                    key={ds}
                                    onClick={() => handleDayClick(day)}
                                    disabled={disabled}
                                    className={`aspect-square rounded-xl text-sm font-medium transition-all ${
                                        isSelected
                                            ? 'bg-on-surface text-surface font-bold'
                                            : disabled
                                            ? 'text-outline cursor-not-allowed'
                                            : 'text-on-surface hover:bg-surface-container-low'
                                    }`}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Time slots */}
                <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant p-5">
                    <p className="text-sm font-semibold text-on-surface-variant mb-3">
                        {selectedDate
                            ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
                            : 'Select a date first'}
                    </p>

                    {!selectedDate ? (
                        <div className="flex flex-col items-center py-12 text-center">
                            <Icon name="calendar_month" size="text-4xl" className="text-outline mb-3" />
                            <p className="text-sm text-on-surface-variant">Choose a date to see available times</p>
                        </div>
                    ) : loadingSlots ? (
                        <div className="flex flex-col items-center py-12">
                            <Icon name="sync" size="text-3xl" className="text-outline mb-2 animate-spin" />
                            <p className="text-sm text-on-surface-variant">Loading slots...</p>
                        </div>
                    ) : slots.length === 0 ? (
                        <div className="flex flex-col items-center py-12 text-center">
                            <Icon name="event_busy" size="text-4xl" className="text-outline mb-3" />
                            <p className="text-sm text-on-surface-variant">No available slots on this date.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto hide-scrollbar">
                            {slots.map(slot => (
                                <button
                                    key={slot}
                                    onClick={() => onSlotSelect(slot)}
                                    className={`rounded-xl py-2.5 text-sm font-semibold transition-all ${
                                        selectedSlot === slot
                                            ? 'bg-on-surface text-surface'
                                            : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                                    }`}
                                >
                                    {slot}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StepDetails({ form, onChange, errors }) {
    const inputClass = "w-full rounded-xl border-0 bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-surface-tint";
    return (
        <div>
            <h2 className="text-2xl font-black font-headline text-on-surface mb-1">Your Details</h2>
            <p className="text-sm text-on-surface-variant mb-6">Almost there! Just fill in your contact info.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1">First Name</label>
                    <input value={form.client_first_name} onChange={e => onChange('client_first_name', e.target.value)} className={inputClass} placeholder="Jane" />
                    {errors.client_first_name && <p className="text-xs text-error mt-1">{errors.client_first_name}</p>}
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Last Name</label>
                    <input value={form.client_last_name} onChange={e => onChange('client_last_name', e.target.value)} className={inputClass} placeholder="Doe" />
                    {errors.client_last_name && <p className="text-xs text-error mt-1">{errors.client_last_name}</p>}
                </div>
                <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Phone Number</label>
                    <input value={form.client_phone} onChange={e => onChange('client_phone', e.target.value)} className={inputClass} placeholder="+1 555 000 0000" />
                    {errors.client_phone && <p className="text-xs text-error mt-1">{errors.client_phone}</p>}
                </div>
                <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Notes <span className="normal-case font-normal">(optional)</span></label>
                    <textarea value={form.client_notes} onChange={e => onChange('client_notes', e.target.value)} rows={3} className={`${inputClass} resize-none`} placeholder="Any requests or special notes..." />
                </div>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Index({ employees, services, business, slug }) {
    const settings = business;
    const [step, setStep] = useState(0);
    const [employee, setEmployee] = useState(null);
    const [service, setService] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [form, setForm] = useState({
        client_first_name: '',
        client_last_name: '',
        client_phone: '',
        client_notes: '',
    });

    const canNext = () => {
        if (step === 0) return !!employee;
        if (step === 1) return !!service;
        if (step === 2) return !!selectedDate && !!selectedSlot;
        if (step === 3) return form.client_first_name && form.client_last_name && form.client_phone;
        return false;
    };

    const handleNext = () => {
        if (canNext() && step < 3) setStep(s => s + 1);
    };

    const handleSubmit = () => {
        setSubmitting(true);
        router.post(route('booking.store', { slug }), {
            employee_id: employee.id,
            service_id: service.id,
            date: selectedDate,
            start_time: selectedSlot,
            ...form,
        }, {
            onError: (errs) => { setErrors(errs); setSubmitting(false); },
            onSuccess: () => setSubmitting(false),
        });
    };

    return (
        <div className="min-h-screen bg-surface font-body">
            <Head title="Book an Appointment" />

            {/* Header */}
            <header className="glass-header sticky top-0 z-30 border-b border-outline-variant px-4 py-4 sm:px-6">
                <div className="mx-auto max-w-3xl flex items-center justify-between">
                    <div>
                        <p className="text-lg font-black font-headline text-on-surface tracking-tight">
                            {settings?.business_name || 'Stratos Scheduler'}
                        </p>
                        <p className="text-xs text-on-surface-variant">Book your appointment</p>
                    </div>
                    <a href="/" className="rounded-xl border border-outline-variant px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors">
                        Home
                    </a>
                </div>
            </header>

            <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
                {/* Progress steps */}
                <div className="mb-8">
                    <div className="flex items-center gap-1 sm:gap-2">
                        {STEPS.map((label, i) => (
                            <div key={i} className="flex items-center flex-1">
                                <button
                                    onClick={() => i < step && setStep(i)}
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                                        i < step
                                            ? 'bg-on-surface text-surface cursor-pointer'
                                            : i === step
                                            ? 'bg-primary text-on-primary'
                                            : 'bg-surface-container-high text-on-surface-variant'
                                    }`}
                                >
                                    {i < step ? <Icon name="check" size="text-sm" /> : i + 1}
                                </button>
                                <span className={`hidden sm:block ml-2 text-xs font-medium whitespace-nowrap ${i === step ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                                    {label}
                                </span>
                                {i < STEPS.length - 1 && (
                                    <div className={`flex-1 mx-2 h-px ${i < step ? 'bg-on-surface' : 'bg-outline-variant'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Booking summary bar (steps 1+) */}
                {step > 0 && (
                    <div className="mb-6 flex flex-wrap gap-2">
                        {employee && (
                            <div className="flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1.5 text-xs font-medium text-on-surface">
                                <Icon name="person" size="text-sm" className="text-on-surface-variant" />
                                {employee.name}
                            </div>
                        )}
                        {service && (
                            <div className="flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1.5 text-xs font-medium text-on-surface">
                                <Icon name="content_cut" size="text-sm" className="text-on-surface-variant" />
                                {service.name} · {business?.currency_symbol ?? '€'}{Number(service.price).toFixed(2)}
                            </div>
                        )}
                        {selectedDate && selectedSlot && (
                            <div className="flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1.5 text-xs font-medium text-on-surface">
                                <Icon name="schedule" size="text-sm" className="text-on-surface-variant" />
                                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {selectedSlot}
                            </div>
                        )}
                    </div>
                )}

                {/* Step content */}
                <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant p-6 mb-6">
                    {step === 0 && (
                        <StepProvider employees={employees} selected={employee} onSelect={e => { setEmployee(e); setService(null); }} />
                    )}
                    {step === 1 && (
                        <StepService employee={employee} services={services} selected={service} onSelect={setService} />
                    )}
                    {step === 2 && (
                        <StepDateTime
                            employee={employee}
                            service={service}
                            settings={settings}
                            selectedDate={selectedDate}
                            onDateSelect={setSelectedDate}
                            selectedSlot={selectedSlot}
                            onSlotSelect={setSelectedSlot}
                        />
                    )}
                    {step === 3 && (
                        <StepDetails form={form} onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))} errors={errors} />
                    )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between gap-4">
                    <button
                        onClick={() => setStep(s => s - 1)}
                        disabled={step === 0}
                        className="flex items-center gap-2 rounded-2xl border border-outline-variant px-5 py-3 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Icon name="arrow_back" size="text-lg" /> Back
                    </button>

                    {step < 3 ? (
                        <button
                            onClick={handleNext}
                            disabled={!canNext()}
                            className="primary-gradient flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Continue <Icon name="arrow_forward" size="text-lg" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!canNext() || submitting}
                            className="primary-gradient flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Booking...' : 'Confirm Booking'}
                            <Icon name="check_circle" size="text-lg" />
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}
