<?php

namespace Tests\Feature\Admin;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\Schedule;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCreateAppointmentTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{business: Business, admin: User, employee: User, service: Service}
     */
    private function setupBusiness(): array
    {
        $this->seed(BusinessTypeSeeder::class);

        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $business = Business::create([
            'owner_id' => $admin->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Admin Create Biz',
            'slug' => 'admin-create-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'slot_duration' => 30,
            'min_booking_notice' => 60 * 24, // 24h notice — internal flow must bypass this
            'max_booking_window' => 7,
            'client_identifier_type' => 'phone',
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $service = Service::create([
            'business_id' => $business->id,
            'name' => 'Haircut',
            'description' => 'Test',
            'duration' => 30,
            'price' => 25,
            'is_active' => true,
            'sort_order' => 0,
        ]);
        $employee->services()->sync([$service->id]);

        // Schedule for every day to keep the date tests resilient.
        for ($d = 0; $d < 7; $d++) {
            Schedule::create([
                'user_id' => $employee->id,
                'day_of_week' => $d,
                'start_time' => '09:00:00',
                'end_time' => '18:00:00',
                'is_active' => true,
            ]);
        }

        return ['business' => $business, 'admin' => $admin, 'employee' => $employee, 'service' => $service];
    }

    public function test_admin_can_load_create_page(): void
    {
        ['admin' => $admin] = $this->setupBusiness();

        $response = $this->actingAs($admin)
            ->get(route('admin.appointments.create'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Appointments/Create')
            ->where('context', 'admin')
            ->has('employees')
            ->has('services')
        );
    }

    public function test_admin_creates_pending_appointment_within_min_notice_window(): void
    {
        ['admin' => $admin, 'business' => $business, 'employee' => $employee, 'service' => $service] = $this->setupBusiness();

        // Today + 1 hour: still inside the 24h public min_notice — public would reject.
        $now = Carbon::now($business->timezone);
        $date = $now->copy()->addDay()->isWeekend()
            ? $now->copy()->addDays(2)->toDateString()
            : $now->copy()->addDay()->toDateString();

        $response = $this->actingAs($admin)->post(route('admin.appointments.store'), [
            'employee_id' => $employee->id,
            'service_ids' => [$service->id],
            'date' => $date,
            'start_time' => '10:00',
            'client_first_name' => 'Walk',
            'client_last_name' => 'In',
            'client_phone' => '+38349100200',
            'client_notes' => 'Walk-in',
        ]);

        $response->assertRedirect(route('admin.appointments.index'));
        $response->assertSessionHas('success');

        $this->assertSame(
            1,
            Appointment::where('business_id', $business->id)
                ->where('employee_id', $employee->id)
                ->where('service_id', $service->id)
                ->whereDate('date', $date)
                ->where('start_time', '10:00')
                ->where('status', AppointmentStatus::Pending->value)
                ->where('client_phone', '+38349100200')
                ->count()
        );
    }

    public function test_admin_can_create_outside_max_booking_window(): void
    {
        ['admin' => $admin, 'business' => $business, 'employee' => $employee, 'service' => $service] = $this->setupBusiness();

        // 30 days ahead, far past the 7-day public max_booking_window.
        $date = Carbon::now($business->timezone)->addDays(30)->toDateString();

        $response = $this->actingAs($admin)->post(route('admin.appointments.store'), [
            'employee_id' => $employee->id,
            'service_ids' => [$service->id],
            'date' => $date,
            'start_time' => '11:00',
            'client_first_name' => 'Far',
            'client_last_name' => 'Future',
            'client_phone' => '+38349300400',
        ]);

        $response->assertRedirect(route('admin.appointments.index'));
        $this->assertSame(
            1,
            Appointment::where('business_id', $business->id)
                ->whereDate('date', $date)
                ->where('start_time', '11:00')
                ->count()
        );
    }

    public function test_admin_create_redirects_to_safe_return_to(): void
    {
        ['admin' => $admin, 'business' => $business, 'employee' => $employee, 'service' => $service] = $this->setupBusiness();

        $date = Carbon::now($business->timezone)->addDays(2)->toDateString();

        $response = $this->actingAs($admin)->post(route('admin.appointments.store'), [
            'employee_id' => $employee->id,
            'service_ids' => [$service->id],
            'date' => $date,
            'start_time' => '12:00',
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '+38349500600',
            'return_to' => '/admin/appointments/calendar?view=week',
        ]);

        $response->assertRedirect('/admin/appointments/calendar?view=week');
    }

    public function test_admin_create_falls_back_when_return_to_is_external(): void
    {
        ['admin' => $admin, 'business' => $business, 'employee' => $employee, 'service' => $service] = $this->setupBusiness();

        $date = Carbon::now($business->timezone)->addDays(2)->toDateString();

        $response = $this->actingAs($admin)->post(route('admin.appointments.store'), [
            'employee_id' => $employee->id,
            'service_ids' => [$service->id],
            'date' => $date,
            'start_time' => '13:00',
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '+38349500700',
            'return_to' => 'https://evil.example.com/path',
        ]);

        $response->assertRedirect(route('admin.appointments.index'));
    }

    public function test_admin_cannot_create_overlapping_appointment(): void
    {
        ['admin' => $admin, 'business' => $business, 'employee' => $employee, 'service' => $service] = $this->setupBusiness();

        $date = Carbon::now($business->timezone)->addDays(2)->toDateString();

        Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $service->id,
            'client_first_name' => 'X',
            'client_last_name' => 'Y',
            'client_phone' => '000',
            'date' => $date,
            'start_time' => '10:00',
            'end_time' => '10:30',
            'price' => 25,
            'status' => AppointmentStatus::Confirmed,
        ]);

        $response = $this->actingAs($admin)->post(route('admin.appointments.store'), [
            'employee_id' => $employee->id,
            'service_ids' => [$service->id],
            'date' => $date,
            'start_time' => '10:00',
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '+38349800900',
        ]);

        $response->assertStatus(422);
        $this->assertSame(
            1,
            Appointment::where('business_id', $business->id)
                ->whereDate('date', $date)
                ->where('start_time', '10:00')
                ->count()
        );
    }

    public function test_internal_slots_endpoint_returns_slots(): void
    {
        ['admin' => $admin, 'business' => $business, 'employee' => $employee, 'service' => $service] = $this->setupBusiness();

        $date = Carbon::now($business->timezone)->addDays(2)->toDateString();

        $response = $this->actingAs($admin)->get(route('admin.appointments.internal-slots', [
            'employee_id' => $employee->id,
            'service_ids' => [$service->id],
            'date' => $date,
        ]));

        $response->assertOk();
        $response->assertJsonStructure(['slots']);
        $this->assertNotEmpty($response->json('slots'));
    }
}
