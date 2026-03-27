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

export function formatAppointmentDate(raw, options, locale = 'en-GB') {
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
