import { formatAppointmentDate } from '@/utils/appointmentDate';

/**
 * Localized calendar date for notification rows (YYYY-MM-DD from API).
 * SQ: "7 Maj 2026" · EN: "May 7, 2026"
 *
 * @param {string} ymd
 * @param {string} [localeBcp47]
 */
export function formatNotificationDateLine(ymd, localeBcp47) {
    if (!ymd || typeof ymd !== 'string') {
        return '';
    }
    const loc = typeof localeBcp47 === 'string' && localeBcp47.length > 0 ? localeBcp47 : 'sq-AL';
    const lower = loc.toLowerCase();
    if (lower.startsWith('sq')) {
        return formatAppointmentDate(ymd, { day: 'numeric', month: 'long', year: 'numeric' }, loc);
    }
    // en-GB prints "7 May 2026"; use en-US for "May 7, 2026"
    if (lower.startsWith('en')) {
        return formatAppointmentDate(ymd, { month: 'long', day: 'numeric', year: 'numeric' }, 'en-US');
    }
    return formatAppointmentDate(ymd, { month: 'long', day: 'numeric', year: 'numeric' }, loc);
}

/** @param {{ name?: string }[]} services */
export function formatServiceLine(services) {
    if (!Array.isArray(services) || services.length === 0) {
        return '';
    }
    return services.map((s) => s.name).filter(Boolean).join(', ');
}

/** @returns {string} i18n key under employee.notifications */
export function sourceTranslationKey(source) {
    if (source === 'public_booking') {
        return 'employee.notifications.source_public';
    }
    if (source === 'admin') {
        return 'employee.notifications.source_admin';
    }
    return 'employee.notifications.source_employee';
}

export function appendPendingOnly(params) {
    params.append('status[]', 'pending');
}

export function joinRouteWithQuery(base, params) {
    const qs = params.toString();
    if (!qs) {
        return base;
    }
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}${qs}`;
}

/**
 * Which appointment screens a notification should link to. Watchers who are not
 * bookable staff cannot open the employee ones — those abort on `worksAsStaff()`.
 *
 * @param {boolean} worksAsStaff
 */
function appointmentRoutes(worksAsStaff) {
    return worksAsStaff
        ? { calendar: 'employee.appointments.calendar', index: 'employee.appointments.index' }
        : { calendar: 'admin.appointments.calendar', index: 'admin.appointments.index' };
}

export function buildEmployeeNotificationAppointmentsUrl(dateYmd, preferCalendar, worksAsStaff = true) {
    const routes = appointmentRoutes(worksAsStaff);
    try {
        if (preferCalendar) {
            const params = new URLSearchParams();
            params.set('date', dateYmd);
            params.set('view', 'day');
            appendPendingOnly(params);
            return joinRouteWithQuery(route(routes.calendar), params);
        }
        const params = new URLSearchParams();
        params.set('date_from', dateYmd);
        params.set('date_to', dateYmd);
        appendPendingOnly(params);
        return joinRouteWithQuery(route(routes.index), params);
    } catch {
        return '#';
    }
}

export function buildEmployeeNotificationAppointmentsFallback(preferCalendar, worksAsStaff = true) {
    const routes = appointmentRoutes(worksAsStaff);
    try {
        const params = new URLSearchParams();
        appendPendingOnly(params);
        if (preferCalendar) {
            const d = new Date();
            const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            params.set('date', ymd);
            params.set('view', 'day');
            return joinRouteWithQuery(route(routes.calendar), params);
        }
        return joinRouteWithQuery(route(routes.index), params);
    } catch {
        return '#';
    }
}

/** Normalize API / Inertia notification shape for UI */
export function normalizeEmployeeNotification(n) {
    const data = n.data ?? {};
    return {
        id: n.id,
        readAt: n.read_at,
        createdAt: n.created_at,
        isBooking: data.kind === 'new_appointments',
        data,
    };
}
