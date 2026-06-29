<?php

namespace App\Mail;

use Carbon\Carbon;
use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CustomerAppointmentUpdateMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  list<array{type:string,from:?string,to:?string}>  $changes
     */
    public function __construct(
        public readonly Appointment $appointment,
        public readonly string $notificationType,
        protected readonly array $rawChanges = [],
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subjectForType(),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.appointments.customer-update',
            with: [
                'appointment' => $this->appointment,
                'notificationType' => $this->notificationType,
                'localizedChanges' => $this->localizedChanges(),
                'subjectLine' => $this->subjectForType(),
            ],
        );
    }

    private function subjectForType(): string
    {
        $businessName = $this->appointment->business?->name ?? 'NiTermin';

        return match ($this->notificationType) {
            'cancelled' => __('mail.appointment_update.subject_cancelled', ['business' => $businessName]),
            'confirmed' => __('mail.appointment_update.subject_confirmed', ['business' => $businessName]),
            'rescheduled' => __('mail.appointment_update.subject_rescheduled', ['business' => $businessName]),
            default => __('mail.appointment_update.subject_updated', ['business' => $businessName]),
        };
    }

    /**
     * @return list<string>
     */
    private function localizedChanges(): array
    {
        return array_values(array_filter(array_map(function (array $change): ?string {
            $type = (string) ($change['type'] ?? '');

            if ($type === '') {
                return null;
            }

            return __('mail.appointment_update.change_'.$type, [
                'from' => '<strong>'.e($this->formatChangeValue($type, $change['from'] ?? null)).'</strong>',
                'to' => '<strong>'.e($this->formatChangeValue($type, $change['to'] ?? null)).'</strong>',
            ]);
        }, $this->rawChanges)));
    }

    private function formatChangeValue(string $type, ?string $value): string
    {
        return match ($type) {
            'date' => $this->formatDateValue($value),
            'time' => $this->formatTimeValue($value),
            'status' => $this->formatStatusValue($value),
            default => filled($value) ? $value : __('common.dash'),
        };
    }

    private function formatDateValue(?string $value): string
    {
        if (! filled($value)) {
            return __('common.dash');
        }

        return Carbon::parse($value)->locale(app()->getLocale())->translatedFormat('d M Y');
    }

    private function formatTimeValue(?string $value): string
    {
        if (! filled($value)) {
            return __('common.dash');
        }

        return Carbon::parse($value)->format('H:i');
    }

    private function formatStatusValue(?string $value): string
    {
        if (! filled($value)) {
            return __('common.dash');
        }

        return __('common.status.'.$value);
    }
}
