<?php

namespace App\Services;

use App\Services\Interfaces\WhatsAppSenderInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MetaWhatsAppService implements WhatsAppSenderInterface
{
    public function isConfigured(): bool
    {
        if (! config('features.whatsapp', false)) {
            return false;
        }

        return filled(config('services.meta_whatsapp.token'))
            && filled(config('services.meta_whatsapp.phone_number_id'));
    }

    public function sendBookingConfirmation(string $toE164, string $businessName, string $date, string $time, string $contact): bool
    {
        return $this->sendConfiguredTemplate('booking_template', $toE164, [$businessName, $date, $time, $contact]);
    }

    public function sendBookingUpdate(string $toE164, string $businessName, string $date, string $time, string $contact): bool
    {
        return $this->sendConfiguredTemplate('update_template', $toE164, [$businessName, $date, $time, $contact]);
    }

    public function sendBookingCancellation(string $toE164, string $businessName, string $date, string $time, string $contact): bool
    {
        return $this->sendConfiguredTemplate('cancellation_template', $toE164, [$businessName, $date, $time, $contact]);
    }

    public function sendBookingReminder(string $toE164, string $businessName, string $date, string $time, string $contact): bool
    {
        return $this->sendConfiguredTemplate('reminder_template', $toE164, [$businessName, $date, $time, $contact]);
    }

    /**
     * @param  list<string>  $bodyParams
     */
    private function sendConfiguredTemplate(string $configKey, string $toE164, array $bodyParams): bool
    {
        $template = (string) config("services.meta_whatsapp.{$configKey}");
        if ($template === '') {
            return false;
        }

        $language = (string) config('services.meta_whatsapp.booking_template_lang', 'en');

        return $this->sendTemplate($toE164, $template, $language, $bodyParams);
    }

    public function sendTemplate(string $toE164, string $templateName, string $languageCode, array $bodyParams = []): bool
    {
        if (! $this->isConfigured()) {
            Log::warning('MetaWhatsApp: missing credentials, skipping send.');

            return false;
        }

        $token = (string) config('services.meta_whatsapp.token');
        $phoneNumberId = (string) config('services.meta_whatsapp.phone_number_id');
        $version = (string) config('services.meta_whatsapp.api_version', 'v21.0');
        $to = $this->normalize($toE164);

        $components = [];
        if ($bodyParams !== []) {
            $components[] = [
                'type' => 'body',
                'parameters' => array_map(
                    fn (string $value): array => ['type' => 'text', 'text' => $value],
                    $bodyParams
                ),
            ];
        }

        $response = Http::withToken($token)
            ->post("https://graph.facebook.com/{$version}/{$phoneNumberId}/messages", [
                'messaging_product' => 'whatsapp',
                'recipient_type' => 'individual',
                'to' => $to,
                'type' => 'template',
                'template' => [
                    'name' => $templateName,
                    'language' => ['code' => $languageCode],
                    'components' => $components,
                ],
            ]);

        if ($response->failed()) {
            Log::warning('MetaWhatsApp: send failed.', [
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
        return (string) preg_replace('/\D+/', '', $number);
    }
}
