<?php

namespace App\Http\Requests\Concerns;

/**
 * Shared sanitisation helpers for any FormRequest that accepts the booking
 * client fields (first/last name, phone, notes). Used by the public
 * StoreBookingRequest and the internal admin/employee equivalent so both
 * paths normalise identically.
 */
trait SanitizesBookingClientFields
{
    protected function sanitizeBookingPlainText(string $value, int $max): string
    {
        $value = strip_tags($value);
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';

        return mb_substr(trim($value), 0, $max, 'UTF-8');
    }

    protected function sanitizeBookingNotes(string $value, int $max): string
    {
        $value = str_replace(["\r\n", "\r"], "\n", $value);

        return $this->sanitizeBookingPlainText($value, $max);
    }

    protected function normalizeBookingPhone(string $value): string
    {
        $value = trim($value);
        $digits = preg_replace('/\D+/', '', $value) ?? '';
        if ($digits === '') {
            return '';
        }

        return str_starts_with($value, '+') ? '+'.$digits : $digits;
    }
}
