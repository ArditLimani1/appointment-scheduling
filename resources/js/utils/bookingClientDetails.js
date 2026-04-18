/** Strip markup / script-friendly characters for plain single-line fields. */
export function sanitizeBookingPlainText(value, maxLen) {
    const v = String(value ?? '')
        .replace(/[<>`]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/&[#a-z0-9]{1,24};/gi, '');
    return v.slice(0, maxLen);
}

/** Notes: same guards, keep newlines. */
export function sanitizeBookingNotes(value, maxLen) {
    const normalized = String(value ?? '').replace(/\r\n/g, '\n');
    return sanitizeBookingPlainText(normalized, maxLen);
}

/** Match backend: letters (incl. marks), numbers, spaces, apostrophe, period, comma, hyphen. */
const NAME_PART_RE = /^[\p{L}\p{M}0-9\s'.,-]+$/u;

export function isValidNamePart(s) {
    const t = String(s ?? '').trim();
    return t.length > 0 && NAME_PART_RE.test(t);
}

/** Optional leading +, then digits only (6–20 digits). Keeps a lone "+" while the user types the prefix. */
export function coercePhoneInput(raw) {
    const t = String(raw ?? '');
    const wantPlus = t.trimStart().startsWith('+');
    const digits = t.replace(/\D/g, '');
    if (!digits) {
        return wantPlus ? '+' : '';
    }
    const out = wantPlus ? `+${digits}` : digits;
    return out.length > 24 ? out.slice(0, 24) : out;
}

export function isValidBookingPhone(normalized) {
    return /^\+?[0-9]{6,20}$/.test(String(normalized ?? ''));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export function isValidBookingEmail(s) {
    const t = String(s ?? '').trim();
    if (!EMAIL_RE.test(t)) return false;
    if (t.length > 255) return false;
    return !/[<>'"`]/.test(t);
}

/**
 * Client-side validation for booking details (mirrors backend intent).
 * @param {{ fullName: string, phone: string, email: string, notes: string, identifierType: 'phone'|'email' }} p
 */
export function validateBookingDetails(p) {
    const errors = {};
    const full = sanitizeBookingPlainText(p.fullName, 200).trim();
    const parts = full.split(/\s+/).filter(Boolean);
    const first = parts[0] || '';
    const last = parts.length > 1 ? parts.slice(1).join(' ') : '-';

    if (!first) {
        errors.client_first_name = 'Please enter your full name.';
    } else if (!isValidNamePart(first)) {
        errors.client_first_name = 'First name contains invalid characters.';
    }
    if (!isValidNamePart(last)) {
        errors.client_last_name = 'Last name contains invalid characters.';
    }

    if (p.identifierType === 'phone') {
        const ph = coercePhoneInput(p.phone);
        if (!ph || ph === '+') {
            errors.client_phone = 'Please enter a phone number.';
        } else if (!isValidBookingPhone(ph)) {
            errors.client_phone = 'Use digits only, with an optional + at the start (6–20 digits).';
        }
    } else {
        const em = sanitizeBookingPlainText(p.email, 255).trim();
        if (!em) {
            errors.client_email = 'Please enter your email address.';
        } else if (!isValidBookingEmail(em)) {
            errors.client_email = 'Please enter a valid email address.';
        }
    }

    const notesSan = sanitizeBookingNotes(p.notes, 2000);

    return {
        ok: Object.keys(errors).length === 0,
        errors,
        payload: {
            fullNameSanitized: full,
            first,
            last,
            phone: p.identifierType === 'phone' ? coercePhoneInput(p.phone) : '',
            email: p.identifierType === 'email' ? sanitizeBookingPlainText(p.email, 255).trim() : '',
            notesSanitized: notesSan,
        },
    };
}
