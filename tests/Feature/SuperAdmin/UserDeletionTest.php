<?php

namespace Tests\Feature\SuperAdmin;

use App\Enums\UserRole;
use App\Enums\UserType;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\User;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserDeletionTest extends TestCase
{
    use RefreshDatabase;

    private function superAdmin(): User
    {
        return User::factory()->create([
            'role' => UserRole::Admin,
            'user_type' => UserType::SuperAdmin,
        ]);
    }

    private function business(User $owner): Business
    {
        $this->seed(BusinessTypeSeeder::class);

        return Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Delete Biz',
            'slug' => 'delete-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
        ]);
    }

    public function test_super_admin_deletes_a_staff_account_and_frees_the_email(): void
    {
        $superAdmin = $this->superAdmin();
        $owner = User::factory()->create(['role' => UserRole::Admin]);
        $business = $this->business($owner);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
            'email' => 'staff@example.com',
        ]);

        $this->actingAs($superAdmin)
            ->delete(route('super-admin.users.destroy', $employee->id))
            ->assertRedirect();

        $this->assertDatabaseMissing('users', ['id' => $employee->id]);
        $this->assertDatabaseMissing('users', ['email' => 'staff@example.com']);
    }

    public function test_super_admin_deletes_an_orphan_account_without_a_business(): void
    {
        $superAdmin = $this->superAdmin();

        $orphan = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => null,
            'email' => 'orphan@example.com',
        ]);

        $this->actingAs($superAdmin)
            ->delete(route('super-admin.users.destroy', $orphan->id))
            ->assertRedirect();

        $this->assertDatabaseMissing('users', ['email' => 'orphan@example.com']);
    }

    public function test_business_owner_cannot_be_deleted(): void
    {
        $superAdmin = $this->superAdmin();
        $owner = User::factory()->create(['role' => UserRole::Admin]);
        $business = $this->business($owner);

        $this->actingAs($superAdmin)
            ->delete(route('super-admin.users.destroy', $owner->id))
            ->assertForbidden();

        $this->assertDatabaseHas('users', ['id' => $owner->id]);
        $this->assertDatabaseHas('businesses', ['id' => $business->id]);
    }

    public function test_another_super_admin_cannot_be_deleted(): void
    {
        $superAdmin = $this->superAdmin();
        $other = $this->superAdmin();

        $this->actingAs($superAdmin)
            ->delete(route('super-admin.users.destroy', $other->id))
            ->assertForbidden();

        $this->assertDatabaseHas('users', ['id' => $other->id]);
    }

    public function test_tenant_cannot_delete_users(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Admin]);
        $business = $this->business($owner);
        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $this->actingAs($owner)
            ->delete(route('super-admin.users.destroy', $employee->id))
            ->assertForbidden();

        $this->assertDatabaseHas('users', ['id' => $employee->id]);
    }
}
