<?php

namespace App\Notifications;

use App\Notifications\Channels\ExpoPushChannel;
use Illuminate\Notifications\Notification;

class NewAppointmentsAssignedToEmployee extends Notification
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public readonly array $payload,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database', ExpoPushChannel::class];
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        return $this->payload;
    }

    /**
     * @return array{title: string, body: string, data: array<string, mixed>}
     */
    public function toExpoPush(object $notifiable): array
    {
        $locale = method_exists($notifiable, 'preferredLocale')
            ? $notifiable->preferredLocale()
            : app()->getLocale();

        $serviceNames = collect($this->payload['services'] ?? [])
            ->pluck('name')
            ->filter()
            ->implode(', ');

        return [
            'title' => __('messages.push.new_appointment_title', [], $locale),
            'body' => __('messages.push.new_appointment_body', [
                'client' => $this->payload['client_name'] ?? '',
                'service' => $serviceNames,
                'date' => $this->payload['date'] ?? '',
                'time' => $this->payload['start_time'] ?? '',
            ], $locale),
            'data' => [
                'type' => 'appointment.created',
                'appointment_ids' => $this->payload['appointment_ids'] ?? [],
                'date' => $this->payload['date'] ?? null,
            ],
        ];
    }
}
