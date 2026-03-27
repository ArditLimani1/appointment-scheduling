import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useMemo, useRef } from 'react';
import Icon from '@/Components/Icon';

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

function formatDateLabel(ds) {
    if (!ds) return null;
    const d = new Date(ds + 'T00:00:00');
    return `${DAY_SHORT[d.getDay()]}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

export default function Index({ employees, services, business, slug }) {
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');

    const lastEmpDateKeyRef = useRef('');

    const dateRange = useMemo(() => buildDateRange(business?.max_booking_window || 30), [business]);

    const availableServices = useMemo(() => {
        if (!selectedEmployee) return services;
        const ids = selectedEmployee.services?.map(s => s.id) || [];
        return ids.length ? services.filter(s => ids.includes(s.id)) : services;
    }, [selectedEmployee, services]);

    useEffect(() => {
        if (!selectedEmployee || !selectedDate) {
            lastEmpDateKeyRef.current = '';
            setSlots([]);
            setSelectedSlot(null);
            return;
        }

        const empDateKey = `${selectedEmployee.id}|${selectedDate}`;
        const employeeOrDateChanged = lastEmpDateKeyRef.current !== empDateKey;
        if (employeeOrDateChanged) {
            lastEmpDateKeyRef.current = empDateKey;
            setSelectedSlot(null);
        }

        setLoadingSlots(true);
        setSlots([]);

        const params = new URLSearchParams({
            employee_id: selectedEmployee.id,
            date: selectedDate,
            ...(selectedService ? { service_id: selectedService.id } : {}),
        });
        fetch(route('booking.slots', { slug }) + '?' + params)
            .then(r => r.json())
            .then((data) => {
                const next = data.slots || [];
                setSlots(next);
                if (!employeeOrDateChanged) {
                    setSelectedSlot((prev) => (prev && next.includes(prev) ? prev : null));
                }
            })
            .catch(() => {
                setSlots([]);
                if (!employeeOrDateChanged) {
                    setSelectedSlot(null);
                }
            })
            .finally(() => setLoadingSlots(false));
    }, [selectedEmployee?.id, selectedDate, selectedService?.id, slug]);

    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '-';

    const canSubmit = selectedEmployee && selectedDate && selectedSlot && selectedService && firstName && phone;

    const progress = [selectedEmployee, selectedDate && selectedSlot, selectedService, firstName && phone].filter(Boolean).length;

    const handleSubmit = () => {
        if (!canSubmit || submitting) return;
        setSubmitting(true);
        router.post(route('booking.store', { slug }), {
            employee_id: selectedEmployee.id,
            service_id: selectedService.id,
            date: selectedDate,
            start_time: selectedSlot,
            client_first_name: firstName,
            client_last_name: lastName,
            client_phone: phone,
            client_notes: notes,
        }, {
            onError: (errs) => { setErrors(errs); setSubmitting(false); },
            onSuccess: () => setSubmitting(false),
        });
    };

    const currencySymbol = business?.currency_symbol ?? '€';

    return (
        <div className="min-h-screen bg-surface font-body">
            <Head title="Book an Appointment" />

            <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-surface-container-highest">
                <div
                    className="bg-on-surface h-full transition-all duration-500"
                    style={{ width: `${(progress / 4) * 100}%` }}
                />
            </div>

            <header className="sticky top-0 z-50 glass-header border-b border-outline-variant/20">
                <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
                    <p className="text-xl font-extrabold tracking-tight text-on-surface font-headline">
                        {business?.name || 'Scheduler'}
                    </p>
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
                    <p className="text-on-surface-variant text-lg max-w-xl">
                        Select your professional, pick a time, choose a service, and confirm your details.
                    </p>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8 space-y-16">

                        <section>
                            <div className="flex items-center gap-3 mb-8">
                                <span className="w-8 h-8 rounded-full bg-on-surface text-surface flex items-center justify-center font-bold text-sm shrink-0">1</span>
                                <h2 className="font-headline text-2xl font-bold tracking-tight">Select Professional</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {employees.map(emp => (
                                    <button
                                        key={emp.id}
                                        onClick={() => { setSelectedEmployee(emp); setSelectedSlot(null); }}
                                        className={`p-6 rounded-xl text-left flex items-center gap-4 transition-all duration-200 ${
                                            selectedEmployee?.id === emp.id
                                                ? 'ring-2 ring-on-surface bg-surface-container-lowest'
                                                : 'bg-surface-container-lowest hover:bg-surface-container-low'
                                        }`}
                                    >
                                        <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-2xl font-bold font-headline shrink-0">
                                            {emp.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-headline font-bold text-lg text-on-surface">{emp.name}</p>
                                            <p className="text-sm text-on-surface-variant">{emp.title || 'Specialist'}</p>
                                            {emp.services?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {emp.services.slice(0, 2).map(s => (
                                                        <span key={s.id} className="text-[10px] font-medium bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant">
                                                            {s.name}
                                                        </span>
                                                    ))}
                                                    {emp.services.length > 2 && (
                                                        <span className="text-[10px] text-on-surface-variant">+{emp.services.length - 2}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {selectedEmployee?.id === emp.id && (
                                            <Icon name="check_circle" size="text-xl" filled className="text-on-surface shrink-0" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center gap-3 mb-8">
                                <span className="w-8 h-8 rounded-full bg-on-surface text-surface flex items-center justify-center font-bold text-sm shrink-0">2</span>
                                <h2 className="font-headline text-2xl font-bold tracking-tight">Date & Time</h2>
                            </div>
                            <div className="bg-surface-container-low p-8 rounded-2xl space-y-8">
                                <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                                    {dateRange.map(d => {
                                        const ds = toDateString(d);
                                        const isSelected = ds === selectedDate;
                                        return (
                                            <button
                                                key={ds}
                                                onClick={() => setSelectedDate(ds)}
                                                className={`shrink-0 w-20 h-24 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                                                    isSelected
                                                        ? 'bg-on-surface text-surface shadow-lg'
                                                        : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-highest'
                                                }`}
                                            >
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{MONTH_SHORT[d.getMonth()]}</span>
                                                <span className="text-2xl font-bold font-headline leading-none">{d.getDate()}</span>
                                                <span className="text-[10px] font-medium">{DAY_SHORT[d.getDay()]}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {!selectedEmployee && (
                                    <p className="text-sm text-on-surface-variant text-center py-4">
                                        Select a professional first to see availability.
                                    </p>
                                )}

                                {selectedEmployee && !selectedDate && (
                                    <p className="text-sm text-on-surface-variant text-center py-4">
                                        Select a date above to see available times.
                                    </p>
                                )}

                                {selectedEmployee && selectedDate && (
                                    loadingSlots ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Icon name="sync" size="text-3xl" className="text-outline animate-spin" />
                                        </div>
                                    ) : slots.length === 0 ? (
                                        <div className="flex flex-col items-center py-8 text-center">
                                            <Icon name="event_busy" size="text-4xl" className="text-outline mb-2" />
                                            <p className="text-sm text-on-surface-variant">No available slots on this date.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                            {slots.map(slot => (
                                                <button
                                                    key={slot}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`h-14 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                                                        selectedSlot === slot
                                                            ? 'bg-on-surface text-surface shadow-md'
                                                            : 'bg-surface-container-lowest text-on-surface hover:bg-on-surface hover:text-surface'
                                                    }`}
                                                >
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                    )
                                )}
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center gap-3 mb-8">
                                <span className="w-8 h-8 rounded-full bg-on-surface text-surface flex items-center justify-center font-bold text-sm shrink-0">3</span>
                                <h2 className="font-headline text-2xl font-bold tracking-tight">Select Service</h2>
                            </div>
                            <div className="space-y-4">
                                {availableServices.map(svc => (
                                    <button
                                        key={svc.id}
                                        onClick={() => setSelectedService(svc)}
                                        className={`w-full p-8 rounded-2xl flex items-center justify-between text-left transition-all duration-200 ${
                                            selectedService?.id === svc.id
                                                ? 'ring-2 ring-on-surface bg-surface-container-lowest'
                                                : 'bg-surface-container-lowest hover:bg-surface-container-low'
                                        }`}
                                    >
                                        <div>
                                            <p className="font-headline font-bold text-xl mb-1 text-on-surface">{svc.name}</p>
                                            <div className="flex items-center gap-4 text-on-surface-variant text-sm font-medium">
                                                <span className="flex items-center gap-1">
                                                    <Icon name="schedule" size="text-sm" /> {svc.duration} min
                                                </span>
                                                <span className="flex items-center gap-1 font-bold text-on-surface">
                                                    <Icon name="payments" size="text-sm" /> {currencySymbol}{Number(svc.price).toFixed(2)}
                                                </span>
                                            </div>
                                            {svc.description && (
                                                <p className="text-xs text-on-surface-variant mt-1.5">{svc.description}</p>
                                            )}
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-6 transition-all ${
                                            selectedService?.id === svc.id
                                                ? 'border-on-surface bg-on-surface'
                                                : 'border-outline-variant group-hover:border-on-surface'
                                        }`}>
                                            {selectedService?.id === svc.id && (
                                                <div className="w-2 h-2 rounded-full bg-surface" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center gap-3 mb-8">
                                <span className="w-8 h-8 rounded-full bg-on-surface text-surface flex items-center justify-center font-bold text-sm shrink-0">4</span>
                                <h2 className="font-headline text-2xl font-bold tracking-tight">Your Details</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="sm:col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Full Name</label>
                                    <input
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        className="w-full h-14 px-6 rounded-xl bg-surface-container-highest border-none focus:ring-2 focus:ring-on-surface/20 transition-all placeholder:text-outline text-sm text-on-surface"
                                        placeholder="e.g. Jane Smith"
                                    />
                                    {errors.client_first_name && <p className="text-xs text-error mt-1">{errors.client_first_name}</p>}
                                </div>
                                <div className="sm:col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="w-full h-14 px-6 rounded-xl bg-surface-container-highest border-none focus:ring-2 focus:ring-on-surface/20 transition-all placeholder:text-outline text-sm text-on-surface"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                    {errors.client_phone && <p className="text-xs text-error mt-1">{errors.client_phone}</p>}
                                </div>
                                <div className="sm:col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
                                        Notes <span className="normal-case font-normal">(optional)</span>
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full px-6 py-4 rounded-xl bg-surface-container-highest border-none focus:ring-2 focus:ring-on-surface/20 transition-all placeholder:text-outline text-sm text-on-surface resize-none"
                                        placeholder="Any special requests or notes..."
                                    />
                                </div>
                            </div>
                        </section>

                    </div>

                    <aside className="lg:col-span-4">
                        <div className="sticky top-28 bg-surface-container-lowest p-8 rounded-2xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] space-y-8">
                            <h3 className="font-headline text-xl font-extrabold tracking-tight text-on-surface">Booking Summary</h3>

                            <div className="space-y-6">
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
                                            ? <p className="font-bold text-on-surface">{formatDateLabel(selectedDate)} • {selectedSlot}</p>
                                            : <p className="text-outline text-sm">Not selected</p>
                                        }
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0">
                                        <Icon name="content_cut" className="text-on-surface-variant" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Service</p>
                                        {selectedService ? (
                                            <>
                                                <p className="font-bold text-on-surface">{selectedService.name}</p>
                                                <p className="text-sm text-on-surface-variant">{selectedService.duration} min • {currencySymbol}{Number(selectedService.price).toFixed(2)}</p>
                                            </>
                                        ) : (
                                            <p className="text-outline text-sm">Not selected</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-surface-container-high">
                                {selectedService && (
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="font-medium text-on-surface-variant">Total Cost</span>
                                        <span className="font-headline text-3xl font-extrabold text-on-surface">
                                            {currencySymbol}{Number(selectedService.price).toFixed(2)}
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
