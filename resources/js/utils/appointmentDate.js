/**
 * Albanian month names — used as a reliable fallback because some browsers/systems
 * return English names for the sq-AL locale via the Intl API.
 */
export const SQ_MONTHS_LONG = [
    'Janar','Shkurt','Mars','Prill','Maj','Qershor',
    'Korrik','Gusht','Shtator','Tetor','Nëntor','Dhjetor',
];
export const SQ_MONTHS_SHORT = [
    'Jan','Shk','Mar','Pri','Maj','Qer',
    'Kor','Gus','Sht','Tet','Nën','Dhj',
];

/**
 * Albanian weekday names (short, Mon-first order used in the calendar header).
 * Index 0 = Monday … 6 = Sunday.
 */
export const SQ_WEEKDAYS_SHORT_MON = ['Hën','Mar','Mër','Enj','Pre','Sht','Die'];
/** Same but Sun-first: index 0 = Sunday, 1 = Monday … 6 = Saturday. */
export const SQ_WEEKDAYS_SHORT_SUN = ['Die','Hën','Mar','Mër','Enj','Pre','Sht'];

/**
 * Albanian weekday names (long form). Sun-first to match `Date.getDay()`:
 * index 0 = Sunday … 6 = Saturday.
 */
export const SQ_WEEKDAYS_LONG_SUN = [
    'E diel','E hënë','E martë','E mërkurë','E enjte','E premte','E shtunë',
];

/** Return the correct Albanian month name for a given Date. */
export function sqMonthName(date, style = 'long') {
    return style === 'short' ? SQ_MONTHS_SHORT[date.getMonth()] : SQ_MONTHS_LONG[date.getMonth()];
}

/** Return the correct Albanian weekday name for a given Date. */
export function sqWeekdayName(date, style = 'long') {
    const d = date.getDay();
    if (style === 'long') {
        return SQ_WEEKDAYS_LONG_SUN[d];
    }
    return SQ_WEEKDAYS_SHORT_SUN[d];
}

/**
 * Post-process a `toLocaleDateString` / `Intl.DateTimeFormat` result for Albanian:
 * replace whatever the browser put as the month name with the correct Albanian name.
 * Works regardless of whether the browser returned "April", "april", "Prill", etc.
 */
export function patchSqMonthName(str, date, monthStyle = 'long') {
    if (!str || !date) return str;
    const correct = sqMonthName(date, monthStyle);
    // Build a regex that matches any known English OR Albanian (mis-)rendering for this month.
    // We use the en-GB name as the pattern anchor since browsers most commonly fall back to English.
    const enName = date.toLocaleDateString('en-GB', { month: monthStyle });
    return str.replace(new RegExp(enName, 'gi'), correct);
}

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
    let result = d.toLocaleDateString(locale, options);
    if (options?.month && String(locale || '').toLowerCase().startsWith('sq')) {
        result = patchSqMonthName(result, d, options.month);
    }
    return result;
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
