<?php

namespace App\Services\Interfaces;

interface WhatsAppSenderInterface
{
    public function isConfigured(): bool;

    public function sendBookingConfirmation(string $toE164, string $businessName, string $date, string $time, string $contact): bool;

    public function sendBookingUpdate(string $toE164, string $businessName, string $date, string $time, string $contact): bool;

    public function sendBookingCancellation(string $toE164, string $businessName, string $date, string $time, string $contact): bool;

    public function sendBookingReminder(string $toE164, string $businessName, string $date, string $time, string $contact): bool;
}
