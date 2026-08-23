/**
 * Types mirroring API v1 payloads (docs/api-v1.md in the repo root).
 * Enum values mirror app/Enums/* on the backend.
 */
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled';

export type PermissionKey =
  | 'admin.dashboard'
  | 'admin.services'
  | 'admin.employees'
  | 'admin.appointments'
  | 'admin.analytics'
  | 'admin.settings'
  | 'admin.roles'
  | 'admin.shared_resources'
  | 'employee.dashboard'
  | 'employee.analytics'
  | 'employee.schedule'
  | 'employee.appointments';

export interface MeUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  title: string | null;
  avatar: string | null;
  role: 'admin' | 'employee' | null;
  locale: string;
  booking_slug: string | null;
  also_works_as_staff: boolean;
  onboarding_completed: boolean;
}

export interface MeBusiness {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  timezone: string;
  currency: string | null;
  currency_symbol: string | null;
  slot_duration: number | null;
  client_identifier_type: string | null;
  uses_shared_resources: boolean;
  allow_employee_service_edit: boolean;
  auto_confirm_appointments: boolean;
}

export interface Me {
  user: MeUser;
  business: MeBusiness | null;
  permissions: PermissionKey[];
  features: { admin_panel: boolean; employee_area: boolean };
}

export interface Appointment {
  id: number;
  date: string; // Y-m-d (business timezone)
  start_time: string; // H:i
  end_time: string; // H:i
  status: AppointmentStatus;
  service_id: number | null;
  service_name?: string | null;
  service?: { id: number; name: string; duration?: number; price?: number | string } | null;
  employee_id: number | null;
  employee_name?: string | null;
  client_first_name?: string | null;
  client_last_name?: string | null;
  client_phone?: string | null;
  client_email?: string | null;
  client_notes?: string | null;
  price: number | string | null;
  booking_reference?: string | null;
}

export interface ServiceSummary {
  id: number;
  name: string;
  duration?: number;
  price?: number | string;
  description?: string | null;
  is_active?: boolean;
  is_popular?: boolean;
  sort_order?: number;
  resources?: { resource_id: number; quantity: number }[];
}

export interface EmployeeSummary {
  id: number;
  name: string;
  email?: string;
  phone?: string | null;
  title?: string | null;
  is_active?: boolean;
  service_ids?: number[];
  services?: ServiceSummary[];
  business_role_id?: number | null;
}

export interface Paginated<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
  total?: number;
  per_page?: number;
  links?: unknown;
  meta?: { current_page: number; last_page: number; total: number; per_page: number };
}

export interface ScheduleDay {
  date?: string;
  day_of_week: number;
  is_active: boolean;
  is_overridden?: boolean;
  start_time: string | null;
  end_time: string | null;
  breaks: { start_time: string; end_time: string }[];
}

export interface NotificationItem {
  id: string;
  read_at: string | null;
  created_at: string;
  data: {
    kind?: string;
    client_name?: string;
    date?: string;
    start_time?: string;
    end_time?: string;
    services?: { id: number; name: string }[];
    business_name?: string;
    [key: string]: unknown;
  };
}

export interface LoginResponse {
  token: string;
  me: Me;
}

export interface ApiErrorBody {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}
