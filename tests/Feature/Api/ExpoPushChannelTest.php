<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\DeviceToken;
use App\Models\User;
use App\Notifications\NewAppointmentsAssignedToEmployee;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ExpoPushChannelTest extends TestCase
{
    use RefreshDatabase;

    public function test_notification_posts_to_expo_for_each_registered_device(): void
    {
        Http::fake([
            'exp.host/*' => Http::response(['data' => [
                ['status' => 'ok'],
                ['status' => 'ok'],
            ]]),
        ]);

        $employee = User::factory()->create(['role' => UserRole::Employee, 'locale' => 'sq']);

        foreach (['ExponentPushToken[a]', 'ExponentPushToken[b]'] as $token) {
            DeviceToken::create([
                'user_id' => $employee->id,
                'expo_push_token' => $token,
                'platform' => 'ios',
            ]);
        }

        $employee->notify(new NewAppointmentsAssignedToEmployee([
            'kind' => 'new_appointments',
            'client_name' => 'Filan Fisteku',
            'date' => '2026-08-25',
            'start_time' => '10:00',
            'services' => [['id' => 1, 'name' => 'Haircut']],
            'appointment_ids' => [1],
        ]));

        Http::assertSent(function ($request) {
            $body = $request->data();

            return str_contains($request->url(), 'exp.host')
                && count($body) === 2
                && $body[0]['to'] === 'ExponentPushToken[a]'
                && $body[0]['title'] === 'Termin i ri'
                && $body[0]['data']['type'] === 'appointment.created';
        });

        // Database channel still writes the bell-feed entry.
        $this->assertSame(1, $employee->notifications()->count());
    }

    public function test_dead_tokens_are_pruned(): void
    {
        Http::fake([
            'exp.host/*' => Http::response(['data' => [
                ['status' => 'error', 'details' => ['error' => 'DeviceNotRegistered']],
            ]]),
        ]);

        $employee = User::factory()->create(['role' => UserRole::Employee]);
        DeviceToken::create([
            'user_id' => $employee->id,
            'expo_push_token' => 'ExponentPushToken[dead]',
            'platform' => 'android',
        ]);

        $employee->notify(new NewAppointmentsAssignedToEmployee([
            'client_name' => 'X',
            'services' => [],
            'appointment_ids' => [],
        ]));

        $this->assertSame(0, DeviceToken::query()->count());
    }

    public function test_no_devices_means_no_http_call(): void
    {
        Http::fake();

        $employee = User::factory()->create(['role' => UserRole::Employee]);
        $employee->notify(new NewAppointmentsAssignedToEmployee([
            'client_name' => 'X',
            'services' => [],
            'appointment_ids' => [],
        ]));

        Http::assertNothingSent();
        $this->assertSame(1, $employee->notifications()->count());
    }
}
