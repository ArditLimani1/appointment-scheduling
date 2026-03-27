<?php

namespace App\Services\Interfaces;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

interface ScheduleServiceInterface
{
    public function getSchedules(User $user): Collection;

    public function updateSchedules(User $user, array $data): void;
}
