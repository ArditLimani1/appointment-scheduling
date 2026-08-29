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
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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

        // `employee_name` is only the deletion snapshot, so the app reads the
        // live name off the eager-loaded relation — it has to be in the payload.
        $this->withToken($this->token())
            ->getJson('/api/v1/admin/appointments?scope=all')
            ->assertOk()
            ->assertJsonStructure(['appointments', 'employees', 'services'])
            ->assertJsonPath('appointments.data.0.employee.name', $this->employee->name);

        $this->withToken($this->token())
            ->getJson('/api/v1/admin/appointments/calendar?view=week&date='.$appointment->date->toDateString())
            ->assertOk()
            ->assertJsonStructure(['range_start', 'range_end', 'filters', 'employees', 'calendar_employee_day_breaks'])
            ->assertJsonPath('appointments.0.employee.name', $this->employee->name);
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
            ->assertOk()
            ->assertJsonStructure([
                'settings' => [
                    'name', 'phone', 'location', 'slug', 'logo',
                    'slot_duration', 'min_booking_notice', 'max_booking_window',
                    'client_identifier_type', 'allow_employee_service_edit',
                    'uses_shared_resources', 'auto_confirm_appointments',
                    'reminders_enabled', 'reminder_time',
                ],
                'owner_email',
                'show_owner_staff_toggle',
                'owner_also_works_as_staff',
            ]);
    }

    public function test_settings_update_persists_every_booking_rule(): void
    {
        $this->withToken($this->token())
            ->putJson('/api/v1/admin/settings', [
                'slot_duration' => 45,
                'min_booking_notice' => 90,
                'max_booking_window' => 21,
                'allow_employee_service_edit' => false,
                'uses_shared_resources' => true,
                'auto_confirm_appointments' => true,
                'reminders_enabled' => true,
                'reminder_time' => '09:30',
            ])
            ->assertOk();

        $business = $this->business->fresh();

        $this->assertSame(45, (int) $business->slot_duration);
        $this->assertSame(90, (int) $business->min_booking_notice);
        $this->assertSame(21, (int) $business->max_booking_window);
        $this->assertFalse((bool) $business->allow_employee_service_edit);
        $this->assertTrue((bool) $business->uses_shared_resources);
        $this->assertTrue((bool) $business->auto_confirm_appointments);
        $this->assertTrue((bool) $business->reminders_enabled);
        $this->assertSame('09:30', substr((string) $business->reminder_time, 0, 5));
    }

    public function test_settings_ignores_a_null_reminder_time(): void
    {
        // The column is NOT NULL with an 08:00 default, so a null must never
        // reach the database — it used to pass validation and 500.
        $this->withToken($this->token())
            ->putJson('/api/v1/admin/settings', [
                'reminders_enabled' => false,
                'reminder_time' => null,
            ])
            ->assertOk();

        $this->assertNotNull($this->business->fresh()->reminder_time);
    }

    public function test_settings_accepts_a_logo_upload_over_post(): void
    {
        Storage::fake('public');

        $this->withToken($this->token())
            ->post('/api/v1/admin/settings', [
                'logo' => UploadedFile::fake()->image('logo.png'),
            ], ['Accept' => 'application/json'])
            ->assertOk();

        $logo = $this->business->fresh()->logo;

        $this->assertNotNull($logo);
        Storage::disk('public')->assertExists($logo);
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

    public function test_notification_preference_defaults_off_and_can_be_toggled(): void
    {
        $this->withToken($this->token())
            ->getJson('/api/v1/admin/settings')
            ->assertOk()
            ->assertJsonPath('notify_others_appointments', false)
            ->assertJsonPath('can_manage_appointments', true);

        $this->withToken($this->token())
            ->putJson('/api/v1/admin/settings/notifications', ['notify_others_appointments' => true])
            ->assertOk()
            ->assertJsonPath('notify_others_appointments', true);

        $this->assertTrue((bool) $this->admin->fresh()->notify_others_appointments);
    }

    public function test_notification_preference_needs_appointments_permission_not_settings(): void
    {
        $role = \App\Models\BusinessRole::create([
            'business_id' => $this->business->id,
            'name' => 'Front desk',
            'permissions' => [\App\Enums\Permission::AdminAppointments->value],
        ]);
        // business_role_id is not fillable, so assign it explicitly.
        $this->employee->forceFill(['business_role_id' => $role->id])->save();
        $token = $this->employee->createToken('t')->plainTextToken;

        // No admin.settings, so the business form stays closed...
        $this->withToken($token)
            ->putJson('/api/v1/admin/settings', ['name' => 'Hacked'])
            ->assertStatus(403);

        // Sanctum caches the resolved user (and its loaded relations) per app
        // instance; drop it so the permission check re-reads the role.
        app('auth')->forgetGuards();

        // ...but the personal preference is theirs to set.
        $this->withToken($token)
            ->putJson('/api/v1/admin/settings/notifications', ['notify_others_appointments' => true])
            ->assertOk();

        $this->assertTrue((bool) $this->employee->fresh()->notify_others_appointments);
    }

    public function test_roles_index_lists_permission_groups(): void
    {
        $this->withToken($this->token())
            ->getJson('/api/v1/admin/roles')
            ->assertOk()
            ->assertJsonStructure(['roles', 'permissionGroups']);
    }
}
