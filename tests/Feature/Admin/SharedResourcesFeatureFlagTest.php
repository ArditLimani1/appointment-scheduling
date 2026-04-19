<?php

namespace Tests\Feature\Admin;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\Schedule;
use App\Models\Service;
use App\Models\SharedResource;
use App\Models\User;
use App\Services\Interfaces\BookingServiceInterface;
use Carbon\Carbon;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SharedResourcesFeatureFlagTest extends TestCase
{
    use RefreshDatabase;

    public function test_shared_resources_index_returns_403_when_feature_disabled(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $admin = User::factory()->create(['role' => UserRole::Admin]);

        Business::create([
            'owner_id' => $admin->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'No Res Biz',
            'slug' => 'no-res-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'uses_shared_resources' => false,
        ]);

        $this->actingAs($admin)
            ->get(route('admin.shared-resources.index'))
            ->assertForbidden();
    }

    public function test_get_available_slots_ignores_shared_resource_capacity_when_feature_disabled(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create(['role' => UserRole::Admin]);
        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Off Res Biz',
            'slug' => 'off-res-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'slot_duration' => 30,
            'min_booking_notice' => 0,
            'max_booking_window' => 365,
            'uses_shared_resources' => false,
        ]);

        $employeeOne = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);
        $employeeTwo = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $room = SharedResource::create([
            'business_id' => $business->id,
            'name' => 'Room B',
            'capacity' => 1,
        ]);

        $service = Service::create([
            'business_id' => $business->id,
            'name' => 'Consult',
            'description' => 'Test',
            'duration' => 30,
            'price' => 40,
            'is_active' => true,
            'sort_order' => 0,
        ]);
        $service->sharedResources()->attach($room->id, ['quantity' => 1]);
        $employeeOne->services()->sync([$service->id]);
        $employeeTwo->services()->sync([$service->id]);

        $monday = '2026-04-27';
        $this->assertSame(0, Carbon::parse($monday)->dayOfWeekIso - 1);

        foreach ([$employeeOne, $employeeTwo] as $emp) {
            Schedule::create([
                'user_id' => $emp->id,
                'day_of_week' => 0,
                'start_time' => '09:00:00',
                'end_time' => '18:00:00',
                'is_active' => true,
            ]);
        }

        Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employeeOne->id,
            'service_id' => $service->id,
            'client_first_name' => 'X',
            'client_last_name' => 'One',
            'client_phone' => '1',
            'date' => $monday,
            'start_time' => '10:00',
            'end_time' => '10:30',
            'price' => 40,
            'status' => AppointmentStatus::Confirmed,
        ])->sharedResources()->attach($room->id, ['quantity' => 1]);

        /** @var BookingServiceInterface $booking */
        $booking = $this->app->make(BookingServiceInterface::class);

        $slotsForEmployeeTwo = $booking->getAvailableSlots('off-res-biz', [
            'date' => $monday,
            'employee_id' => $employeeTwo->id,
            'service_ids' => [$service->id],
        ]);

        $this->assertContains('10:00', $slotsForEmployeeTwo);

        $created = $booking->createBooking('off-res-biz', [
            'employee_id' => $employeeTwo->id,
            'service_ids' => [$service->id],
            'client_first_name' => 'Y',
            'client_last_name' => 'Two',
            'client_phone' => '2',
            'date' => $monday,
            'start_time' => '10:00',
        ]);

        $this->assertCount(1, $created);
        $this->assertSame(0, $created->first()->sharedResources()->count());
    }
}
