<?php

namespace Tests\Feature\Booking;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Mail\CustomerAppointmentUpdateMail;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\Schedule;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\BusinessTypeSeeder;
use App\Services\Interfaces\BusinessServiceInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AutoConfirmAppointmentsTest extends TestCase{
    use RefreshDatabase;

    /**
     * @return array{business: Business, employee: User, service: Service}
     */
    private function setupBusiness(bool $autoConfirm): array
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create(['role' => UserRole::Admin]);
        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Auto Confirm Biz',
            'slug' => 'auto-confirm-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'slot_duration' => 30,
            'min_booking_notice' => 0,
            'max_booking_window' => 30,
            'client_identifier_type' => 'email',
            'auto_confirm_appointments' => $autoConfirm,
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

    public function test_public_booking_stays_pending_when_auto_confirm_disabled(): void
    {
        Mail::fake();
        ['business' => $business, 'employee' => $employee, 'service' => $service] = $this->setupBusiness(false);

        $date = Carbon::now($business->timezone)->addDays(2)->toDateString();

        $this->post(route('booking.store', ['slug' => $business->slug]), [
            'employee_id' => $employee->id,
            'service_ids' => [$service->id],
            'date' => $date,
            'start_time' => '10:00',
            'client_first_name' => 'Guest',
            'client_last_name' => 'Person',
            'client_email' => 'guest@example.com',
        ])->assertRedirect();

        $this->assertSame(
            1,
            Appointment::where('business_id', $business->id)
                ->where('status', AppointmentStatus::Pending->value)
                ->count()
        );

        Mail::assertNothingSent();
    }

    public function test_public_booking_is_confirmed_and_emails_client_when_auto_confirm_enabled(): void
    {
        Mail::fake();
        ['business' => $business, 'employee' => $employee, 'service' => $service] = $this->setupBusiness(true);

        $date = Carbon::now($business->timezone)->addDays(2)->toDateString();

        $this->post(route('booking.store', ['slug' => $business->slug]), [
            'employee_id' => $employee->id,
            'service_ids' => [$service->id],
            'date' => $date,
            'start_time' => '10:00',
            'client_first_name' => 'Guest',
            'client_last_name' => 'Person',
            'client_email' => 'guest@example.com',
        ])->assertRedirect();

        $appointment = Appointment::where('business_id', $business->id)->first();
        $this->assertNotNull($appointment);
        $this->assertSame(AppointmentStatus::Confirmed->value, $appointment->status->value);

        Mail::assertSent(CustomerAppointmentUpdateMail::class, function (CustomerAppointmentUpdateMail $mail) use ($appointment): bool {
            return $mail->appointment->is($appointment)
                && $mail->notificationType === 'confirmed';
        });
    }

    public function test_business_service_persists_auto_confirm_setting(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create(['role' => UserRole::Admin]);
        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Settings Biz',
            'slug' => 'settings-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'slot_duration' => 30,
            'min_booking_notice' => 60,
            'max_booking_window' => 30,
            'auto_confirm_appointments' => false,
        ]);

        app(BusinessServiceInterface::class)->updateSettings($owner, [
            'auto_confirm_appointments' => true,
        ]);

        $this->assertTrue($business->fresh()->auto_confirm_appointments);
    }
}
