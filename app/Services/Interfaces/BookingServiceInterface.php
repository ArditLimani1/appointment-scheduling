<?php

namespace App\Services\Interfaces;

use App\Models\Appointment;
use Illuminate\Support\Collection;

interface BookingServiceInterface
{
    public function getBookingPageData(string $slug): array;

    public function getAvailableSlots(string $slug, array $data): array;

    /**
     * @return Collection<int, Appointment>
     */
    public function createBooking(string $slug, array $data): Collection;

    public function getConfirmation(Appointment $appointment): array;
}
