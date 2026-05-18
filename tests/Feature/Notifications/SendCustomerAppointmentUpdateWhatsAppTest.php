<?php

namespace Tests\Feature\Notifications;

use App\Enums\AppointmentStatus;
use App\Events\AppointmentCustomerNotificationRequested;
use App\Listeners\SendCustomerAppointmentUpdateWhatsApp;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\Service;
use App\Models\User;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SendCustomerAppointmentUpdateWhatsAppTest extends TestCase
{
    use RefreshDatabase;

    public function test_listener_sends_twilio_whatsapp_message_when_channel_is_whatsapp(): void
    {
        config([
            'services.twilio.account_sid' => 'AC_test',
            'services.twilio.auth_token' => 'secret',
            'services.twilio.whatsapp_from' => '+14155238886',
        ]);

        Http::fake([
            'https://api.twilio.com/*' => Http::response(['sid' => 'SM123'], 201),
        ]);

        $appointment = $this->makeAppointment();

        app(SendCustomerAppointmentUpdateWhatsApp::class)->handle(
            new AppointmentCustomerNotificationRequested(
                $appointment,
                'confirmed',
                ['Time changed from <strong>10:00</strong> to <strong>14:00</strong>.'],
            )
        );

        Http::assertSent(function ($request): bool {
            $data = $request->data();

            return $request->url() === 'https://api.twilio.com/2010-04-01/Accounts/AC_test/Messages.json'
                && $data['From'] === 'whatsapp:+14155238886'
                && $data['To'] === 'whatsapp:+381641234567'
                && str_contains($data['Body'], 'confirmed')
                && str_contains($data['Body'], 'Time changed from 10:00 to 14:00.');
        });
    }

    public function test_listener_skips_twilio_when_channel_is_not_whatsapp(): void
    {
        config([
            'services.twilio.account_sid' => 'AC_test',
            'services.twilio.auth_token' => 'secret',
            'services.twilio.whatsapp_from' => '+14155238886',
        ]);

        Http::fake();

        $appointment = $this->makeAppointment('email');

        app(SendCustomerAppointmentUpdateWhatsApp::class)->handle(
            new AppointmentCustomerNotificationRequested($appointment, 'confirmed')
        );

        Http::assertNothingSent();
    }

    private function makeAppointment(string $clientIdentifierType = 'phone'): Appointment
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create();
        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'WhatsApp Biz',
            'slug' => 'whatsapp-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => 'EUR',
            'is_active' => true,
            'client_identifier_type' => $clientIdentifierType,
        ]);

        $employee = User::factory()->create([
            'business_id' => $business->id,
        ]);

        $service = Service::create([
            'business_id' => $business->id,
            'name' => 'Haircut',
            'description' => 'Test',
            'duration' => 60,
            'price' => 40,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        return Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $service->id,
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '+381641234567',
            'client_email' => 'client@example.com',
            'client_notes' => null,
            'date' => '2026-04-10',
            'start_time' => '14:00',
            'end_time' => '15:00',
            'price' => 40,
            'status' => AppointmentStatus::Confirmed,
        ]);
    }
}
