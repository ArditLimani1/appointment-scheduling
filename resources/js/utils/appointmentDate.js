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
 * Replace the English name a browser fell back to with the correct Albanian one.
 * `\b` anchors keep a short name from eating part of a longer word — without them
 * the "Mar" anchor would turn an already-Albanian "mars" into "Marss".
 */
function replaceLocalizedPart(str, enName, correct) {
    if (!str || !enName) return str;
    return str.replace(new RegExp(`\\b${enName}\\b`, 'gi'), correct);
}

/**
 * Post-process a `toLocaleDateString` / `Intl.DateTimeFormat` result for Albanian:
 * replace whatever the browser put as the month name with the correct Albanian name.
 * Works regardless of whether the browser returned "April", "april", "Prill", etc.
 */
export function patchSqMonthName(str, date, monthStyle = 'long') {
    if (!str || !date) return str;
    // The en-GB name is the pattern anchor, since browsers most commonly fall back to English.
    return replaceLocalizedPart(str, date.toLocaleDateString('en-GB', { month: monthStyle }), sqMonthName(date, monthStyle));
}

/** Same idea for weekday names — `sq-AL` often still yields "Mon"/"Monday". */
export function patchSqWeekdayName(str, date, weekdayStyle = 'long') {
    if (!str || !date) return str;
    return replaceLocalizedPart(str, date.toLocaleDateString('en-GB', { weekday: weekdayStyle }), sqWeekdayName(date, weekdayStyle));
}

/**
 * Patch every localizable part of an already-formatted date string.
 * Month first: otherwise an Albanian weekday like "Mar" (Tuesday) would be
 * swallowed by the English "Mar" (March) month anchor.
 */
export function patchSqDateParts(str, date, options) {
    let result = str;
    if (options?.month) {
        result = patchSqMonthName(result, date, options.month);
    }
    if (options?.weekday) {
        result = patchSqWeekdayName(result, date, options.weekday);
    }
    return result;
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

/**
 * Compose the Albanian rendering from scratch. Patching the browser output is not enough:
 * where `sq-AL` falls back to English the *order* is wrong too — "Gusht 24" instead of
 * "24 gusht". Long month names are lowercase inside a date, as in "24 gusht 2026".
 * Returns null for option shapes it cannot build, so callers fall back to `Intl`.
 */
export function formatSqDate(date, options = {}) {
    const named = (value, allowed) => value == null || allowed.includes(value);
    if (!named(options.weekday, ['long', 'short']) || !named(options.month, ['long', 'short'])) {
        return null;
    }

    const weekday = options.weekday ? sqWeekdayName(date, options.weekday) : null;
    const day = options.day ? String(date.getDate()) : null;
    const month = options.month
        ? (options.month === 'long' ? sqMonthName(date, 'long').toLowerCase() : sqMonthName(date, 'short'))
        : null;
    const year = options.year ? String(date.getFullYear()) : null;

    const datePart = [day, month, year].filter(Boolean).join(' ');
    const label = [weekday, datePart].filter(Boolean).join(', ');

    return label === '' ? null : label;
}

export function isSqLocale(locale) {
    return String(locale || '').toLowerCase().startsWith('sq');
}

export function formatAppointmentDate(raw, options, locale = 'sq-AL') {
    const d = parseAppointmentDate(raw);
    if (!d || Number.isNaN(d.getTime())) return '—';
    return formatLocalizedDate(d, options, locale);
}

/** Same rules as `formatAppointmentDate`, for callers that already hold a `Date`. */
export function formatLocalizedDate(date, options, locale = 'sq-AL') {
    if (!date || Number.isNaN(date.getTime())) return '—';
    if (isSqLocale(locale)) {
        const sq = formatSqDate(date, options ?? {});
        if (sq !== null) {
            return sq;
        }
    }
    return date.toLocaleDateString(locale || undefined, options);
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
