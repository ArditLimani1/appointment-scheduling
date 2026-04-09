/** Default matches product expectation: active bookings, hide cancelled unless selected. */
export const DEFAULT_APPOINTMENT_STATUS_FILTER = ['pending', 'confirmed'];

const ALLOWED = new Set(['pending', 'confirmed', 'cancelled']);

/**
 * @param {unknown} status — array from server, legacy string, or undefined
 * @returns {string[]}
 */
export function normalizeAppointmentStatusFilter(status) {
    let arr = [];
    if (Array.isArray(status)) {
        arr = status.map(String).filter((s) => ALLOWED.has(s));
    } else if (typeof status === 'string' && status !== '') {
        arr = status
            .split(',')
            .map((s) => s.trim())
            .filter((s) => ALLOWED.has(s));
    }
    arr = [...new Set(arr)];
    if (arr.length === 0) {
        return [...DEFAULT_APPOINTMENT_STATUS_FILTER];
    }
    return arr;
}

/**
 * @param {URLSearchParams} params
 * @param {unknown} status
 */
export function appendAppointmentStatusParams(params, status) {
    normalizeAppointmentStatusFilter(status).forEach((s) => params.append('status[]', s));
}
