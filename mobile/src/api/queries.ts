import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  Appointment,
  EmployeeSummary,
  NotificationItem,
  Paginated,
  ScheduleDay,
  ServiceSummary,
} from './types';

/* ---------------------------------- shared --------------------------------- */

export interface CalendarPayload {
  view: 'day' | 'week' | 'rolling';
  range_start: string;
  range_end: string;
  days?: string[];
  appointments: Appointment[] | Record<string, Appointment[]>;
  employees: EmployeeSummary[];
  services?: ServiceSummary[];
  calendar_hours?: { start: string; end: string };
  calendar_day_breaks?: Record<string, { start_time: string; end_time: string }[]>;
  calendar_day_offs?: string[];
  calendar_employee_day_breaks?: Record<string, Record<string, { start_time: string; end_time: string }[]>>;
  calendar_employee_day_offs?: Record<string, string[]>;
  filters: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AppointmentListPayload {
  appointments: Paginated<Appointment>;
  employees: EmployeeSummary[];
  services: ServiceSummary[];
  filters?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ListFilters {
  scope?: 'upcoming' | 'all';
  date_from?: string;
  date_to?: string;
  status?: string[];
  service_id?: number;
  employee_id?: number;
  search?: string;
  page?: number;
}

/* --------------------------------- employee -------------------------------- */

export function useEmployeeDashboard(params: { date_from?: string; date_to?: string; service_id?: number }) {
  return useQuery({
    queryKey: ['employee', 'dashboard', params],
    queryFn: () =>
      api<{
        appointments: Appointment[];
        appointments_count: number;
        confirmed_appointments: number;
        cancelled_appointments: number;
        daily_revenue: number | string;
        date_from: string;
        date_to: string;
        services: ServiceSummary[];
      }>('/employee/dashboard', { query: { ...params } }),
  });
}

export function useEmployeeAppointments(filters: ListFilters) {
  return useQuery({
    queryKey: ['employee', 'appointments', filters],
    queryFn: () => api<AppointmentListPayload>('/employee/appointments', { query: { ...filters } }),
  });
}

export function useEmployeeCalendar(view: string, date: string) {
  return useQuery({
    queryKey: ['employee', 'calendar', view, date],
    queryFn: () => api<CalendarPayload>('/employee/appointments/calendar', { query: { view, date } }),
  });
}

export function useEmployeeCreateData(enabled: boolean) {
  return useQuery({
    queryKey: ['employee', 'create-data'],
    queryFn: () =>
      api<{ services: ServiceSummary[]; employees: EmployeeSummary[]; booking_today: string }>(
        '/employee/appointments/create',
      ),
    enabled,
  });
}

export function useEmployeeSchedule(dateFrom?: string) {
  return useQuery({
    queryKey: ['employee', 'schedule', dateFrom ?? 'current'],
    queryFn: () =>
      api<{ days: ScheduleDay[]; dateFrom: string; dateTo: string; baseSchedules: Record<string, ScheduleDay> }>(
        '/employee/schedule',
        { query: { date_from: dateFrom } },
      ),
  });
}

export function useEmployeeScheduleConfig() {
  return useQuery({
    queryKey: ['employee', 'schedule-config'],
    queryFn: () =>
      api<{
        schedules: (ScheduleDay & { id?: number })[];
        business_name: string | null;
        booking_url: string | null;
        employee_booking_url: string | null;
        booking_slug: string;
        business_slug: string | null;
      }>('/employee/schedule/configuration'),
  });
}

export function useEmployeeAnalytics(params: { date_from?: string; date_to?: string; service_id?: number }) {
  return useQuery({
    queryKey: ['employee', 'analytics', params],
    queryFn: () => api<Record<string, unknown>>('/employee/analytics', { query: { ...params } }),
  });
}

export function useNotifications(scope: 'unread' | 'all', page = 1) {
  return useQuery({
    queryKey: ['notifications', scope, page],
    queryFn: () =>
      api<{ data: NotificationItem[]; meta: { current_page: number; last_page: number; total: number } }>(
        '/employee/notifications',
        { query: { scope, page } },
      ),
  });
}

/* ---------------------------------- admin ---------------------------------- */

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api<Record<string, unknown>>('/admin/dashboard'),
  });
}

export function useAdminAppointments(filters: ListFilters) {
  return useQuery({
    queryKey: ['admin', 'appointments', filters],
    queryFn: () => api<AppointmentListPayload>('/admin/appointments', { query: { ...filters } }),
  });
}

