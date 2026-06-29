<?php

namespace App\Events;

use App\Models\Appointment;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AppointmentCustomerNotificationRequested
{
    use Dispatchable, SerializesModels;

    public bool $afterCommit = true;

    /**
     * @param  list<array{type:string,from:?string,to:?string}>  $changes
     */
    public function __construct(
        public readonly Appointment $appointment,
        public readonly string $notificationType,
        public readonly array $changes = [],
    ) {}
}
