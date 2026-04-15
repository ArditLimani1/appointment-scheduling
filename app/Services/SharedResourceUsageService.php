<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Models\SharedResource;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SharedResourceUsageService
{
    /**
     * Sum quantities of this resource for appointments whose time window overlaps the given window (same calendar date).
     * Uses appointment_shared_resources when present; otherwise falls back to the service's requirement in
     * service_resources (covers legacy rows or any appointment missing pivot data).
     */
    public function sumConcurrentUsage(
        SharedResource $resource,
        int $businessId,
        string $dateYmd,
        Carbon $windowStart,
        Carbon $windowEnd,
        ?int $excludeAppointmentId,
        string $timezone,
    ): int {
        $rows = DB::query()
            ->from('appointments as a')
            ->join('service_resources as sr', function ($join) use ($resource) {
                $join->on('sr.service_id', '=', 'a.service_id')
                    ->where('sr.resource_id', '=', $resource->id);
            })
            ->leftJoin('appointment_shared_resources as asr', function ($join) use ($resource) {
                $join->on('asr.appointment_id', '=', 'a.id')
                    ->where('asr.shared_resource_id', '=', $resource->id);
            })
            ->where('a.business_id', $businessId)
            ->whereDate('a.date', $dateYmd)
            ->where('a.status', '!=', AppointmentStatus::Cancelled->value)
            ->when($excludeAppointmentId, fn ($q) => $q->where('a.id', '!=', $excludeAppointmentId))
            ->select([
                'a.start_time',
                'a.end_time',
                DB::raw('COALESCE(asr.quantity, sr.quantity) as effective_quantity'),
            ])
            ->get();

        $ws = $windowStart->copy()->timezone($timezone);
        $we = $windowEnd->copy()->timezone($timezone);

        $sum = 0;
        foreach ($rows as $row) {
            $startStr = $this->normalizeTimeForCarbon((string) $row->start_time);
            $endStr = $this->normalizeTimeForCarbon((string) $row->end_time);
            $otherStart = Carbon::parse($dateYmd.' '.$startStr, $timezone);
            $otherEnd = Carbon::parse($dateYmd.' '.$endStr, $timezone);
            if ($otherStart->lt($we) && $otherEnd->gt($ws)) {
                $sum += (int) $row->effective_quantity;
            }
        }

        return $sum;
    }

    public function canAllocate(
        SharedResource $resource,
        int $businessId,
        string $dateYmd,
        Carbon $windowStart,
        Carbon $windowEnd,
        int $additionalQuantity,
        ?int $excludeAppointmentId,
        string $timezone,
    ): bool {
        $current = $this->sumConcurrentUsage(
            $resource,
            $businessId,
            $dateYmd,
            $windowStart,
            $windowEnd,
            $excludeAppointmentId,
            $timezone,
        );

        return $current + $additionalQuantity <= (int) $resource->capacity;
    }

    /**
     * DB time values may be "HH:MM:SS" or "HH:MM"; keep a single parseable fragment.
     */
    private function normalizeTimeForCarbon(string $time): string
    {
        $time = trim($time);

        return $time !== '' ? $time : '00:00:00';
    }
}
