<?php

namespace App\Services;

use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\RequestException;
use RuntimeException;

class TwilioWhatsAppClient
{
    public function __construct(
        private readonly HttpFactory $http,
    ) {}

    /**
     * @param  array<string, string>  $parameters
     * @return array<string, mixed>
     */
    public function sendMessage(string $to, array $parameters): array
    {
        $accountSid = (string) config('services.twilio.account_sid');
        $authToken = (string) config('services.twilio.auth_token');
        $from = (string) config('services.twilio.whatsapp_from');

        if ($accountSid === '' || $authToken === '' || $from === '') {
            throw new RuntimeException('Twilio WhatsApp credentials are not configured.');
        }

        $response = $this->http
            ->asForm()
            ->withBasicAuth($accountSid, $authToken)
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$accountSid}/Messages.json", array_merge([
                'From' => $this->formatWhatsAppAddress($from),
                'To' => $this->formatWhatsAppAddress($to),
            ], $parameters));

        try {
            $response->throw();
        } catch (RequestException $exception) {
            report($exception);

            throw $exception;
        }

        return $response->json();
    }

    private function formatWhatsAppAddress(string $phoneNumber): string
    {
        $trimmed = trim($phoneNumber);
        $normalized = preg_replace(
            '/[^\d+]/',
            '',
            str_starts_with($trimmed, 'whatsapp:') ? substr($trimmed, 9) : $trimmed,
        ) ?? '';

        if ($normalized === '') {
            throw new RuntimeException('Invalid WhatsApp phone number.');
        }

        return 'whatsapp:'.$normalized;
    }
}
