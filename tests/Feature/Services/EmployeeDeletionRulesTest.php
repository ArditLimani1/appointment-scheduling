<?php

namespace Tests\Feature\Services;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\Service;
use App\Models\User;
use App\Services\Interfaces\EmployeeServiceInterface;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeDeletionRulesTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{business: Business, employee: User, service: Service}
     */
    private function seedBusinessWithEmployee(): array
    {
        $this->seed(BusinessTypeSeeder::class);

        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $business = Business::create([
            'owner_id' => $admin->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Emp Del Biz',
            'slug' => 'emp-del-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'client_identifier_type' => 'email',
        ]);

        $employee = User::factory()->create([
            'name' => 'Jane Staff',
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $service = Service::create([
            'business_id' => $business->id,
            'name' => 'Cut',
            'description' => 'Test',
            'duration' => 60,
            'price' => 40,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        return ['business' => $business, 'employee' => $employee, 'service' => $service];
    }

    private function makeAppointment(
        Business $business,
        User $employee,
        Service $service,
        string $date,
        AppointmentStatus $status,
    ): Appointment {
        return Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $service->id,
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '000',
            'client_email' => 'a@example.com',
            'client_notes' => null,
            'date' => $date,
            'start_time' => '10:00',
            'end_time' => '11:00',
            'price' => 40,
            'status' => $status,
        ]);
    }

    public function test_keep_records_cancels_future_pending_or_confirmed_and_keeps_rows(): void
    {
        ['business' => $business, 'employee' => $employee, 'service' => $service] = $this->seedBusinessWithEmployee();

        $appointment = $this->makeAppointment($business, $employee, $service, now('UTC')->addDay()->toDateString(), AppointmentStatus::Confirmed);

        $sut = app(EmployeeServiceInterface::class);

        $sut->delete($business, $employee, false);

        $this->assertDatabaseMissing('users', ['id' => $employee->id]);

        $appointment->refresh();
        $this->assertSame(AppointmentStatus::Cancelled, $appointment->status);
        $this->assertNull($appointment->employee_id);
        $this->assertSame('Jane Staff', $appointment->employee_name);
    }

    public function test_keep_records_allowed_when_only_future_appointments_are_cancelled(): void
    {
        ['business' => $business, 'employee' => $employee, 'service' => $service] = $this->seedBusinessWithEmployee();

        $appointment = $this->makeAppointment($business, $employee, $service, now('UTC')->addDay()->toDateString(), AppointmentStatus::Cancelled);

        app(EmployeeServiceInterface::class)->delete($business, $employee, false);

        $this->assertDatabaseMissing('users', ['id' => $employee->id]);

        $appointment->refresh();
        $this->assertNull($appointment->employee_id);
        $this->assertSame('Jane Staff', $appointment->employee_name);
        $this->assertSame('Jane Staff', $appointment->resolvedEmployeeName());
    }

    public function test_delete_with_all_appointments_removes_employee_and_rows(): void
    {
        ['business' => $business, 'employee' => $employee, 'service' => $service] = $this->seedBusinessWithEmployee();

        $this->makeAppointment($business, $employee, $service, now('UTC')->addDay()->toDateString(), AppointmentStatus::Confirmed);

        app(EmployeeServiceInterface::class)->delete($business, $employee, true);

        $this->assertDatabaseMissing('users', ['id' => $employee->id]);
        $this->assertDatabaseCount('appointments', 0);
    }

    public function test_keep_records_snapshots_name_on_past_appointments(): void
    {
        ['business' => $business, 'employee' => $employee, 'service' => $service] = $this->seedBusinessWithEmployee();

        $appointment = $this->makeAppointment($business, $employee, $service, now('UTC')->subDay()->toDateString(), AppointmentStatus::Confirmed);

        app(EmployeeServiceInterface::class)->delete($business, $employee, false);

        $this->assertDatabaseMissing('users', ['id' => $employee->id]);

        $appointment->refresh();
        $this->assertNull($appointment->employee_id);
        $this->assertSame('Jane Staff', $appointment->employee_name);
    }
}
