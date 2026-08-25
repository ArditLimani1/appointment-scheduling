<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\User;
use App\Support\DefaultEmployeeSchedule;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class SingleEmployeeModeTest extends TestCase
{
    use RefreshDatabase;

    private function makeOwnerBusiness(): array
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create([
            'role' => UserRole::Admin,
            'is_active' => true,
            'onboarding_completed_at' => now(),
        ]);

        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Solo Mode Biz',
            'slug' => 'solo-mode-biz-'.uniqid(),
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'slot_duration' => 30,
            'min_booking_notice' => 0,
            'max_booking_window' => 30,
        ]);

        return [$owner, $business];
    }

    private function rulesPayload(array $overrides = []): array
    {
        return array_merge([
            'slot_duration' => 30,
            'min_booking_notice' => 0,
            'max_booking_window' => 30,
            'client_identifier_type' => 'email',
            'allow_employee_service_edit' => true,
            'uses_shared_resources' => false,
            'auto_confirm_appointments' => false,
            'reminders_enabled' => false,
            'owner_also_works_as_staff' => false,
            'single_employee_mode' => false,
        ], $overrides);
    }

    public function test_enabling_single_employee_mode_forces_owner_as_staff_and_seeds_schedule(): void
    {
        [$owner, $business] = $this->makeOwnerBusiness();

        $this->actingAs($owner)
            ->put(route('admin.settings.update'), $this->rulesPayload([
                'single_employee_mode' => true,
                'owner_also_works_as_staff' => false,
            ]))
            ->assertRedirect();

        $owner->refresh();
        $business->refresh();

        $this->assertTrue($business->single_employee_mode);
        $this->assertTrue($owner->also_works_as_staff);
        $this->assertSame($business->id, $owner->business_id);
        $this->assertGreaterThan(0, $owner->schedules()->count());
    }

    public function test_cannot_enable_single_employee_mode_when_hired_employees_exist(): void
    {
        Notification::fake();
        [$owner, $business] = $this->makeOwnerBusiness();

        User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
            'is_active' => true,
        ]);

        $this->actingAs($owner)
            ->from(route('admin.settings.index'))
            ->put(route('admin.settings.update'), $this->rulesPayload([
                'single_employee_mode' => true,
                'owner_also_works_as_staff' => true,
            ]))
            ->assertRedirect(route('admin.settings.index'))
            ->assertSessionHasErrors('single_employee_mode');

        $this->assertFalse($business->fresh()->single_employee_mode);
        $this->assertFalse($owner->fresh()->also_works_as_staff);
    }

    public function test_disabling_single_employee_mode_keeps_staff_data(): void
    {
        [$owner, $business] = $this->makeOwnerBusiness();
        $owner->syncAlsoWorksAsStaff($business, true);
        DefaultEmployeeSchedule::seedIfEmpty($owner);
        $business->forceFill(['single_employee_mode' => true])->save();
        $scheduleCount = $owner->schedules()->count();

        $this->actingAs($owner)
            ->put(route('admin.settings.update'), $this->rulesPayload([
                'single_employee_mode' => false,
                'owner_also_works_as_staff' => true,
            ]))
            ->assertRedirect();

        $owner->refresh();
        $business->refresh();

        $this->assertFalse($business->single_employee_mode);
        $this->assertTrue($owner->also_works_as_staff);
        $this->assertSame($scheduleCount, $owner->schedules()->count());
    }

    public function test_cannot_add_employee_while_single_employee_mode_is_on(): void
    {
        [$owner, $business] = $this->makeOwnerBusiness();
        $owner->syncAlsoWorksAsStaff($business, true);
        $business->forceFill(['single_employee_mode' => true])->save();

        $this->actingAs($owner)
            ->from(route('admin.employees.index'))
            ->post(route('admin.employees.store'), [
                'name' => 'Second Staff',
                'email' => 'second@example.com',
                'password' => 'password123',
            ])
            ->assertRedirect(route('admin.employees.index'))
            ->assertSessionHasErrors('employee');

        $this->assertDatabaseMissing('users', ['email' => 'second@example.com']);
    }

    public function test_solo_owner_is_redirected_from_employee_dashboard_to_admin(): void
    {
        [$owner, $business] = $this->makeOwnerBusiness();
        $owner->syncAlsoWorksAsStaff($business, true);
        $business->forceFill(['single_employee_mode' => true])->save();

        $this->actingAs($owner)
            ->get(route('employee.dashboard'))
            ->assertRedirect(route('admin.dashboard'));
    }

    public function test_roles_page_is_redirected_when_single_employee_mode_is_on(): void
    {
        [$owner, $business] = $this->makeOwnerBusiness();
        $owner->syncAlsoWorksAsStaff($business, true);
        $business->forceFill(['single_employee_mode' => true])->save();

        $this->actingAs($owner)
            ->get(route('admin.roles.index'))
            ->assertRedirect(route('admin.settings.index'));
    }

    public function test_default_hours_configuration_is_available_when_single_employee_mode_is_on(): void
    {
        [$owner, $business] = $this->makeOwnerBusiness();
        $owner->syncAlsoWorksAsStaff($business, true);
        $business->forceFill(['single_employee_mode' => true])->save();

        $this->actingAs($owner)
            ->get(route('employee.schedule.configuration'))
            ->assertOk();
    }
}
