<?php

namespace Tests\Feature\Features;

use App\Enums\UserRole;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\Schedule;
use App\Models\Service;
use App\Models\User;
use App\Services\BusinessService;
use App\Repositories\BusinessRepository;
use Carbon\Carbon;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientIdentificationSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['features.whatsapp' => false]);
    }

    /**
     * @return array{business: Business, employee: User, service: Service}
     */
    private function setupBusiness(): array
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create(['role' => UserRole::Admin]);
        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Secure Biz',
            'slug' => 'secure-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'slot_duration' => 30,
            'min_booking_notice' => 0,
            'max_booking_window' => 30,
            'client_identifier_type' => 'phone',
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
            'is_active' => true,
        ]);

        $service = Service::create([
            'business_id' => $business->id,
            'name' => 'Service',
            'description' => 'Test',
            'duration' => 30,
            'price' => 25,
            'is_active' => true,
            'sort_order' => 0,
        ]);
        $employee->services()->sync([$service->id]);

        for ($d = 0; $d < 7; $d++) {
            Schedule::create([
                'user_id' => $employee->id,
                'day_of_week' => $d,
                'start_time' => '09:00:00',
                'end_time' => '18:00:00',
                'is_active' => true,
            ]);
        }

        return ['business' => $business, 'employee' => $employee, 'service' => $service];
    }

    public function test_public_booking_rejects_phone_only_even_when_business_stored_phone(): void
    {
        ['business' => $business, 'employee' => $employee, 'service' => $service] = $this->setupBusiness();

        $date = Carbon::now($business->timezone)->addDays(2)->toDateString();

        $response = $this->post(route('booking.store', ['slug' => $business->slug]), [
            'employee_id' => $employee->id,
            'service_ids' => [$service->id],
            'date' => $date,
            'start_time' => '10:00',
            'client_first_name' => 'Guest',
            'client_last_name' => 'Person',
            'client_phone' => '+38349100200',
        ]);

        $response->assertSessionHasErrors('client_email');
    }

    public function test_business_model_exposes_email_identifier_when_whatsapp_disabled(): void
    {
        ['business' => $business] = $this->setupBusiness();

        $this->assertSame('phone', $business->getAttributes()['client_identifier_type']);
        $this->assertSame('email', $business->client_identifier_type);
    }

    public function test_update_settings_service_cannot_persist_phone_when_whatsapp_disabled(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
            'onboarding_completed_at' => now(),
        ]);

        $this->seed(BusinessTypeSeeder::class);
        $business = Business::create([
            'owner_id' => $admin->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Settings Biz',
            'slug' => 'settings-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'slot_duration' => 30,
            'min_booking_notice' => 120,
            'max_booking_window' => 30,
            'client_identifier_type' => 'phone',
        ]);

        $service = new BusinessService(new BusinessRepository());
        $service->updateSettings($admin, [
            'slot_duration' => 45,
            'client_identifier_type' => 'phone',
        ]);

        $business->refresh();
        $this->assertSame('email', $business->getAttributes()['client_identifier_type']);
    }

    public function test_stored_type_validation_rejects_phone_when_whatsapp_disabled(): void
    {
        $validator = validator(
            ['client_identifier_type' => 'phone'],
            ['client_identifier_type' => \App\Support\ClientIdentification::storedTypeRules()],
        );

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('client_identifier_type', $validator->errors()->toArray());
    }
}
