<?php

namespace App\Services\Interfaces;

use App\Models\Appointment;

interface BookingServiceInterface
{
    public function getBookingPageData(string $slug): array;

    public function getAvailableSlots(string $slug, array $data): array;

    public function createBooking(string $slug, array $data): Appointment;

    public function getConfirmation(Appointment $appointment): array;
}
