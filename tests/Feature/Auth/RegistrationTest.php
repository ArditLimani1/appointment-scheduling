<?php

namespace Tests\Feature\Auth;

use App\Notifications\VerifyBusinessEmail;
use App\Models\BusinessType;
use App\Models\User;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        Notification::fake();

        $this->seed(BusinessTypeSeeder::class);

        $businessTypeId = BusinessType::query()->value('id');

        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'business_name' => 'Test Business',
            'slug' => 'test-business',
            'business_type_id' => $businessTypeId,
        ]);

        $user = User::query()->where('email', 'test@example.com')->firstOrFail();

        $this->assertGuest();
        $this->assertFalse($user->hasVerifiedEmail());
        Notification::assertSentTo($user, VerifyBusinessEmail::class, fn (VerifyBusinessEmail $notification): bool => $notification instanceof ShouldQueue);
        $response->assertRedirect(route('login', absolute: false));
        $response->assertSessionHas('status', 'We sent you a verification link. Please verify your email before signing in.');
    }
}
