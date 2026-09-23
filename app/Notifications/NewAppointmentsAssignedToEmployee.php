<?php

namespace App\Notifications;

use App\Notifications\Channels\WebPushChannel;
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
        return ['database', WebPushChannel::class];
    }

    /**
     * @return array<string, mixed>
     */
    public function toWebPush(object $notifiable): array
    {
        $when = trim(($this->payload['date'] ?? '').' '.substr((string) ($this->payload['start_time'] ?? ''), 0, 5));
        $services = collect($this->payload['services'] ?? [])->pluck('name')->filter()->implode(', ');

        return [
            'title' => __('messages.push.new_appointment_title'),
            'body' => trim(($this->payload['client_name'] ?? '').' · '.$when.($services !== '' ? ' · '.$services : ''), ' ·'),
            'url' => $notifiable->isAdmin() ? route('admin.appointments.index', [], false) : route('employee.appointments.index', [], false),
            'tag' => 'appointment-'.($this->payload['booking_reference'] ?? uniqid()),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        return $this->payload;
    }
}
