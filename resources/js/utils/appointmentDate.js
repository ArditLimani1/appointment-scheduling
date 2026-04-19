export function appointmentDateOnly(raw) {
    if (raw == null || raw === '') return '';
    const s = String(raw);
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : '';
}

export function parseAppointmentDate(raw) {
    const ymd = appointmentDateOnly(raw);
    if (!ymd) return null;
    return new Date(`${ymd}T12:00:00`);
}

export function formatAppointmentDate(raw, options, locale = 'sq-AL') {
    const d = parseAppointmentDate(raw);
    if (!d || Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(locale, options);
}

export function formatTimeHm(raw) {
    if (raw == null || raw === '') return '';
    const s = String(raw);
    const parts = s.split(':');
    if (parts.length >= 2) {
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    return s;
}

/** Parse "HH:MM" or "HH:MM:SS" to minutes from midnight. */
export function timeToMinutes(raw) {
    if (raw == null || raw === '') return 0;
    const s = String(raw);
    const parts = s.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
}

export function minutesToTimeHm(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function appointmentStatusValue(status) {
    if (status == null) return 'pending';
    if (typeof status === 'object' && status !== null && 'value' in status) {
        return String(status.value);
    }
    return String(status);
}
