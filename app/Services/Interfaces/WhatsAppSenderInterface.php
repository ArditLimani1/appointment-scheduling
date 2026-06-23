<?php

namespace App\Services\Interfaces;

interface WhatsAppSenderInterface
{
    public function isConfigured(): bool;

    public function sendBookingConfirmation(string $toE164, string $date, string $time): bool;
}
