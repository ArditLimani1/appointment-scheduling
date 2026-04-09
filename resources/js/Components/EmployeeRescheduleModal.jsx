import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import DatePicker from '@/Components/DatePicker';
import Icon from '@/Components/Icon';
import { formatAppointmentDate, formatTimeHm } from '@/utils/appointmentDate';

function normalizeDate(raw) {
    if (!raw) return '';
    return String(raw).slice(0, 10);
}

function normalizeTime(raw) {
    if (!raw) return '';
    return String(raw).slice(0, 5);
}

function isDateInPast(dateStr) {
    const today = new Date().toISOString().slice(0, 10);
    return dateStr < today;
}

export default function EmployeeRescheduleModal({ appointment, onClose }) {
    const currentDate = normalizeDate(appointment.date);
    const currentTime = normalizeTime(appointment.start_time);

    const [date, setDate]             = useState(currentDate);
    const [slots, setSlots]           = useState([]);
    const [selectedTime, setSelectedTime] = useState(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [saving, setSaving]         = useState(false);
    const [error, setError]           = useState('');

    // Fetch available slots whenever date changes
    useEffect(() => {
        if (!date) return;
        setLoadingSlots(true);
        setSlots([]);
        setSelectedTime(null);
        setError('');

        const url = route('employee.appointments.slots', appointment.id) + '?date=' + date;

        fetch(url, {
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
        })
            .then(r => r.json())
            .then(data => {
                const fetched = data.slots ?? [];
                setSlots(fetched);
                // Pre-select current time if this is the original date and it's available
                if (date === currentDate && fetched.includes(currentTime)) {
                    setSelectedTime(currentTime);
                }
            })
            .catch(() => setError('Failed to load available slots.'))
            .finally(() => setLoadingSlots(false));
    }, [date]);

    const handleSave = () => {
        if (!selectedTime) { setError('Please select a time slot.'); return; }
        setSaving(true);
        setError('');

        router.put(
            route('employee.appointments.reschedule', appointment.id),
            { date, start_time: selectedTime },
            {
                preserveScroll: true,
                onSuccess: () => onClose(),
                onError: (errs) => {
                    setError(Object.values(errs)[0] ?? 'Something went wrong.');
                    setSaving(false);
                },
            }
        );
    };

    const isPast = isDateInPast(date);
    const hasChanges = date !== currentDate || selectedTime !== currentTime;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-3xl bg-surface shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 border-b border-outline-variant/30">
                    <div>
                        <h3 className="font-headline text-lg font-bold text-on-surface">Reschedule Appointment</h3>
                        <p className="text-sm text-on-surface-variant mt-0.5">
                            {appointment.client_first_name} {appointment.client_last_name}
                            {appointment.service?.name ? <> · <span className="font-medium">{appointment.service.name}</span></> : null}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container transition-colors shrink-0"
                    >
                        <Icon name="close" size="text-xl" />
                    </button>
                </div>

                {/* Current booking info */}
                <div className="mx-6 mt-4 flex items-center gap-2 rounded-2xl bg-surface-container-low px-4 py-3 text-sm">
                    <Icon name="event" size="text-base" className="text-on-surface-variant shrink-0" />
                    <span className="text-on-surface-variant">Currently:</span>
                    <span className="font-semibold text-on-surface">
                        {formatAppointmentDate(appointment.date, { weekday: 'short', day: 'numeric', month: 'short' })}
                        &nbsp;·&nbsp;{formatTimeHm(appointment.start_time)}
                    </span>
                </div>

                {/* Past date warning */}
                {isPast && (
                    <div className="mx-6 mt-3 flex items-center gap-2 rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container">
                        <Icon name="warning" size="text-base" />
                        This date is in the past. Proceed with caution.
                    </div>
                )}

                {/* Body */}
                <div className="px-6 py-4 space-y-5">

                    {/* Date picker */}
                    <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            New Date
                        </label>
                        <DatePicker value={date} onChange={(v) => v && setDate(v)} portal />
                    </div>

                    {/* Time slots */}
                    <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            Available Time Slots
                        </label>

                        {loadingSlots ? (
                            <div className="flex items-center gap-2 py-4 text-sm text-on-surface-variant">
                                <Icon name="progress_activity" size="text-base" className="animate-spin" />
                                Loading slots…
                            </div>
                        ) : slots.length === 0 ? (
                            <p className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
                                No available slots on this date.
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {slots.map((slot) => {
                                    const isSelected = selectedTime === slot;
                                    const isCurrent  = slot === currentTime && date === currentDate;
                                    return (
                                        <button
                                            key={slot}
                                            type="button"
                                            onClick={() => setSelectedTime(slot)}
                                            className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition-all ${
                                                isSelected
                                                    ? 'bg-on-surface text-surface shadow'
                                                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                                            }`}
                                        >
                                            {slot}
                                            {isCurrent && !isSelected && (
                                                <span className="ml-1 text-[10px] text-on-surface-variant">(current)</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {error && (
                        <p className="text-sm font-medium text-error">{error}</p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-outline-variant/30 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !selectedTime || !hasChanges}
                        className="primary-gradient rounded-xl px-5 py-2 text-sm font-semibold text-white shadow disabled:opacity-50"
                    >
                        {saving ? 'Saving…' : 'Reschedule'}
                    </button>
                </div>

            </div>
        </div>
    );
}