export function useAdminCalendar(view: string, date: string, employeeId?: number) {
  return useQuery({
    queryKey: ['admin', 'calendar', view, date, employeeId ?? null],
    queryFn: () =>
      api<CalendarPayload>('/admin/appointments/calendar', { query: { view, date, employee_id: employeeId } }),
  });
}

export function useAdminCreateData(enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'create-data'],
    queryFn: () =>
      api<{ services: ServiceSummary[]; employees: EmployeeSummary[]; booking_today: string }>(
        '/admin/appointments/create',
      ),
    enabled,
  });
}

export function useAdminEmployees() {
  return useQuery({
    queryKey: ['admin', 'employees'],
    queryFn: () =>
      api<{
        employees: EmployeeSummary[];
        services?: ServiceSummary[];
        businessRoles: { id: number; name: string; permissions?: string[] }[];
        businessOwnerId: number;
        [key: string]: unknown;
      }>('/admin/employees'),
  });
}

export function useAdminServices() {
  return useQuery({
    queryKey: ['admin', 'services'],
    queryFn: () =>
      api<{ services: ServiceSummary[]; sharedResources: { id: number; name: string; quantity?: number }[] }>(
        '/admin/services',
      ),
  });
}

export function useAdminRoles() {
  return useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: () =>
      api<{
        roles: { id: number; name: string; permissions: string[]; employees_count?: number }[];
        permissionGroups: Record<string, { value: string; label: string }[]>;
      }>('/admin/roles'),
  });
}

export function useAdminResources() {
  return useQuery({
    queryKey: ['admin', 'resources'],
    queryFn: () =>
      api<{ resources: { id: number; name: string; quantity: number; services_count?: number }[] }>(
        '/admin/shared-resources',
      ),
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => api<Record<string, unknown>>('/admin/settings'),
  });
}

export function useAdminAnalytics(params: { date_from?: string; date_to?: string; employee_id?: number }) {
  return useQuery({
    queryKey: ['admin', 'analytics', params],
    queryFn: () => api<Record<string, unknown>>('/admin/analytics', { query: { ...params } }),
  });
}

/* -------------------------------- mutations -------------------------------- */

function useInvalidatingMutation<TArgs>(
  keysToInvalidate: string[][],
  fn: (args: TArgs) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const key of keysToInvalidate) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}

const APPOINTMENT_KEYS = [
  ['employee', 'appointments'],
  ['employee', 'calendar'],
  ['employee', 'dashboard'],
  ['admin', 'appointments'],
  ['admin', 'calendar'],
  ['admin', 'dashboard'],
];

export function useUpdateStatus(area: 'employee' | 'admin') {
  return useInvalidatingMutation(APPOINTMENT_KEYS, ({ id, status }: { id: number; status: string }) =>
    api(`/${area}/appointments/${id}`, { method: 'PATCH', body: { status } }),
  );
}

export function useRescheduleOwn() {
  return useInvalidatingMutation(
    APPOINTMENT_KEYS,
    ({ id, date, start_time }: { id: number; date: string; start_time: string }) =>
      api(`/employee/appointments/${id}/reschedule`, { method: 'PUT', body: { date, start_time } }),
  );
}

export function useCreateAppointment(area: 'employee' | 'admin') {
  return useInvalidatingMutation(APPOINTMENT_KEYS, (body: Record<string, unknown>) =>
    api(`/${area}/appointments`, { method: 'POST', body }),
  );
}

export function useDeleteAppointment() {
  return useInvalidatingMutation(APPOINTMENT_KEYS, ({ id }: { id: number }) =>
    api(`/admin/appointments/${id}`, { method: 'DELETE' }),
  );
}

export function useEditAppointment(area: 'employee' | 'admin') {
  return useInvalidatingMutation(APPOINTMENT_KEYS, ({ id, ...body }: { id: number } & Record<string, unknown>) =>
    api(`/${area}/appointments/${id}`, { method: 'PUT', body }),
  );
}

export async function fetchSlots(area: 'employee' | 'admin', appointmentId: number, date: string, serviceId?: number) {
  if (area === 'employee') {
    return api<{ slots: string[] }>(`/employee/appointments/${appointmentId}/slots`, {
      query: { date, service_id: serviceId },
    });
  }
  throw new Error('Admin slots use fetchAdminSlots');
}

