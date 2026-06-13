<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TwilioWhatsAppService
{
    public function isConfigured(): bool
    {
        return filled(config('services.twilio.sid'))
            && filled(config('services.twilio.token'))
            && filled(config('services.twilio.whatsapp_from'));
    }

    public function send(string $toE164, string $body): bool
    {
        return $this->post($toE164, ['Body' => $body]);
    }

    /**
     * @param  array<string, string>  $variables
     */
    public function sendTemplate(string $toE164, string $contentSid, array $variables = []): bool
    {
        $payload = ['ContentSid' => $contentSid];
        if ($variables !== []) {
            $payload['ContentVariables'] = json_encode($variables, JSON_UNESCAPED_UNICODE);
        }

        return $this->post($toE164, $payload);
    }

    /**
     * @param  array<string, string>  $payload
     */
    private function post(string $toE164, array $payload): bool
    {
        if (! $this->isConfigured()) {
            Log::warning('TwilioWhatsApp: missing credentials, skipping send.');

            return false;
        }

        $sid = (string) config('services.twilio.sid');
        $token = (string) config('services.twilio.token');
        $from = $this->normalize((string) config('services.twilio.whatsapp_from'));
        $to = $this->normalize($toE164);

        $response = Http::asForm()
            ->withBasicAuth($sid, $token)
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", array_merge([
                'From' => "whatsapp:{$from}",
                'To' => "whatsapp:{$to}",
            ], $payload));

        if ($response->failed()) {
            Log::warning('TwilioWhatsApp: send failed.', [
                'to' => $to,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return false;
        }

        return true;
    }

    private function normalize(string $number): string
    {
        $trimmed = trim($number);

        return str_starts_with($trimmed, '+') ? $trimmed : '+'.ltrim($trimmed, '+');
    }
}
