<?php

namespace App\Support;

use Illuminate\Validation\Rule;

class ClientIdentification
{
    public static function whatsappEnabled(): bool
    {
        return (bool) config('features.whatsapp', false);
    }

    public static function resolve(?string $storedType): string
    {
        if (! self::whatsappEnabled()) {
            return 'email';
        }

        return $storedType === 'email' ? 'email' : 'phone';
    }

    /**
     * Validation rules for persisting client_identifier_type on a business.
     *
     * @return array<int, string>
     */
    public static function storedTypeRules(bool $required = true): array
    {
        $allowed = self::whatsappEnabled()
            ? ['phone', 'email']
            : ['email'];

        $inRule = Rule::in($allowed);

        return $required
            ? ['required', $inRule]
            : ['sometimes', 'required', $inRule];
    }

    /**
     * @param  bool  $requirePhoneCountryCode  Force a leading `+`; WhatsApp cannot deliver without it.
     * @return array{client_phone: array<int, mixed>, client_email: array<int, mixed>}
     */
    public static function clientFieldRules(?string $storedType, bool $requirePhoneCountryCode = false): array
    {
        $identifierType = self::resolve($storedType);
        $phoneRegex = $requirePhoneCountryCode
            ? 'regex:/^\+[0-9]{6,20}$/'
            : 'regex:/^\+?[0-9]{6,20}$/';

        return [
            'client_phone' => $identifierType === 'phone'
                ? ['required', 'string', $phoneRegex]
                : ['nullable', 'string', 'max:50'],
            'client_email' => $identifierType === 'email'
                ? ['required', 'string', 'email:rfc', 'max:255', 'regex:/^[^<>"\'`]+$/u']
                : ['nullable', 'string', 'max:255'],
        ];
    }
}
