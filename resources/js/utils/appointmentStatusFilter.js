/** All appointment statuses (multi-select filter options). */
export const APPOINTMENT_STATUS_VALUES = ['pending', 'confirmed', 'cancelled'];

/** Admin default: active bookings; cancelled hidden unless selected. */
export const DEFAULT_APPOINTMENT_STATUS_FILTER = ['pending', 'confirmed'];

/** Employee default: show every status (matches “all statuses” in the filter UI). */
export const EMPLOYEE_DEFAULT_APPOINTMENT_STATUS_FILTER = [...APPOINTMENT_STATUS_VALUES];

const ALLOWED = new Set(APPOINTMENT_STATUS_VALUES);

/**
 * @param {unknown} status — array from server, legacy string, or undefined
 * @param {string[]} [fallback]
 * @returns {string[]}
 */
export function normalizeAppointmentStatusFilter(status, fallback = DEFAULT_APPOINTMENT_STATUS_FILTER) {
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
        return [...fallback];
    }
    return arr;
}

/**
 * @param {URLSearchParams} params
 * @param {unknown} status
 * @param {string[]} [fallback]
 */
export function appendAppointmentStatusParams(params, status, fallback = DEFAULT_APPOINTMENT_STATUS_FILTER) {
    normalizeAppointmentStatusFilter(status, fallback).forEach((s) => params.append('status[]', s));
}
