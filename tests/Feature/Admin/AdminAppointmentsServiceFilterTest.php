<?php

namespace Tests\Feature\Admin;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminAppointmentsServiceFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_appointments_index_filters_by_service_id(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-12', 'UTC'));

        $this->seed(BusinessTypeSeeder::class);

        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $business = Business::create([
            'owner_id' => $admin->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Service Filter Biz',
            'slug' => 'service-filter-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $serviceA = Service::create([
            'business_id' => $business->id,
            'name' => 'Haircut',
            'description' => null,
            'duration' => 30,
            'price' => 25,
            'is_active' => true,
            'is_popular' => false,
            'sort_order' => 0,
        ]);

        $serviceB = Service::create([
            'business_id' => $business->id,
            'name' => 'Colour',
            'description' => null,
            'duration' => 60,
            'price' => 80,
            'is_active' => true,
            'is_popular' => false,
            'sort_order' => 1,
        ]);

        $day = '2026-04-10';

        Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $serviceA->id,
            'client_first_name' => 'A',
            'client_last_name' => 'One',
            'client_phone' => '000',
            'client_email' => null,
            'client_notes' => null,
            'date' => $day,
            'start_time' => '10:00',
            'end_time' => '10:30',
            'price' => 25,
            'status' => AppointmentStatus::Confirmed,
        ]);

        Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $serviceB->id,
            'client_first_name' => 'B',
            'client_last_name' => 'Two',
            'client_phone' => '001',
            'client_email' => null,
            'client_notes' => null,
            'date' => $day,
            'start_time' => '11:00',
            'end_time' => '12:00',
            'price' => 80,
            'status' => AppointmentStatus::Confirmed,
        ]);

        $response = $this->actingAs($admin)->get(route('admin.appointments.index', [
            'list' => 1,
            'date_from' => $day,
            'date_to' => $day,
            'service_id' => $serviceA->id,
        ]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Appointments/Index')
            ->where('filters.service_id', (int) $serviceA->id)
            ->where('appointments.data', fn ($rows) => count($rows) === 1)
            ->has('services', 2));

        Carbon::setTestNow();
    }
}
