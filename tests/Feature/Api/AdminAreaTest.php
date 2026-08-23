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

class AdminAreaTest extends TestCase
{
    use RefreshDatabase;

    private Business $business;

    private User $admin;

    private User $employee;

    private Service $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(BusinessTypeSeeder::class);

        $this->admin = User::factory()->create(['role' => UserRole::Admin]);

        $this->business = Business::create([
            'owner_id' => $this->admin->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Api Admin Biz',
            'slug' => 'api-admin-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'client_identifier_type' => 'email',
        ]);
        $this->admin->refresh();

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
        return $this->admin->createToken('test')->plainTextToken;
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

    public function test_dashboard_returns_business_payload(): void
    {
        $this->withToken($this->token())
            ->getJson('/api/v1/admin/dashboard')
            ->assertOk();
    }

    public function test_appointments_index_and_calendar(): void
    {
        $appointment = $this->makeAppointment();

        $this->withToken($this->token())
            ->getJson('/api/v1/admin/appointments?scope=all')
            ->assertOk()
            ->assertJsonStructure(['appointments', 'employees', 'services']);

        $this->withToken($this->token())
            ->getJson('/api/v1/admin/appointments/calendar?view=week&date='.$appointment->date->toDateString())
            ->assertOk()
            ->assertJsonStructure(['range_start', 'range_end', 'filters', 'employees', 'calendar_employee_day_breaks']);
    }

    public function test_status_update_and_delete(): void
    {
        $appointment = $this->makeAppointment();

        $this->withToken($this->token())
            ->patchJson("/api/v1/admin/appointments/{$appointment->id}", ['status' => 'confirmed'])
            ->assertOk()
            ->assertJsonPath('appointment.status', 'confirmed');

        // Deletion is only allowed for cancelled appointments.
        $this->withToken($this->token())
            ->deleteJson("/api/v1/admin/appointments/{$appointment->id}")
            ->assertStatus(422);

        $this->withToken($this->token())
            ->patchJson("/api/v1/admin/appointments/{$appointment->id}", ['status' => 'cancelled'])
            ->assertOk();

        $this->withToken($this->token())
            ->deleteJson("/api/v1/admin/appointments/{$appointment->id}")
            ->assertOk();

        $this->assertNull(Appointment::find($appointment->id));
    }

    public function test_appointment_from_other_business_is_rejected(): void
    {
        $otherOwner = User::factory()->create(['role' => UserRole::Admin]);
        $otherBusiness = Business::create([
            'owner_id' => $otherOwner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Other Biz',
            'slug' => 'other-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
        ]);
        $foreign = $this->makeAppointment(['business_id' => $otherBusiness->id]);

        $this->withToken($this->token())
            ->patchJson("/api/v1/admin/appointments/{$foreign->id}", ['status' => 'confirmed'])
            ->assertStatus(403);
    }

    public function test_employees_crud(): void
    {
        $this->withToken($this->token())
            ->getJson('/api/v1/admin/employees')
            ->assertOk()
            ->assertJsonStructure(['employees', 'businessRoles', 'businessOwnerId']);

        $this->withToken($this->token())
            ->postJson('/api/v1/admin/employees', [
                'name' => 'New Person',
                'email' => 'new.person@example.com',
                'password' => 'super-secret-password',
                'service_ids' => [$this->service->id],
            ])
            ->assertCreated();

        $created = User::query()->where('email', 'new.person@example.com')->first();
        $this->assertNotNull($created);
        $this->assertSame($this->business->id, (int) $created->business_id);
    }

    public function test_services_crud(): void
    {
        $this->withToken($this->token())
            ->postJson('/api/v1/admin/services', [
                'name' => 'Beard trim',
                'description' => 'Quick',
                'duration' => 30,
                'price' => 15,
                'is_active' => true,
            ])
            ->assertCreated();

        $created = Service::query()->where('name', 'Beard trim')->first();
        $this->assertNotNull($created);

        $this->withToken($this->token())
            ->putJson("/api/v1/admin/services/{$created->id}", [
                'name' => 'Beard trim deluxe',
                'description' => 'Quick',
                'duration' => 30,
                'price' => 20,
                'is_active' => true,
            ])
            ->assertOk();

        $this->assertSame('Beard trim deluxe', $created->fresh()->name);

        $this->withToken($this->token())
            ->deleteJson("/api/v1/admin/services/{$created->id}")
            ->assertOk();
    }

    public function test_settings_index_returns_payload(): void
    {
        $this->withToken($this->token())
            ->getJson('/api/v1/admin/settings')
            ->assertOk();
    }

    public function test_analytics_returns_payload(): void
    {
        $this->makeAppointment(['status' => AppointmentStatus::Confirmed]);

        $this->withToken($this->token())
            ->getJson('/api/v1/admin/analytics')
            ->assertOk()
            ->assertJsonStructure(['employee_stats', 'currency_symbol']);
    }

    public function test_shared_resources_gated_by_business_flag(): void
    {
        $this->withToken($this->token())
            ->getJson('/api/v1/admin/shared-resources')
            ->assertStatus(403);
    }

    public function test_employee_without_admin_permissions_gets_403(): void
    {
        $token = $this->employee->createToken('t')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/v1/admin/dashboard')
            ->assertStatus(403);
    }

    public function test_admin_can_create_appointment_for_employee(): void
    {
        config(['queue.default' => 'sync']);
        \Illuminate\Support\Facades\Http::fake();
        \Illuminate\Support\Facades\Mail::fake();

        $date = now()->addDays(3)->toDateString();

        $this->withToken($this->token())
            ->postJson('/api/v1/admin/appointments', [
                'employee_id' => $this->employee->id,
                'service_ids' => [$this->service->id],
                'date' => $date,
                'start_time' => '11:00',
                'client_first_name' => 'Test',
                'client_last_name' => 'Client',
                'client_email' => 'client@example.com',
                'client_phone' => '+38344123456',
            ])
            ->assertCreated();

        $this->assertSame(1, Appointment::query()->whereDate('date', $date)->count());
    }

    public function test_roles_index_lists_permission_groups(): void
    {
        $this->withToken($this->token())
            ->getJson('/api/v1/admin/roles')
            ->assertOk()
            ->assertJsonStructure(['roles', 'permissionGroups']);
    }
}
