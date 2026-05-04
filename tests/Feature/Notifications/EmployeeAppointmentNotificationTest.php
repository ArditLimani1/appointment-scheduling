<?php

namespace Tests\Feature\Notifications;

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
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class EmployeeAppointmentNotificationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{business: Business, admin: User, employee: User, service: Service}
     */
    private function setupBusiness(int $minBookingNotice = 0, int $maxBookingWindow = 30): array
    {
        $this->seed(BusinessTypeSeeder::class);

        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $business = Business::create([
            'owner_id' => $admin->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Notify Biz',
            'slug' => 'notify-biz',
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
            'name' => 'Consult',
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

        return ['business' => $business, 'admin' => $admin, 'employee' => $employee, 'service' => $service];
    }

    public function test_public_booking_persists_database_notification_for_assigned_employee(): void
    {
        ['business' => $business, 'employee' => $employee, 'service' => $service] = $this->setupBusiness();

        $date = Carbon::now($business->timezone)->addDays(2)->toDateString();

        $response = $this->post(route('booking.store', ['slug' => $business->slug]), [
            'employee_id' => $employee->id,
            'service_ids' => [$service->id],
            'date' => $date,
            'start_time' => '10:00',
            'client_first_name' => 'Guest',
            'client_last_name' => 'Booker',
            'client_phone' => '+38349100200',
        ]);

        $response->assertRedirect();

        $this->assertSame(
            1,
            DB::table('notifications')
                ->where('notifiable_type', User::class)
                ->where('notifiable_id', $employee->id)
                ->count()
        );

        $row = DB::table('notifications')
            ->where('notifiable_id', $employee->id)
            ->first();

        $data = json_decode((string) $row->data, true);
        $this->assertSame('new_appointments', $data['kind']);
        $this->assertSame('public_booking', $data['source']);
        $this->assertSame('Guest Booker', $data['client_name']);
        $this->assertSame($date, $data['date']);
        $this->assertSame('10:00', $data['start_time']);
    }

    public function test_employee_self_created_appointment_does_not_notify(): void
    {
        ['employee' => $employee, 'business' => $business, 'service' => $service] = $this->setupBusiness();

        $date = Carbon::now($business->timezone)->addDays(2)->toDateString();

        $response = $this->actingAs($employee)->post(route('employee.appointments.store'), [
            'service_ids' => [$service->id],
            'date' => $date,
            'start_time' => '10:00',
            'client_first_name' => 'Self',
            'client_last_name' => 'Book',
            'client_phone' => '+38349100200',
        ]);

        $response->assertRedirect(route('employee.appointments.index'));

        $this->assertSame(1, Appointment::where('employee_id', $employee->id)->count());
        $this->assertSame(
            0,
            DB::table('notifications')->where('notifiable_id', $employee->id)->count()
        );
    }

    public function test_admin_internal_booking_notifies_employee_with_admin_source(): void
    {
        ['admin' => $admin, 'business' => $business, 'employee' => $employee, 'service' => $service] = $this->setupBusiness(60 * 24, 7);

        $date = Carbon::now($business->timezone)->addDays(2)->toDateString();

        $response = $this->actingAs($admin)->post(route('admin.appointments.store'), [
            'employee_id' => $employee->id,
            'service_ids' => [$service->id],
            'date' => $date,
            'start_time' => '11:00',
            'client_first_name' => 'Admin',
            'client_last_name' => 'Created',
            'client_phone' => '+38349100999',
        ]);

        $response->assertRedirect(route('admin.appointments.index'));

        $this->assertSame(
            AppointmentStatus::Pending,
            Appointment::where('employee_id', $employee->id)->first()->status
        );

        $this->assertSame(1, DB::table('notifications')->where('notifiable_id', $employee->id)->count());
        $data = json_decode((string) DB::table('notifications')->where('notifiable_id', $employee->id)->value('data'), true);
        $this->assertSame('admin', $data['source']);
        $this->assertSame('Admin Created', $data['client_name']);
    }
}
