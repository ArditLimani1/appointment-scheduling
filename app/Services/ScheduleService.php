<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Interfaces\ScheduleOverrideRepositoryInterface;
use App\Repositories\Interfaces\ScheduleRepositoryInterface;
use App\Services\Interfaces\ScheduleServiceInterface;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;

class ScheduleService implements ScheduleServiceInterface
{
    public function __construct(
        private ScheduleRepositoryInterface $scheduleRepository,
        private ScheduleOverrideRepositoryInterface $scheduleOverrideRepository,
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
                    'user_id'     => $user->id,
                    'day_of_week' => $scheduleData['day_of_week'],
                ],
                [
                    'start_time' => $scheduleData['start_time'] ?? '09:00',
                    'end_time'   => $scheduleData['end_time'] ?? '17:00',
                    'is_active'  => $scheduleData['is_active'],
                ]
            );

            $this->scheduleRepository->deleteBreaks($schedule);

            if (! empty($scheduleData['breaks'])) {
                foreach ($scheduleData['breaks'] as $breakData) {
                    $this->scheduleRepository->createBreak($schedule, [
                        'start_time' => $breakData['start_time'],
                        'end_time'   => $breakData['end_time'],
                    ]);
                }
            }
        }
    }

    /**
     * Build a 7-day array for the given date range.
     * Each day is pre-filled from an existing override (if any) or from the base weekly schedule.
     */
    public function getDaysForRange(User $user, string $dateFrom, string $dateTo): array
    {
        $normalize = fn ($t) => $t ? substr((string) $t, 0, 5) : '09:00';

        $baseSchedules = $this->scheduleRepository->getByUser($user->id)->keyBy('day_of_week');

        $overrides = $this->scheduleOverrideRepository
            ->getByUserAndDateRange($user->id, $dateFrom, $dateTo)
            ->keyBy(fn ($o) => $o->date->format('Y-m-d'));

        $days   = [];
        $cursor = Carbon::parse($dateFrom)->startOfDay();
        $end    = Carbon::parse($dateTo)->startOfDay();

        while ($cursor->lte($end)) {
            $dateStr   = $cursor->toDateString();
            $dayOfWeek = $cursor->dayOfWeekIso - 1; // 0=Mon … 6=Sun

            if (isset($overrides[$dateStr])) {
                $o      = $overrides[$dateStr];
                $days[] = [
                    'date'         => $dateStr,
                    'day_of_week'  => $dayOfWeek,
                    'day_label'    => $cursor->format('l'),
                    'is_active'    => $o->is_active,
                    'start_time'   => $normalize($o->start_time),
                    'end_time'     => $normalize($o->end_time),
                    'breaks'       => $o->breaks->map(fn ($b) => [
                        'start_time' => $normalize($b->start_time),
                        'end_time'   => $normalize($b->end_time),
                    ])->values()->all(),
                    'is_overridden' => true,
                ];
            } elseif (isset($baseSchedules[$dayOfWeek])) {
                $base   = $baseSchedules[$dayOfWeek];
                $days[] = [
                    'date'         => $dateStr,
                    'day_of_week'  => $dayOfWeek,
                    'day_label'    => $cursor->format('l'),
                    'is_active'    => $base->is_active,
                    'start_time'   => $normalize($base->start_time),
                    'end_time'     => $normalize($base->end_time),
                    'breaks'       => $base->breaks->map(fn ($b) => [
                        'start_time' => $normalize($b->start_time),
                        'end_time'   => $normalize($b->end_time),
                    ])->values()->all(),
                    'is_overridden' => false,
                ];
            } else {
                $days[] = [
                    'date'         => $dateStr,
                    'day_of_week'  => $dayOfWeek,
                    'day_label'    => $cursor->format('l'),
                    'is_active'    => false,
                    'start_time'   => '09:00',
                    'end_time'     => '17:00',
                    'breaks'       => [],
                    'is_overridden' => false,
                ];
            }

            $cursor->addDay();
        }

        return $days;
    }

    /**
     * Persist overrides for a week.
     * - is_overridden = true  → upsert override record + replace breaks
     * - is_overridden = false → delete override for that date (fall back to base schedule)
     */
    public function saveOverrides(User $user, array $data): void
    {
        foreach ($data['days'] as $dayData) {
            if (! ($dayData['is_overridden'] ?? false)) {
                // Remove any existing override → revert to base schedule
                $this->scheduleOverrideRepository->deleteForDate($user->id, $dayData['date']);
                continue;
            }

            $override = $this->scheduleOverrideRepository->upsertForDate(
                $user->id,
                $dayData['date'],
                [
                    'is_active'  => $dayData['is_active'],
                    'start_time' => $dayData['start_time'] ?? '09:00',
                    'end_time'   => $dayData['end_time']   ?? '17:00',
                ]
            );

            $this->scheduleOverrideRepository->deleteBreaks($override);

            foreach ($dayData['breaks'] ?? [] as $breakData) {
                $this->scheduleOverrideRepository->createBreak($override, [
                    'start_time' => $breakData['start_time'],
                    'end_time'   => $breakData['end_time'],
                ]);
            }
        }
    }
}
