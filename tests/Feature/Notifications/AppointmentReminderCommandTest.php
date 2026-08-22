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
            'slug' => 'reminder-biz-'.$identifierType,
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'slot_duration' => 30,
            'min_booking_notice' => 0,
            'max_booking_window' => 30,
            'client_identifier_type' => $identifierType,
            'reminders_enabled' => true,
            'reminder_time' => '08:00',
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

    public function test_nothing_is_sent_before_the_configured_reminder_time(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-08-22 06:00:00', 'UTC'));
        Mail::fake();

        $business = $this->makeBusiness('email');
        $appointment = $this->makeTodayAppointment($business, ['client_email' => 'client@example.com']);

        $this->artisan('appointments:send-reminders')->assertSuccessful();

        Mail::assertNothingSent();
        $this->assertNull($appointment->fresh()->reminder_sent_at);
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
