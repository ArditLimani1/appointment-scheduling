<?php

namespace Tests\Feature\Services;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\Service;
use App\Models\User;
use App\Services\Interfaces\AnalyticsServiceInterface;
use Carbon\Carbon;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnalyticsDeletedEmployeeNamesTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_stats_show_snapshot_name_when_employee_id_is_null(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $admin = User::factory()->create(['role' => UserRole::Admin]);

        $business = Business::create([
            'owner_id' => $admin->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Analytics Biz',
            'slug' => 'analytics-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'client_identifier_type' => 'email',
        ]);

        $marcus = User::factory()->create([
            'name' => 'Marcus',
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $service = Service::create([
            'business_id' => $business->id,
            'name' => 'Cut',
            'description' => 'Test',
            'duration' => 60,
            'price' => 40,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $date = Carbon::now()->startOfMonth()->addDays(5)->toDateString();

        Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $marcus->id,
            'employee_name' => null,
            'service_id' => $service->id,
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '000',
            'client_email' => 'a@example.com',
            'client_notes' => null,
            'date' => $date,
            'start_time' => '10:00',
            'end_time' => '11:00',
            'price' => 40,
            'status' => AppointmentStatus::Confirmed,
        ]);

        Appointment::create([
            'business_id' => $business->id,
            'employee_id' => null,
            'employee_name' => 'John',
            'service_id' => $service->id,
            'client_first_name' => 'C',
            'client_last_name' => 'D',
            'client_phone' => '001',
            'client_email' => 'c@example.com',
            'client_notes' => null,
            'date' => $date,
            'start_time' => '12:00',
            'end_time' => '13:00',
            'price' => 30,
            'status' => AppointmentStatus::Pending,
        ]);

        $filters = [
            'date_from' => Carbon::now()->startOfMonth()->toDateString(),
            'date_to' => Carbon::now()->endOfMonth()->toDateString(),
        ];

        $data = app(AnalyticsServiceInterface::class)->getAnalyticsData($business, $filters);
        $names = $data['employee_stats']->pluck('name')->sort()->values()->all();

        $this->assertContains('John', $names);
        $this->assertContains('Marcus', $names);
        $this->assertNotContains('Unknown', $names);

        $legacyOption = collect($data['employee_filter_options'])->firstWhere('value', 'legacy:'.rawurlencode('John'));
        $this->assertNotNull($legacyOption);
        $this->assertStringContainsString('John', $legacyOption['label']);

        $filtered = app(AnalyticsServiceInterface::class)->getAnalyticsData($business, array_merge($filters, [
            'legacy_employee_name' => 'John',
        ]));
        $this->assertCount(1, $filtered['employee_stats']);
        $this->assertSame('John', $filtered['employee_stats'][0]['name']);
        $this->assertSame(1, $filtered['total_appointments']);
    }
}
