<?php

namespace Tests\Feature\Employee;

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

class EmployeeDashboardDateFilterTest extends TestCase
{
    use RefreshDatabase;

    private function seedEmployeeInBusiness(): User
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Dash Filter Biz',
            'slug' => 'dash-filter-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
        ]);

        return User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);
    }

    public function test_dashboard_always_shows_today_only_and_ignores_query_dates(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-10', 'UTC'));

        $employee = $this->seedEmployeeInBusiness();

        Appointment::create([
            'business_id' => $employee->business_id,
            'employee_id' => $employee->id,
            'service_id' => null,
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '000',
            'client_email' => null,
            'client_notes' => null,
            'date' => '2026-04-10',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'price' => 10,
            'status' => AppointmentStatus::Confirmed,
        ]);

        $response = $this->actingAs($employee)->get(route('employee.dashboard', [
            'date_from' => '2026-04-01',
            'date_to' => '2026-04-01',
        ]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Employee/Dashboard')
            ->where('appointments', fn ($list) => count($list) === 1));

        Carbon::setTestNow();
    }

    public function test_appointments_index_same_day_date_range_includes_appointments_on_sqlite(): void
    {
        $employee = $this->seedEmployeeInBusiness();

        $day = '2026-04-09';

        Appointment::create([
            'business_id' => $employee->business_id,
            'employee_id' => $employee->id,
            'service_id' => null,
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '000',
            'client_email' => null,
            'client_notes' => null,
            'date' => $day,
            'start_time' => '10:00',
            'end_time' => '11:00',
            'price' => 10,
            'status' => AppointmentStatus::Confirmed,
        ]);

        $response = $this->actingAs($employee)->get(route('employee.appointments.index', [
            'date_from' => $day,
            'date_to' => $day,
        ]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Employee/Appointments/Index')
            ->where('appointments.data', fn ($rows) => count($rows) === 1));
    }

    public function test_appointments_index_defaults_to_current_calendar_month(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-12', 'UTC'));

        $employee = $this->seedEmployeeInBusiness();

        Appointment::create([
            'business_id' => $employee->business_id,
            'employee_id' => $employee->id,
            'service_id' => null,
            'client_first_name' => 'In',
            'client_last_name' => 'Month',
            'client_phone' => '000',
            'client_email' => null,
            'client_notes' => null,
            'date' => '2026-04-05',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'price' => 10,
            'status' => AppointmentStatus::Confirmed,
        ]);

        Appointment::create([
            'business_id' => $employee->business_id,
            'employee_id' => $employee->id,
            'service_id' => null,
            'client_first_name' => 'Out',
            'client_last_name' => 'Month',
            'client_phone' => '001',
            'client_email' => null,
            'client_notes' => null,
            'date' => '2026-03-30',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'price' => 10,
            'status' => AppointmentStatus::Confirmed,
        ]);

        $response = $this->actingAs($employee)->get(route('employee.appointments.index'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Employee/Appointments/Index')
            ->where('appointments.data', fn ($rows) => count($rows) === 1)
            ->where('filters.date_from', '2026-04-01')
            ->where('filters.date_to', '2026-04-30'));

        Carbon::setTestNow();
    }

    public function test_appointments_index_filters_by_service_id(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-12', 'UTC'));

        $employee = $this->seedEmployeeInBusiness();

        $serviceA = Service::create([
            'business_id' => $employee->business_id,
            'name' => 'Haircut',
            'description' => null,
            'duration' => 30,
            'price' => 25,
            'is_active' => true,
            'is_popular' => false,
            'sort_order' => 0,
        ]);

        $serviceB = Service::create([
            'business_id' => $employee->business_id,
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
            'business_id' => $employee->business_id,
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
            'business_id' => $employee->business_id,
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

        $response = $this->actingAs($employee)->get(route('employee.appointments.index', [
            'date_from' => $day,
            'date_to' => $day,
            'service_id' => $serviceA->id,
        ]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Employee/Appointments/Index')
            ->where('appointments.data', fn ($rows) => count($rows) === 1)
            ->where('filters.service_id', (int) $serviceA->id)
            ->has('services', 2));

        Carbon::setTestNow();
    }

    public function test_appointments_index_filters_by_client_name_search(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-12', 'UTC'));

        $employee = $this->seedEmployeeInBusiness();

        $day = '2026-04-10';

        Appointment::create([
            'business_id' => $employee->business_id,
            'employee_id' => $employee->id,
            'service_id' => null,
            'client_first_name' => 'Zara',
            'client_last_name' => 'Alpha',
            'client_phone' => '000',
            'client_email' => null,
            'client_notes' => null,
            'date' => $day,
            'start_time' => '10:00',
            'end_time' => '11:00',
            'price' => 10,
            'status' => AppointmentStatus::Confirmed,
        ]);

        Appointment::create([
            'business_id' => $employee->business_id,
            'employee_id' => $employee->id,
            'service_id' => null,
            'client_first_name' => 'Morgan',
            'client_last_name' => 'Beta',
            'client_phone' => '001',
            'client_email' => null,
            'client_notes' => null,
            'date' => $day,
            'start_time' => '12:00',
            'end_time' => '13:00',
            'price' => 12,
            'status' => AppointmentStatus::Confirmed,
        ]);

        $response = $this->actingAs($employee)->get(route('employee.appointments.index', [
            'date_from' => $day,
            'date_to' => $day,
            'search' => 'Zar',
        ]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Employee/Appointments/Index')
            ->where('appointments.data', fn ($rows) => count($rows) === 1)
            ->where('filters.search', 'Zar'));

        Carbon::setTestNow();
    }

    public function test_appointments_index_ignores_service_id_from_other_business(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-12', 'UTC'));

        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create(['role' => UserRole::Admin]);
        $otherBusiness = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Other Biz',
            'slug' => 'other-biz-svc-filter',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
        ]);

        $employee = $this->seedEmployeeInBusiness();

        $foreignService = Service::create([
            'business_id' => $otherBusiness->id,
            'name' => 'Foreign',
            'description' => null,
            'duration' => 15,
            'price' => 10,
            'is_active' => true,
            'is_popular' => false,
            'sort_order' => 0,
        ]);

        $day = '2026-04-10';

        Appointment::create([
            'business_id' => $employee->business_id,
            'employee_id' => $employee->id,
            'service_id' => null,
            'client_first_name' => 'X',
            'client_last_name' => 'Y',
            'client_phone' => '000',
            'client_email' => null,
            'client_notes' => null,
            'date' => $day,
            'start_time' => '10:00',
            'end_time' => '11:00',
            'price' => 10,
            'status' => AppointmentStatus::Confirmed,
        ]);

        $response = $this->actingAs($employee)->get(route('employee.appointments.index', [
            'date_from' => $day,
            'date_to' => $day,
            'service_id' => $foreignService->id,
        ]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Employee/Appointments/Index')
            ->where('appointments.data', fn ($rows) => count($rows) === 1)
            ->where('filters.service_id', null));

        Carbon::setTestNow();
    }

    public function test_employee_appointments_export_returns_excel(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-12', 'UTC'));

        $employee = $this->seedEmployeeInBusiness();

        Appointment::create([
            'business_id' => $employee->business_id,
            'employee_id' => $employee->id,
            'service_id' => null,
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '000',
            'client_email' => null,
            'client_notes' => null,
            'date' => '2026-04-05',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'price' => 10,
            'status' => AppointmentStatus::Confirmed,
        ]);

        $response = $this->actingAs($employee)->get(route('employee.appointments.export', [
            'date_from' => '2026-04-01',
            'date_to' => '2026-04-30',
        ]));

        $response->assertOk();
        $this->assertStringContainsString('spreadsheetml', strtolower($response->headers->get('content-type') ?? ''));

        Carbon::setTestNow();
    }
}
