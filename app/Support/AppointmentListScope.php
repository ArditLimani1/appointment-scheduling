<?php

namespace App\Support;

use App\Models\Business;
use Carbon\Carbon;
use Illuminate\Http\Request;

/**
 * Date scoping for the appointments list. The date pickers bound the window and
 * default to the current month; within that window the scope shows either every
 * appointment (`all`) or only what is still ahead (`upcoming`, the default).
 */
class AppointmentListScope
{
    public const UPCOMING = 'upcoming';

    public const ALL = 'all';

    public static function normalize(mixed $raw): string
    {
        return $raw === self::ALL ? self::ALL : self::UPCOMING;
    }

    /**
     * @return array{scope: string, date_from: string, date_to: string, upcoming_from_date?: string, upcoming_from_time?: string}
     */
    public static function filtersFromRequest(Request $request, ?Business $business): array
    {
        $timezone = $business?->timezone ?: config('app.timezone');
        $now = Carbon::now($timezone);

        $filters = [
            'scope' => self::normalize($request->query('scope')),
            'date_from' => self::parseDate($request->query('date_from')) ?? $now->copy()->startOfMonth()->toDateString(),
            'date_to' => self::parseDate($request->query('date_to')) ?? $now->copy()->endOfMonth()->toDateString(),
        ];

        if ($filters['date_from'] !== null && $filters['date_to'] !== null && $filters['date_from'] > $filters['date_to']) {
            [$filters['date_from'], $filters['date_to']] = [$filters['date_to'], $filters['date_from']];
        }

        if ($filters['scope'] === self::UPCOMING) {
            $filters['upcoming_from_date'] = $now->toDateString();
            $filters['upcoming_from_time'] = $now->format('H:i');
        }

        return $filters;
    }

    /**
     * Keep only appointments that have not finished yet, in the business timezone.
     * `end_time` (not `start_time`) so an appointment in progress stays visible.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<\App\Models\Appointment>  $query
     */
    public static function applyUpcoming($query, array $filters)
    {
        if (self::normalize($filters['scope'] ?? null) !== self::UPCOMING) {
            return $query;
        }

        $fromDate = $filters['upcoming_from_date'] ?? Carbon::now()->toDateString();
        $fromTime = $filters['upcoming_from_time'] ?? '00:00';

        return $query->where(function ($q) use ($fromDate, $fromTime) {
            $q->whereDate('date', '>', $fromDate)
                ->orWhere(function ($sameDay) use ($fromDate, $fromTime) {
                    $sameDay->whereDate('date', '=', $fromDate)
                        ->where('end_time', '>=', $fromTime);
                });
        });
    }

    /** Upcoming reads best soonest-first; history reads best newest-first. */
    public static function applyOrder($query, array $filters)
    {
        return self::normalize($filters['scope'] ?? null) === self::UPCOMING
            ? $query->orderBy('date')->orderBy('start_time')
            : $query->latest('date')->latest('start_time');
    }

    private static function parseDate(mixed $raw): ?string
    {
        return is_string($raw) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw) === 1 ? $raw : null;
    }
}
