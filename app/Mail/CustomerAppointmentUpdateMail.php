<?php

namespace App\Mail;

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
     * @param  array<string, mixed>  $changes
     */
    public function __construct(
        public readonly Appointment $appointment,
        public readonly string $notificationType,
        public readonly array $changes = [],
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
                'changes' => $this->changes,
                'subjectLine' => $this->subjectForType(),
            ],
        );
    }

    private function subjectForType(): string
    {
        $businessName = $this->appointment->business?->name ?? 'NiTermin';

        return match ($this->notificationType) {
            'cancelled' => "Your appointment with {$businessName} has been cancelled",
            'confirmed' => "Your appointment with {$businessName} has been confirmed",
            'rescheduled' => "Your appointment with {$businessName} has been rescheduled",
            default => "Your appointment with {$businessName} has been updated",
        };
    }
}
