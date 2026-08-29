<?php

namespace App\Notifications;

use App\Notifications\Channels\ExpoPushChannel;
use Illuminate\Notifications\Notification;

class NewAppointmentsAssignedToEmployee extends Notification
{
    /**
     * @param  array<string, mixed>  $payload
     * @param  bool  $forOtherStaff  True when the recipient is a watcher reading about
     *                               someone else's appointment rather than their own —
     *                               the copy then names the assigned employee.
     */
    public function __construct(
        public readonly array $payload,
        public readonly bool $forOtherStaff = false,
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
        return $this->payload + ['for_other_staff' => $this->forOtherStaff];
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

        $employeeName = (string) ($this->payload['employee_name'] ?? '');

        $useOtherCopy = $this->forOtherStaff && $employeeName !== '';

        return [
            'title' => $useOtherCopy
                ? __('messages.push.new_appointment_for_title', ['employee' => $employeeName], $locale)
                : __('messages.push.new_appointment_title', [], $locale),
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
                'for_other_staff' => $this->forOtherStaff,
            ],
        ];
    }
}
