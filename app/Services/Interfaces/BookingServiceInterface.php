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

    public function getConfirmation(Appointment $appointment): array;

    /**
     * @param  array<string, mixed>  $data  `employee_id`, `service_id`, `date`, optional `exclude_id`, optional `ignore_schedule_breaks` (bool: employee self-service may book during own schedule breaks).
     */
    public function getAdminAvailableSlots(Business $business, array $data): array;
}
