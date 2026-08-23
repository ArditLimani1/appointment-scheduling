# NiTermin API v1 — Mobile Contract

> **Status:** implemented in `routes/api.php` (57 routes), covered by
> `tests/Feature/Api/` (Auth, Device, Translation, EmployeeArea, AdminArea).
> Shared filter/calendar logic lives in `app/Http/Controllers/Concerns/`
> (`ResolvesEmployeeAppointmentQuery`, `ResolvesAdminAppointmentQuery`,
> `ResolvesAnalyticsDateFilters`, `ResolvesAdminAnalyticsFilters`) and is used
> by both the Inertia and API controllers — one source of truth.

API for the NiTermin mobile app (admin + employee, iOS/Android/iPad). Web keeps
using Inertia; this API is a thin JSON layer over the existing `app/Services/*`
classes. SuperAdmin and public Booking stay web-only.

## Conventions

- **Base path:** `/api/v1`
- **Auth:** Laravel Sanctum personal access tokens. `Authorization: Bearer <token>`.
- **Content:** JSON in, JSON out. `Accept: application/json` required (Laravel then
  returns JSON validation errors automatically).
- **Locale:** `Accept-Language: sq|en` header; falls back to the user's `locale` column.
- **Dates:**
  - Calendar dates (a day, no time): `YYYY-MM-DD` strings, interpreted in the
    **business timezone** (`businesses.timezone`).
  - Instants (created_at, reminder_sent_at, …): ISO-8601 with offset
    (`2026-08-23T14:30:00+02:00`).
  - Appointment slots stay `date` + `start_time`/`end_time` (`HH:MM`) pairs in
    business timezone — this matches the DB schema and the booking domain, where
    "10:00 at the salon" is the ground truth, not a UTC instant.
  - Every authenticated response envelope exposes the business timezone via `/me`;
    the app does all math with Luxon in that zone.
- **Errors:**
  - `401` unauthenticated, `403` permission or cross-tenant, `404` not found,
    `422` validation `{message, errors: {field: [msg]}}` (Laravel default),
    `429` throttled.
  - Domain errors: `409 {message, code}` (e.g. `slot_taken`).
- **Versioning:** breaking changes → `/api/v2`. Additive changes are fine in v1.
- **Pagination:** Laravel paginator JSON (`data`, `links`, `meta`) wherever the web
  screen paginates today.
- **Permissions:** same `permission:` middleware and `Permission` enum as web.
  `/me` returns `effectivePermissionKeys()` so the app renders the same nav
  gating as `AdminLayout`/`EmployeeLayout`.

## Screen-shaped, not resource-shaped

Each screen gets one primary GET that returns exactly what the Inertia page gets
today (same service call, same array), so screens need one request. Mutations are
conventional REST on the same paths as web.

---

## 1. Auth & session

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/login` | `{email, password, device_name}` → `{token, user}`. Rejects unverified email (`403 email_unverified`) and suspended business. Throttled. |
| DELETE | `/auth/logout` | Revokes current token and its device registration. |
| GET | `/me` | `{user, business, permissions[], locale, features}` — the app's boot payload. `business` includes `timezone`, `currency_symbol`, `uses_shared_resources`, `allow_employee_service_edit`, `auto_confirm_appointments`. `features` flags what nav to show (mirrors `hasAdminPanelAccess`). |
| PATCH | `/me` | Profile update (reuses `ProfileUpdateRequest`). |
| PUT | `/me/password` | Current + new password. Revokes other tokens. |
| PUT | `/me/locale` | `{locale: sq|en}`. |

No `/auth/register` in v1 — account creation and onboarding stay on web.
Password reset links to the web flow.

## 2. Devices & push

| Method | Path | Notes |
|---|---|---|
| POST | `/devices` | `{expo_push_token, platform: ios|android, device_name}`. Upserts by token, binds to current Sanctum token id so logout can clean up. |
| DELETE | `/devices` | `{expo_push_token}` — unregister on logout/uninstall. |

Push payloads carry `{type: 'appointment.created'|'appointment.cancelled'|…, appointment_id, date}` for deep links (`nitermin://appointments/{id}`).

## 3. App config

| Method | Path | Notes |
|---|---|---|
| GET | `/translations?locale=sq` | Flattened `lang/{locale}` groups the app needs. ETag/304 so it's cached on disk. |

## 4. Employee area

Middleware: `auth:sanctum`, `employee_area`, `onboarding_completed`, plus the same
`permission:` checks as `routes/web.php`.

