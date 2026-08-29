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
  features: {
    admin_panel: boolean;
    employee_area: boolean;
    /** WHATSAPP_ENABLED — gates the client-identifier choice in settings. */
    whatsapp: boolean;
  };
}

/** `GET /admin/settings` → the business row plus the owner-toggle context. */
export interface BusinessSettings {
  name?: string;
  phone?: string | null;
  location?: string | null;
  slug?: string;
  logo?: string | null;
  slot_duration?: number | null;
  min_booking_notice?: number | null;
  max_booking_window?: number | null;
  client_identifier_type?: 'phone' | 'email' | null;
  allow_employee_service_edit?: boolean;
  uses_shared_resources?: boolean;
  auto_confirm_appointments?: boolean;
  reminders_enabled?: boolean;
  reminder_time?: string | null;
}

export interface SettingsPayload {
  settings: BusinessSettings;
  owner_email: string;
  show_owner_staff_toggle: boolean;
  owner_also_works_as_staff: boolean;
  /** Gates the personal notification toggle — `admin.appointments`, not `admin.settings`. */
  can_manage_appointments: boolean;
  can_manage_settings: boolean;
  /** Personal opt-in to hear about other staff's bookings. */
  notify_others_appointments: boolean;
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
  /** Live employee, eager-loaded on the list and calendar payloads. */
  employee?: { id: number; name: string } | null;
  /** Snapshot written only when the employee row is deleted — not the live name. */
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
    /** True when the recipient is watching another employee's appointment. */
    for_other_staff?: boolean;
    employee_name?: string | null;
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
