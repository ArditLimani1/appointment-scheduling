<?php

namespace Tests\Feature\Notifications;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Mail\CustomerAppointmentUpdateMail;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\Service;
use App\Models\User;
use App\Services\Interfaces\BusinessServiceInterface;
use App\Services\Interfaces\WhatsAppSenderInterface;
use Carbon\Carbon;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Mockery;
use Tests\TestCase;

class AppointmentReminderCommandTest extends TestCase
{
    use RefreshDatabase;

    private function makeBusiness(string $identifierType): Business
    {
        $this->seed(BusinessTypeSeeder::class);

        $admin = User::factory()->create(['role' => UserRole::Admin]);

        return Business::create([
            'owner_id' => $admin->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Reminder Biz',
            'slug' => 'reminder-biz-'.$identifierType.'-'.$admin->id,
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'slot_duration' => 30,
            'min_booking_notice' => 0,
            'max_booking_window' => 30,
            'client_identifier_type' => $identifierType,
            'reminders_enabled' => true,
            'reminder_hours_before' => 4,
        ]);
    }

    private function makeTodayAppointment(Business $business, array $overrides = []): Appointment
    {
        $service = Service::create([
            'business_id' => $business->id,
            'name' => 'Consult',
            'duration' => 30,
            'price' => 25,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
            'is_active' => true,
        ]);

        return Appointment::create(array_merge([
            'booking_reference' => 'REM'.$business->id,
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $service->id,
            'client_first_name' => 'Rem',
            'client_last_name' => 'Inder',
            'date' => Carbon::now($business->timezone)->toDateString(),
            'start_time' => '14:00:00',
            'end_time' => '14:30:00',
            'price' => 25,
            'status' => AppointmentStatus::Confirmed,
        ], $overrides));
    }

    public function test_email_business_reminds_by_mail_and_stamps_the_appointment(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-08-22 10:00:00', 'UTC'));
        Mail::fake();

        $business = $this->makeBusiness('email');
        $appointment = $this->makeTodayAppointment($business, ['client_email' => 'client@example.com']);

        $this->artisan('appointments:send-reminders')->assertSuccessful();

        Mail::assertSent(CustomerAppointmentUpdateMail::class, fn ($mail) => $mail->notificationType === 'reminder'
            && $mail->hasTo('client@example.com'));

        $this->assertNotNull($appointment->fresh()->reminder_sent_at);
    }

    public function test_phone_business_reminds_over_whatsapp(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-08-22 10:00:00', 'UTC'));
        config(['features.whatsapp' => true]);

        $whatsApp = Mockery::mock(WhatsAppSenderInterface::class);
        $whatsApp->shouldReceive('isConfigured')->andReturnTrue();
        $whatsApp->shouldReceive('sendBookingReminder')
            ->once()
            ->with('+38349100999', Mockery::any(), Mockery::any(), Mockery::any(), Mockery::any())
            ->andReturnTrue();
        $this->app->instance(WhatsAppSenderInterface::class, $whatsApp);

        $business = $this->makeBusiness('phone');
        $appointment = $this->makeTodayAppointment($business, ['client_phone' => '+38349100999']);

        $this->artisan('appointments:send-reminders')->assertSuccessful();

        $this->assertNotNull($appointment->fresh()->reminder_sent_at);
    }

    public function test_nothing_is_sent_before_the_appointment_reminder_at_timestamp(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-08-22 09:59:00', 'UTC'));
        Mail::fake();

        $business = $this->makeBusiness('email');
        $appointment = $this->makeTodayAppointment($business, ['client_email' => 'client@example.com']);

        $this->artisan('appointments:send-reminders')->assertSuccessful();

        Mail::assertNothingSent();
        $this->assertNull($appointment->fresh()->reminder_sent_at);
    }

    public function test_appointment_reminder_at_uses_its_own_business_configuration(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-08-22 08:00:00', 'UTC'));

        $fourHourBusiness = $this->makeBusiness('email');
        $fourHourAppointment = $this->makeTodayAppointment($fourHourBusiness, ['client_email' => 'four@example.com']);

        $oneHourBusiness = $this->makeBusiness('email');
        $oneHourBusiness->update(['reminder_hours_before' => 1]);
        $oneHourAppointment = $this->makeTodayAppointment($oneHourBusiness, ['client_email' => 'one@example.com']);

        $this->assertSame('2026-08-22 10:00:00', $fourHourAppointment->reminder_at->format('Y-m-d H:i:s'));
        $this->assertSame('2026-08-22 13:00:00', $oneHourAppointment->reminder_at->format('Y-m-d H:i:s'));
    }

    public function test_changing_business_hours_recalculates_future_unsent_appointments_only(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-08-22 08:00:00', 'UTC'));

        $business = $this->makeBusiness('email');
        $future = $this->makeTodayAppointment($business, ['client_email' => 'future@example.com']);
        $alreadySent = $this->makeTodayAppointment($business, [
            'booking_reference' => 'SENT'.$business->id,
            'client_email' => 'sent@example.com',
            'reminder_sent_at' => now(),
        ]);

        app(BusinessServiceInterface::class)->updateSettings($business->owner, [
            'reminders_enabled' => true,
            'reminder_hours_before' => 2,
        ]);

        $this->assertSame('2026-08-22 12:00:00', $future->fresh()->reminder_at->format('Y-m-d H:i:s'));
        $this->assertSame('2026-08-22 10:00:00', $alreadySent->fresh()->reminder_at->format('Y-m-d H:i:s'));
    }

    public function test_rescheduling_recalculates_reminder_at_and_allows_a_new_reminder(): void
    {
        $business = $this->makeBusiness('email');
        $appointment = $this->makeTodayAppointment($business, [
            'client_email' => 'client@example.com',
            'reminder_sent_at' => now(),
        ]);

        $appointment->update(['start_time' => '16:00:00', 'end_time' => '16:30:00']);

        $appointment->refresh();
        $this->assertSame('12:00:00', $appointment->reminder_at->format('H:i:s'));
        $this->assertNull($appointment->reminder_sent_at);
    }

    public function test_reminders_are_skipped_when_the_business_has_them_disabled(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-08-22 10:00:00', 'UTC'));
        Mail::fake();

        $business = $this->makeBusiness('email');
        $business->forceFill(['reminders_enabled' => false])->save();
        $appointment = $this->makeTodayAppointment($business, ['client_email' => 'client@example.com']);

        $this->artisan('appointments:send-reminders')->assertSuccessful();

        Mail::assertNothingSent();
        $this->assertNull($appointment->fresh()->reminder_sent_at);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }
}
