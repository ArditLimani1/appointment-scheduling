<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Enums\UserType;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\DeviceToken;
use App\Models\User;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdminWithBusiness(): User
    {
        $this->seed(BusinessTypeSeeder::class);

        $admin = User::factory()->create(['role' => UserRole::Admin]);

        Business::create([
            'owner_id' => $admin->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Api Biz',
            'slug' => 'api-biz',
            'timezone' => 'Europe/Tirane',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'client_identifier_type' => 'email',
        ]);

        return $admin->fresh();
    }

    public function test_login_returns_token_and_me_payload(): void
    {
        $admin = $this->makeAdminWithBusiness();

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $admin->email,
            'password' => 'password',
            'device_name' => 'iPhone 17',
        ]);

        $response->assertCreated()
            ->assertJsonStructure([
                'token',
                'me' => ['user' => ['id', 'name', 'role'], 'business' => ['timezone'], 'permissions', 'features'],
            ])
            ->assertJsonPath('me.user.id', $admin->id)
            ->assertJsonPath('me.business.timezone', 'Europe/Tirane')
            ->assertJsonPath('me.features.admin_panel', true);

        $this->assertSame(1, $admin->tokens()->count());
    }

    public function test_login_rejects_wrong_password(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'nope',
            'device_name' => 'x',
        ])->assertStatus(422);
    }

    public function test_login_rejects_inactive_user(): void
    {
        $user = User::factory()->create(['is_active' => false]);

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
            'device_name' => 'x',
        ])->assertStatus(422);
    }

    public function test_login_rejects_unverified_email_with_code(): void
    {
        $user = User::factory()->unverified()->create(['role' => UserRole::Admin]);

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
            'device_name' => 'x',
        ])->assertStatus(403)->assertJsonPath('code', 'email_unverified');
    }

    public function test_login_rejects_super_admin(): void
    {
        $user = User::factory()->create(['user_type' => UserType::SuperAdmin]);

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
            'device_name' => 'x',
        ])->assertStatus(403)->assertJsonPath('code', 'unsupported_account');
    }

    public function test_me_requires_token(): void
    {
        $this->getJson('/api/v1/me')->assertStatus(401);
    }

    public function test_me_returns_boot_payload_with_bearer_token(): void
    {
        $admin = $this->makeAdminWithBusiness();
        $token = $admin->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.user.email', $admin->email)
            ->assertJsonPath('data.business.slug', 'api-biz')
            ->assertJsonPath('data.features.admin_panel', true);
    }

    public function test_employee_me_payload_has_employee_permissions(): void
    {
        $admin = $this->makeAdminWithBusiness();
        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $admin->ownedBusiness->id,
        ]);
        $token = $employee->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/v1/me')->assertOk();

        $permissions = $response->json('data.permissions');
        $this->assertContains('employee.appointments', $permissions);
        $this->assertNotContains('admin.settings', $permissions);
        $this->assertFalse($response->json('data.features.admin_panel'));
    }

    public function test_logout_revokes_token_and_device_registration(): void
    {
        $admin = $this->makeAdminWithBusiness();
        $token = $admin->createToken('test');

        DeviceToken::create([
            'user_id' => $admin->id,
            'expo_push_token' => 'ExponentPushToken[abc]',
            'platform' => 'ios',
            'personal_access_token_id' => $token->accessToken->id,
        ]);

        $this->withToken($token->plainTextToken)
            ->deleteJson('/api/v1/auth/logout')
            ->assertOk();

        $this->assertSame(0, $admin->tokens()->count());
        $this->assertSame(0, DeviceToken::query()->count());
    }
}
