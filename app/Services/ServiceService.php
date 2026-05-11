<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\Service;
use App\Repositories\Interfaces\ServiceRepositoryInterface;
use App\Services\Interfaces\ServiceServiceInterface;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ServiceService implements ServiceServiceInterface
{
    public function __construct(
        private ServiceRepositoryInterface $serviceRepository,
    ) {}

    public function getServices(Business $business): Collection
    {
        return $this->serviceRepository->getByBusiness($business->id);
    }

    public function store(Business $business, array $data): Service
    {
        $resources = $data['resources'] ?? null;
        unset($data['resources']);

        $service = $this->serviceRepository->create(array_merge($data, ['business_id' => $business->id]));

        if ($business->uses_shared_resources && is_array($resources)) {
            $this->syncSharedResources($service, $resources);
        } elseif (! $business->uses_shared_resources) {
            $this->syncSharedResources($service, []);
        }

        return $service->load('sharedResources');
    }

    public function update(Business $business, Service $service, array $data): Service
    {
        abort_if($service->business_id !== $business->id, 403);

        $resources = null;
        if (array_key_exists('resources', $data)) {
            $resources = $data['resources'];
            unset($data['resources']);
        }

        $this->serviceRepository->update($service, $data);

        if ($business->uses_shared_resources && is_array($resources)) {
            $this->syncSharedResources($service, $resources);
        } elseif (! $business->uses_shared_resources) {
            $this->syncSharedResources($service, []);
        }

        return $service->fresh()->load('sharedResources');
    }

    public function delete(Business $business, Service $service): void
    {
        abort_if($service->business_id !== $business->id, 403);

        $timezone = $business->timezone ?: config('app.timezone');
        $now = Carbon::now($timezone);

        $hasBlockingFutureAppointment = Appointment::query()
            ->where('service_id', $service->id)
            ->where('business_id', $business->id)
            ->whereIn('status', [AppointmentStatus::Pending, AppointmentStatus::Confirmed])
            ->where(function ($q) use ($now) {
                $q->whereDate('date', '>', $now->toDateString())
                    ->orWhere(function ($q2) use ($now) {
                        $q2->whereDate('date', '=', $now->toDateString())
                            ->whereTime('start_time', '>=', $now->format('H:i:s'));
                    });
            })
            ->exists();

        if ($hasBlockingFutureAppointment) {
            throw ValidationException::withMessages([
                'service' => [__('request_messages.service.delete_blocked_future_appointments')],
            ]);
        }

        DB::transaction(function () use ($service, $business) {
            Appointment::query()
                ->where('service_id', $service->id)
                ->where('business_id', $business->id)
                ->update(['service_name' => $service->name]);

            $this->serviceRepository->delete($service);
        });
    }

    /**
     * @param  list<array{resource_id: int, quantity: int}>  $rows
     */
    private function syncSharedResources(Service $service, array $rows): void
    {
        $sync = [];
        foreach ($rows as $row) {
            $rid = (int) $row['resource_id'];
            $sync[$rid] = ['quantity' => (int) $row['quantity']];
        }
        $service->sharedResources()->sync($sync);
    }
}
