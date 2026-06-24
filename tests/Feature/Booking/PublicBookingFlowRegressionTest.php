<?php

namespace Tests\Feature\Booking;

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

/**
 * Guards against accidental regressions in the public guest booking flow now
 * that an internal admin/employee create flow lives alongside it.
 */
class PublicBookingFlowRegressionTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{business: Business, employee: User, service: Service}
     */
    private function setupBusiness(int $minBookingNotice = 60 * 24, int $maxBookingWindow = 7): array
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create(['role' => UserRole::Admin]);
        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Public Biz',
            'slug' => 'public-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'slot_duration' => 30,
            'min_booking_notice' => $minBookingNotice,
            'max_booking_window' => $maxBookingWindow,
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

    public function test_public_booking_creates_appointment_and_redirects_to_confirmation(): void
    {
        ['business' => $business, 'employee' => $employee, 'service' => $service] = $this->setupBusiness(0, 30);

        $date = Carbon::now($business->timezone)->addDays(2)->toDateString();

        $response = $this->post(route('booking.store', ['slug' => $business->slug]), [
            'employee_id' => $employee->id,
            'service_ids' => [$service->id],
            'date' => $date,
            'start_time' => '10:00',
            'client_first_name' => 'Guest',
            'client_last_name' => 'Person',
            'client_email' => 'guest@example.com',
        ]);

        $response->assertRedirect();
        $this->assertMatchesRegularExpression(
            '#/book(/|ing/)confirmation/\d+#',
            (string) $response->headers->get('Location'),
        );

        $this->assertSame(
            1,
            Appointment::where('business_id', $business->id)
                ->whereDate('date', $date)
                ->where('start_time', '10:00')
                ->where('status', AppointmentStatus::Pending->value)
                ->count()
        );
    }

    public function test_public_booking_still_rejects_within_min_booking_notice(): void
    {
        ['business' => $business, 'employee' => $employee, 'service' => $service] = $this->setupBusiness();

        // 1 hour from now is well under 24h.
        $now = Carbon::now($business->timezone);
        $date = $now->copy()->addHour()->toDateString();
        $time = $now->copy()->addHour()->format('H:i');

        $response = $this->post(route('booking.store', ['slug' => $business->slug]), [
            'employee_id' => $employee->id,
            'service_ids' => [$service->id],
            'date' => $date,
            'start_time' => $time,
            'client_first_name' => 'Guest',
            'client_last_name' => 'Person',
            'client_email' => 'guest@example.com',
        ]);

        $response->assertSessionHasErrors('start_time');
        $this->assertSame(0, Appointment::count());
    }

    public function test_public_booking_still_rejects_outside_max_booking_window(): void
    {
        ['business' => $business, 'employee' => $employee, 'service' => $service] = $this->setupBusiness(0, 7);

        $date = Carbon::now($business->timezone)->addDays(30)->toDateString();

        $response = $this->post(route('booking.store', ['slug' => $business->slug]), [
            'employee_id' => $employee->id,
            'service_ids' => [$service->id],
            'date' => $date,
            'start_time' => '10:00',
            'client_first_name' => 'Guest',
            'client_last_name' => 'Person',
            'client_email' => 'guest@example.com',
        ]);

        $response->assertSessionHasErrors('date');
        $this->assertSame(0, Appointment::count());
    }
}
