<?php

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Enums\UserType;
use App\Models\User;
use App\Notifications\VerifyBusinessEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_unverified_business_owners_can_not_authenticate_and_receive_a_fresh_verification_link(): void
    {
        Notification::fake();

        $user = User::factory()->unverified()->create([
            'role' => UserRole::Admin,
        ]);

        $response = $this->from('/login')->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertRedirect('/login');
        $response->assertSessionHasErrors([
            'email' => 'Please verify your email before logging in. We sent you a fresh verification link.',
        ]);
        $this->assertGuest();
        Notification::assertSentTo($user, VerifyBusinessEmail::class);
    }

    public function test_unverified_employees_can_still_authenticate(): void
    {
        $user = User::factory()->unverified()->create([
            'role' => UserRole::Employee,
        ]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_unverified_super_admins_can_still_authenticate(): void
    {
        $user = User::factory()->unverified()->create([
            'role' => UserRole::Admin,
            'user_type' => UserType::SuperAdmin,
        ]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }
}
