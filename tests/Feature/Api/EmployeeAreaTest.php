<?php

namespace Tests\Feature\Api;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\Schedule;
use App\Models\Service;
use App\Models\User;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeAreaTest extends TestCase
{
    use RefreshDatabase;

    private Business $business;

    private User $employee;

    private Service $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create(['role' => UserRole::Admin]);

        $this->business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Api Employee Biz',
            'slug' => 'api-employee-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
        ]);

        $this->employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $this->business->id,
        ]);

        $this->service = Service::create([
            'business_id' => $this->business->id,
            'name' => 'Haircut',
            'description' => 'Test',
            'duration' => 60,
            'price' => 40,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $this->employee->services()->sync([$this->service->id]);

        // Active all week 09:00–18:00 so slot/schedule logic has room.
        foreach (range(0, 6) as $dow) {
            Schedule::create([
                'user_id' => $this->employee->id,
                'day_of_week' => $dow,
                'start_time' => '09:00:00',
                'end_time' => '18:00:00',
                'is_active' => true,
            ]);
        }
    }

    private function token(): string
    {
        return $this->employee->createToken('test')->plainTextToken;
    }

    private function makeAppointment(array $overrides = []): Appointment
    {
        return Appointment::create(array_merge([
            'business_id' => $this->business->id,
            'employee_id' => $this->employee->id,
            'service_id' => $this->service->id,
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '000',
            'client_email' => null,
            'client_notes' => null,
            'date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'price' => 40,
            'status' => AppointmentStatus::Pending,
        ], $overrides));
    }

    public function test_dashboard_returns_day_payload(): void
    {
        $this->makeAppointment(['date' => now()->toDateString()]);

        $this->withToken($this->token())
            ->getJson('/api/v1/employee/dashboard')
            ->assertOk()
            ->assertJsonPath('appointments_count', 1)
            ->assertJsonStructure(['appointments', 'services', 'daily_revenue', 'date_from', 'date_to']);
    }

    public function test_appointments_index_returns_filtered_list(): void
    {
        $this->makeAppointment();

        $this->withToken($this->token())
            ->getJson('/api/v1/employee/appointments?scope=all')
            ->assertOk()
            ->assertJsonStructure(['appointments', 'services', 'filters']);
    }

    public function test_calendar_returns_employee_scoped_payload(): void
    {
        $appointment = $this->makeAppointment();

        $response = $this->withToken($this->token())
            ->getJson('/api/v1/employee/appointments/calendar?view=week&date='.$appointment->date->toDateString())
            ->assertOk()
            ->assertJsonStructure(['range_start', 'range_end', 'calendar_hours', 'filters', 'employees'])
            ->assertJsonPath('employee_calendar', true);

        $employees = $response->json('employees');
        $this->assertCount(1, $employees);
        $this->assertSame($this->employee->id, $employees[0]['id']);
    }

    public function test_status_update_via_patch(): void
    {
        $appointment = $this->makeAppointment();

        $this->withToken($this->token())
            ->patchJson("/api/v1/employee/appointments/{$appointment->id}", [
                'status' => 'confirmed',
            ])
            ->assertOk()
            ->assertJsonPath('appointment.status', 'confirmed');

        $this->assertSame(AppointmentStatus::Confirmed, $appointment->fresh()->status);
    }

    public function test_reschedule_moves_appointment(): void
    {
        $appointment = $this->makeAppointment();
        $newDate = now()->addDays(2)->toDateString();

        $this->withToken($this->token())
            ->putJson("/api/v1/employee/appointments/{$appointment->id}/reschedule", [
                'date' => $newDate,
                'start_time' => '12:00',
            ])
            ->assertOk()
            ->assertJsonPath('appointment.start_time', '12:00');

        $fresh = $appointment->fresh();
        $this->assertSame($newDate, $fresh->date->toDateString());
    }

    public function test_cannot_touch_other_employees_appointment(): void
    {
        $other = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $this->business->id,
        ]);
        $appointment = $this->makeAppointment(['employee_id' => $other->id]);

        $this->withToken($this->token())
            ->putJson("/api/v1/employee/appointments/{$appointment->id}", [
                'service_id' => $this->service->id,
                'status' => 'confirmed',
                'date' => $appointment->date->toDateString(),
                'start_time' => '10:00',
            ])
            ->assertStatus(403);
    }

    public function test_schedule_week_view_returns_days(): void
    {
        $response = $this->withToken($this->token())
            ->getJson('/api/v1/employee/schedule')
            ->assertOk()
            ->assertJsonStructure(['days', 'dateFrom', 'dateTo', 'baseSchedules']);

        $this->assertCount(7, $response->json('days'));
    }

    public function test_schedule_configuration_roundtrip(): void
    {
        $this->withToken($this->token())
            ->getJson('/api/v1/employee/schedule/configuration')
            ->assertOk()
            ->assertJsonStructure(['schedules', 'booking_slug', 'booking_url']);

        $days = collect(range(0, 6))->map(fn ($dow) => [
            'day_of_week' => $dow,
            'is_active' => $dow < 5,
            'start_time' => '08:00',
            'end_time' => '16:00',
            'breaks' => [],
        ])->all();

        $this->withToken($this->token())
            ->putJson('/api/v1/employee/schedule/configuration', ['schedules' => $days])
            ->assertOk();

        // updateSchedules() versions rows with effective_from = tomorrow (never touches today).
        $monday = $this->employee->schedules()
            ->where('day_of_week', 0)
            ->orderByDesc('effective_from')
            ->first();
        $this->assertNotNull($monday);
        $this->assertSame('08:00', substr((string) $monday->start_time, 0, 5));
    }

    public function test_inactive_employee_is_rejected(): void
    {
        $token = $this->token();
        $this->employee->forceFill(['is_active' => false])->save();

        $this->withToken($token)
            ->getJson('/api/v1/employee/dashboard')
            ->assertStatus(403);
    }

    public function test_onboarding_incomplete_returns_409(): void
    {
        $this->employee->update(['onboarding_completed_at' => null]);

        $this->withToken($this->token())
            ->getJson('/api/v1/employee/dashboard')
            ->assertStatus(409)
            ->assertJsonPath('code', 'onboarding_required');
    }

    public function test_notifications_feed_and_mark_all_read(): void
    {
        $this->withToken($this->token())
            ->getJson('/api/v1/employee/notifications')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta']);

        $this->withToken($this->token())
            ->postJson('/api/v1/employee/notifications/read-all')
            ->assertOk()
            ->assertJsonPath('message', 'ok');
    }

    public function test_analytics_returns_payload(): void
    {
        $this->makeAppointment(['status' => AppointmentStatus::Confirmed]);

        $this->withToken($this->token())
            ->getJson('/api/v1/employee/analytics')
            ->assertOk()
            ->assertJsonStructure(['summary', 'service_stats', 'currency_symbol']);
    }
}
