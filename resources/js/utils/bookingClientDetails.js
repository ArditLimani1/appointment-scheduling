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

/** `requirePlus` forces an international prefix — WhatsApp cannot deliver without a country code. */
export function isValidBookingPhone(normalized, { requirePlus = false } = {}) {
    const pattern = requirePlus ? /^\+[0-9]{6,20}$/ : /^\+?[0-9]{6,20}$/;
    return pattern.test(String(normalized ?? ''));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export function isValidBookingEmail(s) {
    const t = String(s ?? '').trim();
    if (!EMAIL_RE.test(t)) return false;
    if (t.length > 255) return false;
    return !/[<>'"`]/.test(t);
}

const DEFAULT_MESSAGES = {
    first_name_required: 'Please enter your full name.',
    first_name_invalid: 'First name contains invalid characters.',
    last_name_invalid: 'Last name contains invalid characters.',
    phone_required: 'Please enter a phone number.',
    phone_invalid: 'Use digits only, with an optional + at the start (6–20 digits).',
    phone_prefix_required: 'Start with the country code, e.g. +383.',
    email_required: 'Please enter your email address.',
    email_invalid: 'Please enter a valid email address.',
};

/**
 * Client-side validation for booking details (mirrors backend intent).
 * `messages` lets a caller supply translated copy; anything missing falls back to English.
 *
 * @param {{ fullName: string, phone: string, email: string, notes: string, identifierType: 'phone'|'email', requirePhonePrefix?: boolean, messages?: Record<string, string> }} p
 */
export function validateBookingDetails(p) {
    const errors = {};
    const msg = { ...DEFAULT_MESSAGES, ...(p.messages ?? {}) };
    const full = sanitizeBookingPlainText(p.fullName, 200).trim();
    const parts = full.split(/\s+/).filter(Boolean);
    const first = parts[0] || '';
    const last = parts.length > 1 ? parts.slice(1).join(' ') : '-';

    if (!first) {
        errors.client_first_name = msg.first_name_required;
    } else if (!isValidNamePart(first)) {
        errors.client_first_name = msg.first_name_invalid;
    }
    if (!isValidNamePart(last)) {
        errors.client_last_name = msg.last_name_invalid;
    }

    if (p.identifierType === 'phone') {
        const requirePlus = Boolean(p.requirePhonePrefix);
        const ph = coercePhoneInput(p.phone);
        if (!ph || ph === '+') {
            errors.client_phone = msg.phone_required;
        } else if (!isValidBookingPhone(ph, { requirePlus })) {
            errors.client_phone = requirePlus && !ph.startsWith('+') ? msg.phone_prefix_required : msg.phone_invalid;
        }
    } else {
        const em = sanitizeBookingPlainText(p.email, 255).trim();
        if (!em) {
            errors.client_email = msg.email_required;
        } else if (!isValidBookingEmail(em)) {
            errors.client_email = msg.email_invalid;
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
