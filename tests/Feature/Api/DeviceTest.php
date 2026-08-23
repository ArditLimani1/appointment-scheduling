<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\DeviceToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeviceTest extends TestCase
{
    use RefreshDatabase;

    public function test_device_can_be_registered_and_upserted(): void
    {
        $user = User::factory()->create(['role' => UserRole::Employee]);
        $token = $user->createToken('phone')->plainTextToken;

        $payload = [
            'expo_push_token' => 'ExponentPushToken[abc]',
            'platform' => 'android',
            'device_name' => 'Pixel 9',
        ];

        $this->withToken($token)->postJson('/api/v1/devices', $payload)->assertCreated();
        $this->withToken($token)->postJson('/api/v1/devices', $payload)->assertCreated();

        $this->assertSame(1, DeviceToken::query()->count());
        $this->assertSame($user->id, DeviceToken::first()->user_id);
    }

    public function test_token_moving_to_another_user_is_reassigned(): void
    {
        $first = User::factory()->create(['role' => UserRole::Employee]);
        $second = User::factory()->create(['role' => UserRole::Employee]);

        $this->withToken($first->createToken('a')->plainTextToken)
            ->postJson('/api/v1/devices', ['expo_push_token' => 'ExponentPushToken[x]', 'platform' => 'ios'])
            ->assertCreated();

        // Sanctum's guard caches the resolved user within one app instance.
        app('auth')->forgetGuards();

        $this->withToken($second->createToken('b')->plainTextToken)
            ->postJson('/api/v1/devices', ['expo_push_token' => 'ExponentPushToken[x]', 'platform' => 'ios'])
            ->assertCreated();

        $this->assertSame(1, DeviceToken::query()->count());
        $this->assertSame($second->id, DeviceToken::first()->user_id);
    }

    public function test_device_can_be_unregistered(): void
    {
        $user = User::factory()->create(['role' => UserRole::Employee]);
        $token = $user->createToken('phone')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/v1/devices', ['expo_push_token' => 'ExponentPushToken[y]', 'platform' => 'ios'])
            ->assertCreated();

        $this->withToken($token)
            ->deleteJson('/api/v1/devices', ['expo_push_token' => 'ExponentPushToken[y]'])
            ->assertOk();

        $this->assertSame(0, DeviceToken::query()->count());
    }

    public function test_invalid_platform_is_rejected(): void
    {
        $user = User::factory()->create(['role' => UserRole::Employee]);

        $this->withToken($user->createToken('t')->plainTextToken)
            ->postJson('/api/v1/devices', ['expo_push_token' => 'x', 'platform' => 'windows'])
            ->assertStatus(422);
    }
}
