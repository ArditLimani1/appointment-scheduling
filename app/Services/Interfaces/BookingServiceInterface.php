<?php

namespace App\Services\Interfaces;

use App\Models\Appointment;
use App\Models\Business;
use Illuminate\Support\Collection;

interface BookingServiceInterface
{
    public function getBookingPageData(string $slug, ?string $employeeSlug = null): array;

    public function getAvailableSlots(string $slug, array $data): array;

    /**
     * @return Collection<int, Appointment>
     */
    public function createBooking(string $slug, array $data): Collection;

    public function getConfirmationByReference(string $reference): array;

    /**
     * @param  array<string, mixed>  $data  `employee_id`, `service_id`, `date`, optional `exclude_id`, optional `ignore_schedule_breaks` (bool, default false: when true, scheduled breaks are ignored for slot generation).
     */
    public function getAdminAvailableSlots(Business $business, array $data): array;

    /**
     * Internal create flow used by admin and employee panels. Bypasses
     * `min_booking_notice` and `max_booking_window`; still enforces
     * schedule, breaks, overlaps and shared resources.
     *
     * @param  array<string, mixed>  $data  `employee_id` (admin only — forced to auth()->id() for employee), `service_ids` (int[]), `date`, `start_time`, plus client fields.
     * @param  'admin'|'employee'  $context
     * @return Collection<int, Appointment>
     */
    public function createInternalBooking(Business $business, array $data, string $context): Collection;

    /**
     * Slots for the internal admin/employee create flow.
     * Bypasses `min_booking_notice` and `max_booking_window`.
     *
     * @param  array<string, mixed>  $data  `employee_id` (forced to auth()->id() for employee), `service_ids` (int[]), `date`.
     * @param  'admin'|'employee'  $context
     * @return list<string> HH:mm slot start times.
     */
    public function getInternalAvailableSlots(Business $business, array $data, string $context): array;
}
