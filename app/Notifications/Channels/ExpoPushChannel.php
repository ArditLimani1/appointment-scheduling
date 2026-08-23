<?php

namespace App\Notifications\Channels;

use App\Models\DeviceToken;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Sends notifications to the mobile app through Expo's push service.
 * Notifications opt in by returning 'expo' from via() and implementing
 * toExpoPush(object $notifiable): array{title: string, body: string, data?: array}.
 */
class ExpoPushChannel
{
    private const ENDPOINT = 'https://exp.host/--/api/v2/push/send';

    public function send(object $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toExpoPush') || ! method_exists($notifiable, 'deviceTokens')) {
            return;
        }

        $tokens = $notifiable->deviceTokens()->pluck('expo_push_token');
        if ($tokens->isEmpty()) {
            return;
        }

        $message = $notification->toExpoPush($notifiable);

        $payload = $tokens->map(fn (string $token) => [
            'to' => $token,
            'title' => $message['title'],
            'body' => $message['body'],
            'data' => $message['data'] ?? [],
            'sound' => 'default',
            'priority' => 'high',
        ])->values()->all();

        try {
            $response = Http::acceptJson()->post(self::ENDPOINT, $payload);
        } catch (\Throwable $e) {
            Log::warning('Expo push failed', ['error' => $e->getMessage()]);

            return;
        }

        // Prune tokens Expo reports as dead so we stop pushing to uninstalled apps.
        foreach ($response->json('data', []) as $i => $ticket) {
            $isDead = ($ticket['status'] ?? null) === 'error'
                && ($ticket['details']['error'] ?? null) === 'DeviceNotRegistered';
            if ($isDead && isset($payload[$i]['to'])) {
                DeviceToken::query()->where('expo_push_token', $payload[$i]['to'])->delete();
            }
        }
    }
}
