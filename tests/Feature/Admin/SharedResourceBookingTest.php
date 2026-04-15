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
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class SharedResourceBookingTest extends TestCase
{
    use RefreshDatabase;

    public function test_second_overlapping_booking_fails_when_resource_capacity_is_one(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create(['role' => UserRole::Admin]);
        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Res Biz',
            'slug' => 'res-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'slot_duration' => 30,
            'min_booking_notice' => 0,
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $room = SharedResource::create([
            'business_id' => $business->id,
            'name' => 'Room A',
            'capacity' => 1,
        ]);

        $service = Service::create([
            'business_id' => $business->id,
            'name' => 'Therapy',
            'description' => 'Test',
            'duration' => 30,
            'price' => 50,
            'is_active' => true,
            'sort_order' => 0,
        ]);
        $service->sharedResources()->attach($room->id, ['quantity' => 1]);

        $employee->services()->sync([$service->id]);

        $monday = '2026-06-08';
        $this->assertSame(0, Carbon::parse($monday)->dayOfWeekIso - 1);

        Schedule::create([
            'user_id' => $employee->id,
            'day_of_week' => 0,
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'is_active' => true,
        ]);

        Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $service->id,
            'client_first_name' => 'A',
            'client_last_name' => 'One',
            'client_phone' => '1',
            'date' => $monday,
            'start_time' => '10:00',
            'end_time' => '10:30',
            'price' => 50,
            'status' => AppointmentStatus::Confirmed,
        ])->sharedResources()->attach($room->id, ['quantity' => 1]);

        /** @var BookingServiceInterface $booking */
        $booking = $this->app->make(BookingServiceInterface::class);

        $this->expectException(HttpException::class);
        $booking->createBooking('res-biz', [
            'employee_id' => $employee->id,
            'service_ids' => [$service->id],
            'client_first_name' => 'B',
            'client_last_name' => 'Two',
            'client_phone' => '2',
            'date' => $monday,
            'start_time' => '10:15',
        ]);
    }

    public function test_second_booking_fails_for_different_employee_when_resource_capacity_exceeded(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create(['role' => UserRole::Admin]);
        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Cross Emp Biz',
            'slug' => 'cross-emp-biz',
            'timezone' => 'Europe/Berlin',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'slot_duration' => 30,
            'min_booking_notice' => 0,
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
            'name' => 'Therapy Room',
            'capacity' => 1,
        ]);

        $service = Service::create([
            'business_id' => $business->id,
            'name' => 'Psikoterapi',
            'description' => 'Test',
            'duration' => 30,
            'price' => 15,
            'is_active' => true,
            'sort_order' => 0,
        ]);
        $service->sharedResources()->attach($room->id, ['quantity' => 1]);

        $employeeOne->services()->sync([$service->id]);
        $employeeTwo->services()->sync([$service->id]);

        $monday = '2026-06-08';

        foreach ([$employeeOne, $employeeTwo] as $emp) {
            Schedule::create([
                'user_id' => $emp->id,
                'day_of_week' => 0,
                'start_time' => '09:00:00',
                'end_time' => '18:00:00',
                'is_active' => true,
            ]);
        }

        /** @var BookingServiceInterface $booking */
        $booking = $this->app->make(BookingServiceInterface::class);

        $booking->createBooking('cross-emp-biz', [
            'employee_id' => $employeeOne->id,
            'service_ids' => [$service->id],
            'client_first_name' => 'First',
            'client_last_name' => 'Client',
            'client_phone' => '11',
            'date' => $monday,
            'start_time' => '10:00',
        ]);

        $this->expectException(HttpException::class);
        $booking->createBooking('cross-emp-biz', [
            'employee_id' => $employeeTwo->id,
            'service_ids' => [$service->id],
            'client_first_name' => 'Second',
            'client_last_name' => 'Client',
            'client_phone' => '22',
            'date' => $monday,
            'start_time' => '10:00',
        ]);
    }

    public function test_booking_succeeds_when_no_resources_on_service(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create(['role' => UserRole::Admin]);
        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Plain Biz',
            'slug' => 'plain-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'slot_duration' => 30,
            'min_booking_notice' => 0,
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $service = Service::create([
            'business_id' => $business->id,
            'name' => 'Cut',
            'description' => 'Test',
            'duration' => 30,
            'price' => 20,
            'is_active' => true,
            'sort_order' => 0,
        ]);
        $employee->services()->sync([$service->id]);

        $monday = '2026-06-08';

        Schedule::create([
            'user_id' => $employee->id,
            'day_of_week' => 0,
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'is_active' => true,
        ]);

        /** @var BookingServiceInterface $booking */
        $booking = $this->app->make(BookingServiceInterface::class);

        $created = $booking->createBooking('plain-biz', [
            'employee_id' => $employee->id,
            'service_ids' => [$service->id],
            'client_first_name' => 'C',
            'client_last_name' => 'Three',
            'client_phone' => '3',
            'date' => $monday,
            'start_time' => '11:00',
        ]);

        $this->assertCount(1, $created);
        $this->assertSame(0, $created->first()->sharedResources()->count());
    }
}
