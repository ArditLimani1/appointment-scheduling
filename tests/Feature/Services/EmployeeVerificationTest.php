<?php

namespace Tests\Feature\Services;

use App\Enums\UserRole;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\User;
use App\Notifications\VerifyEmployeeEmail;
use App\Services\Interfaces\EmployeeServiceInterface;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class EmployeeVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_an_employee_sends_verification_email_and_leaves_email_unverified(): void
    {
        Notification::fake();
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create(['role' => UserRole::Admin]);
        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Verification Biz',
            'slug' => 'verification-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'slot_duration' => 30,
        ]);

        $employee = app(EmployeeServiceInterface::class)->store($business, [
            'name' => 'New Staff',
            'email' => 'new-staff@example.com',
            'password' => 'password123',
        ]);

        $this->assertFalse($employee->hasVerifiedEmail());
        Notification::assertSentTo(
            $employee,
            VerifyEmployeeEmail::class,
            fn (VerifyEmployeeEmail $notification): bool => $notification instanceof ShouldQueue,
        );
    }
}
