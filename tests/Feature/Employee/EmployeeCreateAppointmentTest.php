<?php

namespace Tests\Feature\Employee;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\Schedule;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeCreateAppointmentTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{
     *     business: Business,
     *     admin: User,
     *     employee: User,
     *     otherEmployee: User,
     *     service: Service,
     *     otherService: Service
     * }
     */
    private function setupBusiness(): array
    {
        $this->seed(BusinessTypeSeeder::class);

        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $business = Business::create([
            'owner_id' => $admin->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Employee Create Biz',
            'slug' => 'employee-create-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'slot_duration' => 30,
            'min_booking_notice' => 60 * 24,
            'max_booking_window' => 7,
            'client_identifier_type' => 'phone',
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);
        $otherEmployee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $service = Service::create([
            'business_id' => $business->id,
            'name' => 'Trim',
            'description' => 'Test',
            'duration' => 30,
            'price' => 25,
            'is_active' => true,
            'sort_order' => 0,
        ]);
        $otherService = Service::create([
            'business_id' => $business->id,
            'name' => 'Massage',
            'description' => 'Test',
            'duration' => 30,
            'price' => 30,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $employee->services()->sync([$service->id]);
        $otherEmployee->services()->sync([$otherService->id]);

        for ($d = 0; $d < 7; $d++) {
            Schedule::create([
                'user_id' => $employee->id,
                'day_of_week' => $d,
                'start_time' => '09:00:00',
                'end_time' => '18:00:00',
                'is_active' => true,
            ]);
            Schedule::create([
                'user_id' => $otherEmployee->id,
                'day_of_week' => $d,
                'start_time' => '09:00:00',
                'end_time' => '18:00:00',
                'is_active' => true,
            ]);
        }

        return [
            'business' => $business,
            'admin' => $admin,
            'employee' => $employee,
            'otherEmployee' => $otherEmployee,
            'service' => $service,
            'otherService' => $otherService,
        ];
    }

    public function test_employee_can_load_create_page(): void
    {
        ['employee' => $employee] = $this->setupBusiness();

        $response = $this->actingAs($employee)
            ->get(route('employee.appointments.create'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Employee/Appointments/Create')
            ->where('context', 'employee')
            ->where('preselected_employee_id', $employee->id)
        );
    }

    public function test_employee_creates_confirmed_appointment_for_themselves(): void
    {
        ['employee' => $employee, 'business' => $business, 'service' => $service] = $this->setupBusiness();

        $date = Carbon::now($business->timezone)->addDays(2)->toDateString();

        $response = $this->actingAs($employee)->post(route('employee.appointments.store'), [
            'service_ids' => [$service->id],
            'date' => $date,
            'start_time' => '10:00',
            'client_first_name' => 'Self',
            'client_last_name' => 'Booking',
            'client_phone' => '+38349100200',
        ]);

        $response->assertRedirect(route('employee.appointments.index'));
        $this->assertSame(
            1,
            Appointment::where('business_id', $business->id)
                ->where('employee_id', $employee->id)
                ->whereDate('date', $date)
                ->where('start_time', '10:00')
                ->where('status', AppointmentStatus::Confirmed->value)
                ->count()
        );
    }

    public function test_employee_id_in_payload_is_overridden_by_auth_user(): void
    {
        ['employee' => $employee, 'business' => $business, 'service' => $service, 'otherEmployee' => $otherEmployee] = $this->setupBusiness();

        $date = Carbon::now($business->timezone)->addDays(2)->toDateString();

        $response = $this->actingAs($employee)->post(route('employee.appointments.store'), [
            'employee_id' => $otherEmployee->id, // attempt to spoof
            'service_ids' => [$service->id],
            'date' => $date,
            'start_time' => '11:00',
            'client_first_name' => 'Spoof',
            'client_last_name' => 'Attempt',
            'client_phone' => '+38349200300',
        ]);

        $response->assertRedirect(route('employee.appointments.index'));
        $this->assertSame(
            1,
            Appointment::where('business_id', $business->id)
                ->where('employee_id', $employee->id) // forced
                ->whereDate('date', $date)
                ->where('start_time', '11:00')
                ->count()
        );
        $this->assertSame(
            0,
            Appointment::where('employee_id', $otherEmployee->id)->count()
        );
    }

    public function test_employee_cannot_book_a_service_they_do_not_offer(): void
    {
        ['employee' => $employee, 'business' => $business, 'otherService' => $otherService] = $this->setupBusiness();

        $date = Carbon::now($business->timezone)->addDays(2)->toDateString();

        $response = $this->actingAs($employee)->post(route('employee.appointments.store'), [
            'service_ids' => [$otherService->id],
            'date' => $date,
            'start_time' => '10:00',
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '+38349500600',
        ]);

        $response->assertSessionHasErrors('service_ids');
        $this->assertSame(0, Appointment::count());
    }

    public function test_employee_create_redirects_to_safe_return_to(): void
    {
        ['employee' => $employee, 'business' => $business, 'service' => $service] = $this->setupBusiness();

        $date = Carbon::now($business->timezone)->addDays(2)->toDateString();

        $response = $this->actingAs($employee)->post(route('employee.appointments.store'), [
            'service_ids' => [$service->id],
            'date' => $date,
            'start_time' => '12:00',
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '+38349700800',
            'return_to' => '/employee/appointments/calendar?date=2026-12-01',
        ]);

        $response->assertRedirect('/employee/appointments/calendar?date=2026-12-01');
    }

    public function test_employee_internal_slots_endpoint_returns_slots_for_self_only(): void
    {
        ['employee' => $employee, 'business' => $business, 'service' => $service] = $this->setupBusiness();

        $date = Carbon::now($business->timezone)->addDays(2)->toDateString();

        $response = $this->actingAs($employee)->get(route('employee.appointments.internal-slots', [
            'service_ids' => [$service->id],
            'date' => $date,
        ]));

        $response->assertOk();
        $response->assertJsonStructure(['slots']);
        $this->assertNotEmpty($response->json('slots'));
    }
}
