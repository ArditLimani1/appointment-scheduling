import { appointmentDateOnly, appointmentStatusValue } from '@/utils/appointmentDate';

/**
 * Body for PUT admin.appointments.edit — matches EditAppointmentModal submit shape.
 * @param {object} appointment — serialized appointment from Inertia
 * @param {{ date?: string, start_time?: string }} [overrides]
 */
/**
 * Body for PUT employee.appointments.edit — service, status, date, time only.
 * @param {object} appointment
 * @param {{ date?: string, start_time?: string, service_id?: number, status?: string }} [overrides]
 */
export function buildEmployeeAppointmentPutPayload(appointment, overrides = {}) {
    const apptDate = appointmentDateOnly(appointment.date);

    return {
        service_id: Number(overrides.service_id ?? appointment.service_id),
        status: appointmentStatusValue(overrides.status ?? appointment.status),
        date: overrides.date ?? apptDate,
        start_time: overrides.start_time ?? (appointment.start_time ? String(appointment.start_time).slice(0, 5) : ''),
    };
}

export function buildAdminAppointmentPutPayload(appointment, overrides = {}) {
    const identifierType = appointment.client_email && String(appointment.client_email).trim() ? 'email' : 'phone';
    const apptDate = appointmentDateOnly(appointment.date);

    return {
        client_first_name: appointment.client_first_name ?? '',
        client_last_name: appointment.client_last_name ?? '',
        client_phone: identifierType === 'phone' ? (appointment.client_phone ?? null) : (appointment.client_phone ?? null),
        client_email: identifierType === 'email' ? (appointment.client_email ?? null) : (appointment.client_email ?? null),
        client_notes: appointment.client_notes ?? '',
        service_id: Number(appointment.service_id),
        status: appointmentStatusValue(appointment.status),
        employee_id: Number(appointment.employee_id),
        date: overrides.date ?? apptDate,
        start_time: overrides.start_time ?? (appointment.start_time ? String(appointment.start_time).slice(0, 5) : ''),
    };
}
