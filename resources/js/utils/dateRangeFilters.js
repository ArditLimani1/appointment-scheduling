/** Default list window: the calendar month the user is currently in. */
export function currentMonthRange() {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: ymd(first), to: ymd(last) };
}

function ymd(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Compare two YYYY-MM-DD strings. Returns -1 | 0 | 1. Empty strings sort as equal to each other, before non-empty.
 */
export function ymdCompare(a, b) {
    if (!a || !b) {
        return 0;
    }
    if (a < b) {
        return -1;
    }
    if (a > b) {
        return 1;
    }
    return 0;
}

/**
 * When start date changes: if end is before new start, set end equal to start.
 * @param {{ date_from: string, date_to: string }} current
 * @param {string} newFrom YYYY-MM-DD or ''
 */
export function mergeDateFromChange(current, newFrom) {
    if (!newFrom) {
        return { date_from: newFrom, date_to: current.date_to };
    }
    const to = current.date_to;
    if (!to || ymdCompare(to, newFrom) < 0) {
        return { date_from: newFrom, date_to: newFrom };
    }
    return { date_from: newFrom, date_to: to };
}

/**
 * When end date changes: if end is before start, move start up to end.
 * @param {{ date_from: string, date_to: string }} current
 * @param {string} newTo YYYY-MM-DD or ''
 */
export function mergeDateToChange(current, newTo) {
    if (!newTo) {
        return { date_from: current.date_from, date_to: newTo };
    }
    const from = current.date_from;
    if (!from || ymdCompare(newTo, from) < 0) {
        return { date_from: newTo, date_to: newTo };
    }
    return { date_from: from, date_to: newTo };
}
