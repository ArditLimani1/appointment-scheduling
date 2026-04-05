import { useEffect, useMemo, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import Icon from '@/Components/Icon';
import DatePicker from '@/Components/DatePicker';

function toDateString(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function EditAppointmentModal({ appointment, employees, services, onClose }) {
    // Derive identifier type from the appointment's own stored data, not the business setting.
    // If the appointment was booked with an email → show email. Otherwise → show phone.
    const identifierType = (appointment.client_email && appointment.client_email.trim()) ? 'email' : 'phone';
    const today = toDateString(new Date());
    const isPast = appointment.date < today;

    const [form, setForm] = useState({
        client_first_name: appointment.client_first_name ?? '',
        client_last_name:  appointment.client_last_name ?? '',
        client_phone:      appointment.client_phone ?? '',
        client_email:      appointment.client_email ?? '',
        client_notes:      appointment.client_notes ?? '',
        service_id:        String(appointment.service_id ?? ''),
        employee_id:       String(appointment.employee_id ?? ''),
        date:              appointment.date ?? today,
        start_time:        appointment.start_time ? appointment.start_time.slice(0, 5) : '',
    });

    const [slots, setSlots]               = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [errors, setErrors]             = useState({});
    const [submitting, setSubmitting]     = useState(false);
    const prevKeyRef                      = useRef('');

    const patch = (field, value) => setForm((f) => ({ ...f, [field]: value }));

    // Employees who can do the selected service
    const eligibleEmployees = useMemo(() => {
        if (!form.service_id) return employees;
        const sid = Number(form.service_id);
        return employees.filter((e) => e.service_ids.includes(sid));
    }, [employees, form.service_id]);

    // Reset employee if no longer eligible after service change
    useEffect(() => {
        const eligible = eligibleEmployees.some((e) => String(e.id) === form.employee_id);
        if (!eligible && eligibleEmployees.length > 0) {
            patch('employee_id', String(eligibleEmployees[0].id));
        }
    }, [eligibleEmployees]);

    // Fetch slots whenever employee + date + service are all set
    useEffect(() => {
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
    }, [form.employee_id, form.date, form.service_id]);

    // Keep current slot selected if it's still available after re-fetch
    useEffect(() => {
        if (slots.length && !slots.includes(form.start_time)) {
            patch('start_time', '');
        }
    }, [slots]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        router.put(
            route('admin.appointments.edit', appointment.id),
            {
                client_first_name: form.client_first_name,
                client_last_name:  form.client_last_name,
                // Send the editable identifier; keep the other field from original data
                client_phone:      identifierType === 'phone' ? form.client_phone : (appointment.client_phone ?? null),
                client_email:      identifierType === 'email' ? form.client_email : (appointment.client_email ?? null),
                client_notes:      form.client_notes,
                service_id:        Number(form.service_id),
                employee_id:       Number(form.employee_id),
                date:              form.date,
                start_time:        form.start_time,
            },
            {
                onError:   (errs) => { setErrors(errs); setSubmitting(false); },
                onSuccess: () => { setSubmitting(false); onClose(); },
            }
        );
    };

    const labelCls = 'block text-[10px] font-bold uppercase tracking-widest text-outline mb-1.5';
    const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-on-surface/10';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">

                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-extrabold font-headline text-on-surface">Edit Appointment</h2>
                        <p className="text-xs text-on-surface-variant mt-0.5">#{appointment.id} · {appointment.date}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                        <Icon name="close" size="text-xl" className="text-on-surface-variant" />
                    </button>
                </div>

                {/* Past-date warning */}
                {isPast && (
                    <div className="mx-6 mt-5 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                        <Icon name="warning" size="text-lg" className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">
                            <span className="font-bold">This appointment is in the past.</span> Are you sure you want to modify it?
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">

                    {/* Client details */}
                    <section>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-outline mb-4">Client Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    </section>

                    {/* Service */}
                    <section>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-outline mb-4">Service</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className={labelCls}>Service</label>
                                <select
                                    value={form.service_id}
                                    onChange={(e) => { patch('service_id', e.target.value); patch('start_time', ''); }}
                                    className={inputCls}
                                    required
                                >
                                    <option value="">Select a service</option>
                                    {services.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>
                                    ))}
                                </select>
                                {errors.service_id && <p className="text-xs text-error mt-1">{errors.service_id}</p>}
                            </div>
                        </div>
                    </section>

                    {/* Employee + Date + Time */}
                    <section>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-outline mb-4">Schedule</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            <div className="sm:col-span-2">
                                <label className={labelCls}>Employee</label>
                                <select
                                    value={form.employee_id}
                                    onChange={(e) => { patch('employee_id', e.target.value); patch('start_time', ''); }}
                                    className={inputCls}
                                    required
                                >
                                    <option value="">Select employee</option>
                                    {eligibleEmployees.map((e) => (
                                        <option key={e.id} value={e.id}>{e.name}</option>
                                    ))}
                                </select>
                                {errors.employee_id && <p className="text-xs text-error mt-1">{errors.employee_id}</p>}
                                {form.service_id && eligibleEmployees.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1">No employee offers this service.</p>
                                )}
                            </div>

                            <div>
                                <label className={labelCls}>Date</label>
                                <DatePicker
                                    value={form.date}
                                    onChange={(v) => { patch('date', v || today); patch('start_time', ''); }}
                                    placeholder="Pick a date"
                                />
                                {errors.date && <p className="text-xs text-error mt-1">{errors.date}</p>}
                            </div>

                            <div>
                                <label className={labelCls}>Time Slot</label>
                                {(!form.employee_id || !form.date || !form.service_id) ? (
                                    <p className="text-sm text-on-surface-variant py-2">Select employee, date &amp; service first.</p>
                                ) : loadingSlots ? (
                                    <div className="flex items-center gap-2 py-2 text-sm text-on-surface-variant">
                                        <Icon name="sync" size="text-base" className="animate-spin" /> Loading slots…
                                    </div>
                                ) : slots.length === 0 ? (
                                    <p className="text-sm text-on-surface-variant py-2">No available slots on this date.</p>
                                ) : (
                                    <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                                        {slots.map((slot) => (
                                            <button
                                                key={slot}
                                                type="button"
                                                onClick={() => patch('start_time', slot)}
                                                className={`h-9 rounded-lg text-xs font-bold transition-all ${
                                                    form.start_time === slot
                                                        ? 'bg-on-surface text-surface'
                                                        : 'bg-slate-100 text-on-surface hover:bg-slate-200'
                                                }`}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {errors.start_time && <p className="text-xs text-error mt-1">{errors.start_time}</p>}
                            </div>
                        </div>
                    </section>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !form.start_time}
                            className="rounded-xl bg-on-surface px-6 py-2.5 text-sm font-bold text-surface hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
