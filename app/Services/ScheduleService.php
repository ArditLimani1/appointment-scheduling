<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Business;
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

        $days = [];
        $cursor = Carbon::parse($dateFrom)->startOfDay();
        $end = Carbon::parse($dateTo)->startOfDay();

        while ($cursor->lte($end)) {
            $dateStr = $cursor->toDateString();
            $dayOfWeek = $cursor->dayOfWeekIso - 1; // 0=Mon … 6=Sun

            if (isset($overrides[$dateStr])) {
                $o = $overrides[$dateStr];
                $days[] = [
                    'date' => $dateStr,
                    'day_of_week' => $dayOfWeek,
                    'day_label' => $cursor->format('l'),
                    'is_active' => $o->is_active,
                    'start_time' => $normalize($o->start_time),
                    'end_time' => $normalize($o->end_time),
                    'breaks' => $o->breaks->map(fn ($b) => [
                        'start_time' => $normalize($b->start_time),
                        'end_time' => $normalize($b->end_time),
                    ])->values()->all(),
                    'is_overridden' => true,
                ];
            } elseif (isset($baseSchedules[$dayOfWeek])) {
                $base = $baseSchedules[$dayOfWeek];
                $days[] = [
                    'date' => $dateStr,
                    'day_of_week' => $dayOfWeek,
                    'day_label' => $cursor->format('l'),
                    'is_active' => $base->is_active,
                    'start_time' => $normalize($base->start_time),
                    'end_time' => $normalize($base->end_time),
                    'breaks' => $base->breaks->map(fn ($b) => [
                        'start_time' => $normalize($b->start_time),
                        'end_time' => $normalize($b->end_time),
                    ])->values()->all(),
                    'is_overridden' => false,
                ];
            } else {
                $days[] = [
                    'date' => $dateStr,
                    'day_of_week' => $dayOfWeek,
                    'day_label' => $cursor->format('l'),
                    'is_active' => false,
                    'start_time' => '09:00',
                    'end_time' => '17:00',
                    'breaks' => [],
                    'is_overridden' => false,
                ];
            }

            $cursor->addDay();
        }

        $appointmentsByDate = Appointment::query()
            ->where('employee_id', $user->id)
            ->whereDate('date', '>=', $dateFrom)
            ->whereDate('date', '<=', $dateTo)
            ->with(['service'])
            ->orderBy('start_time')
            ->get()
            ->groupBy(fn (Appointment $a) => $a->date->format('Y-m-d'));

        foreach ($days as $i => $day) {
            $dateKey = $day['date'];
            $items = $appointmentsByDate->get($dateKey, collect());
            $days[$i]['appointments'] = $items
                ->map(fn (Appointment $a) => [
                    'id' => $a->id,
                    'client_name' => trim($a->client_first_name.' '.$a->client_last_name),
                    'service_name' => $a->service?->name ?? '',
                    'status' => $a->status->value,
                    'start_time' => $normalize($a->start_time),
                ])
                ->values()
                ->all();
        }

        return $days;
    }

    public function getBreakIntervalsKeyedByDate(User $user, string $dateFrom, string $dateTo): array
    {
        $days = $this->getDaysForRange($user, $dateFrom, $dateTo);
        $out = [];
        foreach ($days as $day) {
            $dateKey = $day['date'];
            if (! ($day['is_active'] ?? false)) {
                $out[$dateKey] = [];

                continue;
            }
            $intervals = [];
            foreach ($day['breaks'] ?? [] as $b) {
                $intervals[] = [
                    'start' => $b['start_time'],
                    'end' => $b['end_time'],
                ];
            }
            $out[$dateKey] = $intervals;
        }

        return $out;
    }

    public function getMergedBreakIntervalsForBusiness(Business $business, string $dateFrom, string $dateTo): array
    {
        $out = [];
        foreach ($business->employees()->get() as $user) {
            $per = $this->getBreakIntervalsKeyedByDate($user, $dateFrom, $dateTo);
            foreach ($per as $date => $intervals) {
                if (! isset($out[$date])) {
                    $out[$date] = [];
                }
                foreach ($intervals as $iv) {
                    $out[$date][] = $iv;
                }
            }
        }

        return $out;
    }

    public function getDayOffDatesForRange(User $user, string $dateFrom, string $dateTo): array
    {
        $days = $this->getDaysForRange($user, $dateFrom, $dateTo);

        return array_values(array_map(
            fn (array $day) => $day['date'],
            array_values(array_filter($days, fn (array $day) => ! ($day['is_active'] ?? false)))
        ));
    }

    public function getCalendarBreakAndDayOffMapsForEmployees(Business $business, string $dateFrom, string $dateTo): array
    {
        $breaks = [];
        $dayOffs = [];
        foreach ($business->employees()->get() as $user) {
            $key = (string) $user->id;
            $breaks[$key] = $this->getBreakIntervalsKeyedByDate($user, $dateFrom, $dateTo);
            $dayOffs[$key] = $this->getDayOffDatesForRange($user, $dateFrom, $dateTo);
        }

        return ['breaks' => $breaks, 'day_offs' => $dayOffs];
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
                    'is_active' => $dayData['is_active'],
                    'start_time' => $dayData['start_time'] ?? '09:00',
                    'end_time' => $dayData['end_time'] ?? '17:00',
                ]
            );

            $this->scheduleOverrideRepository->deleteBreaks($override);

            foreach ($dayData['breaks'] ?? [] as $breakData) {
                $this->scheduleOverrideRepository->createBreak($override, [
                    'start_time' => $breakData['start_time'],
                    'end_time' => $breakData['end_time'],
                ]);
            }
        }
    }
}
