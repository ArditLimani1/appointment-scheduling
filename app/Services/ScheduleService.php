<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Interfaces\ScheduleRepositoryInterface;
use App\Services\Interfaces\ScheduleServiceInterface;
use Illuminate\Database\Eloquent\Collection;

class ScheduleService implements ScheduleServiceInterface
{
    public function __construct(
        private ScheduleRepositoryInterface $scheduleRepository,
    ) {}

    public function getSchedules(User $user): Collection
    {
        return $this->scheduleRepository->getByUser($user->id);
    }

    public function updateSchedules(User $user, array $data): void
    {
        foreach ($data['schedules'] as $scheduleData) {
            $schedule = $this->scheduleRepository->updateOrCreate(
                [
                    'user_id' => $user->id,
                    'day_of_week' => $scheduleData['day_of_week'],
                ],
                [
                    'start_time' => $scheduleData['start_time'] ?? '09:00',
                    'end_time' => $scheduleData['end_time'] ?? '17:00',
                    'is_active' => $scheduleData['is_active'],
                ]
            );

            $this->scheduleRepository->deleteBreaks($schedule);

            if (! empty($scheduleData['breaks'])) {
                foreach ($scheduleData['breaks'] as $breakData) {
                    $this->scheduleRepository->createBreak($schedule, [
                        'start_time' => $breakData['start_time'],
                        'end_time' => $breakData['end_time'],
                    ]);
                }
            }
        }
    }
}