export async function fetchAdminSlots(params: {
  employee_id: number;
  service_id: number;
  date: string;
  exclude_id?: number;
}) {
  return api<{ slots: string[] }>('/admin/appointments/slots', { query: { ...params } });
}

export async function fetchInternalSlots(
  area: 'employee' | 'admin',
  params: { employee_id?: number; service_ids: number[]; date: string },
) {
  return api<{ slots: string[] }>(`/${area}/appointments/internal-slots`, {
    query: { service_ids: params.service_ids, date: params.date, employee_id: params.employee_id },
  });
}

export function useSaveScheduleConfig() {
  return useInvalidatingMutation(
    [['employee', 'schedule'], ['employee', 'schedule-config']],
    (body: { schedules: ScheduleDay[] }) => api('/employee/schedule/configuration', { method: 'PUT', body }),
  );
}

export function useSaveScheduleOverrides() {
  return useInvalidatingMutation([['employee', 'schedule']], (body: { days: ScheduleDay[] }) =>
    api('/employee/schedule/overrides', { method: 'PUT', body }),
  );
}

export function useMarkNotificationRead() {
  return useInvalidatingMutation([['notifications']], ({ id }: { id: string }) =>
    api(`/employee/notifications/${id}/read`, { method: 'POST' }),
  );
}

export function useMarkAllNotificationsRead() {
  return useInvalidatingMutation([['notifications']], () =>
    api('/employee/notifications/read-all', { method: 'POST' }),
  );
}

/* ------------------------------ admin mutations ----------------------------- */

export function useSaveEmployee() {
  return useInvalidatingMutation(
    [['admin', 'employees'], ['admin', 'create-data']],
    ({ id, ...body }: { id?: number } & Record<string, unknown>) =>
      id
        ? api(`/admin/employees/${id}`, { method: 'PUT', body })
        : api('/admin/employees', { method: 'POST', body }),
  );
}

export function useDeleteEmployee() {
  return useInvalidatingMutation(
    [['admin', 'employees'], ...APPOINTMENT_KEYS],
    ({ id, delete_appointments }: { id: number; delete_appointments: boolean }) =>
      api(`/admin/employees/${id}`, { method: 'DELETE', body: { delete_appointments } }),
  );
}

export function useSaveService() {
  return useInvalidatingMutation(
    [['admin', 'services'], ['admin', 'create-data']],
    ({ id, ...body }: { id?: number } & Record<string, unknown>) =>
      id ? api(`/admin/services/${id}`, { method: 'PUT', body }) : api('/admin/services', { method: 'POST', body }),
  );
}

export function useDeleteService() {
  return useInvalidatingMutation([['admin', 'services']], ({ id }: { id: number }) =>
    api(`/admin/services/${id}`, { method: 'DELETE' }),
  );
}

export function useSaveRole() {
  return useInvalidatingMutation([['admin', 'roles'], ['admin', 'employees']], ({ id, ...body }: { id?: number } & Record<string, unknown>) =>
    id ? api(`/admin/roles/${id}`, { method: 'PUT', body }) : api('/admin/roles', { method: 'POST', body }),
  );
}

export function useDeleteRole() {
  return useInvalidatingMutation([['admin', 'roles'], ['admin', 'employees']], ({ id }: { id: number }) =>
    api(`/admin/roles/${id}`, { method: 'DELETE' }),
  );
}

export function useSaveResource() {
  return useInvalidatingMutation([['admin', 'resources'], ['admin', 'services']], ({ id, ...body }: { id?: number } & Record<string, unknown>) =>
    id
      ? api(`/admin/shared-resources/${id}`, { method: 'PUT', body })
      : api('/admin/shared-resources', { method: 'POST', body }),
  );
}

export function useDeleteResource() {
  return useInvalidatingMutation([['admin', 'resources'], ['admin', 'services']], ({ id }: { id: number }) =>
    api(`/admin/shared-resources/${id}`, { method: 'DELETE' }),
  );
}

export function useSaveSettings() {
  return useInvalidatingMutation([['admin', 'settings']], (body: Record<string, unknown>) =>
    api('/admin/settings', { method: 'PUT', body }),
  );
}

export function useRegisterDevice() {
  return useMutation({
    mutationFn: (body: { expo_push_token: string; platform: 'ios' | 'android'; device_name?: string }) =>
      api('/devices', { method: 'POST', body }),
  });
}
