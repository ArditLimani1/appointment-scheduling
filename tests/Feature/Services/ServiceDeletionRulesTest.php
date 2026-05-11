<?php

namespace Tests\Feature\Services;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\Service;
use App\Models\User;
use App\Services\Interfaces\ServiceServiceInterface;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ServiceDeletionRulesTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{business: Business, employee: User, service: Service}
     */
    private function seedBusinessWithService(): array
    {
        $this->seed(BusinessTypeSeeder::class);

        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $business = Business::create([
            'owner_id' => $admin->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Svc Del Biz',
            'slug' => 'svc-del-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'client_identifier_type' => 'email',
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $service = Service::create([
            'business_id' => $business->id,
            'name' => 'Haircut Deluxe',
            'description' => 'Test',
            'duration' => 60,
            'price' => 40,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        return ['business' => $business, 'employee' => $employee, 'service' => $service];
    }

    public function test_delete_throws_when_future_non_cancelled_appointment_exists(): void
    {
        ['business' => $business, 'employee' => $employee, 'service' => $service] = $this->seedBusinessWithService();

        Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $service->id,
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '000',
            'client_email' => 'a@example.com',
            'client_notes' => null,
            'date' => now('UTC')->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'price' => 40,
            'status' => AppointmentStatus::Confirmed,
        ]);

        $sut = app(ServiceServiceInterface::class);

        try {
            $sut->delete($business, $service);
            $this->fail('Expected ValidationException was not thrown.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('service', $e->errors());
        }

        $this->assertDatabaseHas('services', ['id' => $service->id]);
    }

    public function test_delete_allowed_when_only_future_appointments_are_cancelled(): void
    {
        ['business' => $business, 'employee' => $employee, 'service' => $service] = $this->seedBusinessWithService();

        Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $service->id,
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '000',
            'client_email' => 'a@example.com',
            'client_notes' => null,
            'date' => now('UTC')->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'price' => 40,
            'status' => AppointmentStatus::Cancelled,
        ]);

        app(ServiceServiceInterface::class)->delete($business, $service);

        $this->assertDatabaseMissing('services', ['id' => $service->id]);
    }

    public function test_delete_snapshots_service_name_on_past_appointments(): void
    {
        ['business' => $business, 'employee' => $employee, 'service' => $service] = $this->seedBusinessWithService();

        $appointment = Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $service->id,
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '000',
            'client_email' => 'a@example.com',
            'client_notes' => null,
            'date' => now('UTC')->subDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'price' => 40,
            'status' => AppointmentStatus::Confirmed,
        ]);

        app(ServiceServiceInterface::class)->delete($business, $service);

        $this->assertDatabaseMissing('services', ['id' => $service->id]);

        $appointment->refresh();
        $this->assertNull($appointment->service_id);
        $this->assertSame('Haircut Deluxe', $appointment->service_name);
        $this->assertSame('Haircut Deluxe', $appointment->resolvedServiceName());
    }
}