| Method | Path | Mirrors (web) | Service |
|---|---|---|---|
| GET | `/employee/dashboard?date_from&date_to&service_id` | `employee.dashboard` | `DashboardService::getEmployeeDashboardData` |
| GET | `/employee/appointments?…filters` | `employee.appointments.index` | same as controller (paginated) |
| GET | `/employee/appointments/calendar?view&date` | `employee.appointments.calendar` | `AppointmentService::getCalendarView` |
| GET | `/employee/appointments/create` | create-form data | services + clients bootstrap |
| POST | `/employee/appointments` | store | `AppointmentService` |
| PATCH | `/employee/appointments/{id}` | status update | `updateEmployeeAppointmentStatus` |
| PUT | `/employee/appointments/{id}` | edit | `updateEmployeeOwnAppointment` |
| GET | `/employee/appointments/{id}/slots` | reschedule slots | |
| PUT | `/employee/appointments/{id}/reschedule` | reschedule | `rescheduleEmployeeOwnAppointment` |
| GET | `/employee/appointments/internal-slots` | internal slots | |
| GET | `/employee/schedule?date_from&date_to` | overrides view | `ScheduleService` |
| PUT | `/employee/schedule/overrides` | save overrides | `ScheduleService::saveOverrides` |
| GET | `/employee/schedule/configuration` | base weekly | `ScheduleService::getSchedules` |
| PUT | `/employee/schedule/configuration` | update base weekly | `ScheduleService::updateSchedules` |
| PATCH | `/employee/schedule/configuration/info` | title/slug info | |
| GET | `/employee/analytics?…` | analytics | `EmployeeAnalyticsService` |
| GET | `/employee/notifications?scope&page&per_page` | bell feed | web `NotificationController::feed` (shared) |
| POST | `/employee/notifications/read-all` | | |
| POST | `/employee/notifications/{id}/read` | | |

Exports (`CSV`/`PDF`) are **not** in v1 API — v1 app links to authenticated web
export URLs opened via the system browser/share sheet.

## 5. Admin area

Middleware: `auth:sanctum`, `admin_panel`, `onboarding_completed`, `has_business`,
plus `permission:` per group.

| Method | Path | Mirrors (web) |
|---|---|---|
| GET | `/admin/dashboard` | `DashboardService::getAdminDashboardData` |
| GET | `/admin/appointments?…filters` | paginated list |
| GET | `/admin/appointments/calendar?view&date&…` | calendar (day/week) |
| GET | `/admin/appointments/create` | form bootstrap (employees, services, resources) |
| POST | `/admin/appointments` | store |
| PATCH | `/admin/appointments/{id}` | status |
| PUT | `/admin/appointments/{id}` | edit |
| DELETE | `/admin/appointments/{id}` | delete (only `cancelled`; else `422`) |
| GET | `/admin/appointments/slots` / `internal-slots` | slot pickers |
| GET/POST/PUT/DELETE | `/admin/employees[/{id}]` | employees CRUD |
| GET/POST/PUT/DELETE | `/admin/services[/{id}]` | services CRUD |
| GET/POST/PUT/DELETE | `/admin/shared-resources[/{id}]` | gated by `business_uses_shared_resources` |
| GET/POST/PUT/DELETE | `/admin/roles[/{id}]` | business roles CRUD |
| GET | `/admin/analytics?…` | analytics |
| GET | `/admin/settings` | settings payload |
| PUT | `/admin/settings` | update settings |

## 6. Response shapes

Shapes are 1:1 with what the Inertia pages receive today (the services already
return screen-shaped arrays). Divergences from web are handled with
`API Resources` only where the web payload leaks Eloquent internals; otherwise
the service array is returned as-is. Shapes get locked by feature tests per
endpoint (`tests/Feature/Api/…`), which serve as the machine-checked contract.

Appointment (canonical, used everywhere):

```json
{
  "id": 123,
  "date": "2026-08-23",
  "start_time": "10:00",
  "end_time": "10:45",
  "status": "confirmed",
  "service_id": 4,
  "service_name": "Haircut",
  "employee_id": 7,
  "employee_name": "Arta",
  "client_name": "…",
  "client_phone": "…",
  "client_email": "…",
  "price": 12.5,
  "notes": "…",
  "booking_reference": "uuid",
  "created_at": "2026-08-20T09:12:00+02:00"
}
```

## 7. Non-goals for v1

- SuperAdmin endpoints (web only)
- Public booking endpoints (web only, already public)
- Registration/onboarding (web only)
- CSV/PDF generation via API (web URLs)
