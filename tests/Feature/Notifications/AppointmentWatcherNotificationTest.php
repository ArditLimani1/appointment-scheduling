<?php

namespace Tests\Feature\Notifications;

use App\Enums\Permission;
use App\Enums\UserRole;
use App\Models\Business;
use App\Models\BusinessRole;
use App\Models\BusinessType;
use App\Models\Schedule;
use App\Models\Service;
use App\Models\User;
use App\Notifications\NewAppointmentsAssignedToEmployee;
use App\Services\Interfaces\BookingServiceInterface;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AppointmentWatcherNotificationTest extends TestCase
{
    use RefreshDatabase;

    private Business $business;

    private User $owner;

    private User $employee;

    private Service $service;

    protected function setUp(): void
    {
        parent::setUp();

        config(['queue.default' => 'sync']);
        Http::fake();
        Mail::fake();

        $this->seed(BusinessTypeSeeder::class);

        $this->owner = User::factory()->create(['role' => UserRole::Admin]);

        $this->business = Business::create([
            'owner_id' => $this->owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Watcher Biz',
            'slug' => 'watcher-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'client_identifier_type' => 'email',
        ]);
        $this->owner->refresh();

        $this->employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $this->business->id,
        ]);

        $this->service = Service::create([
            'business_id' => $this->business->id,
            'name' => 'Haircut',
            'description' => 'Test',
            'duration' => 60,
            'price' => 40,
            'is_active' => true,
            'sort_order' => 0,
        ]);
        $this->employee->services()->sync([$this->service->id]);

        foreach (range(0, 6) as $dow) {
            Schedule::create([
                'user_id' => $this->employee->id,
                'day_of_week' => $dow,
                'start_time' => '09:00:00',
                'end_time' => '18:00:00',
                'is_active' => true,
            ]);
        }
    }

    private function book(): void
    {
        app(BookingServiceInterface::class)->createInternalBooking($this->business, [
            'employee_id' => $this->employee->id,
            'service_ids' => [$this->service->id],
            'date' => now()->addDays(2)->toDateString(),
            'start_time' => '11:00',
            'client_first_name' => 'Test',
            'client_last_name' => 'Client',
            'client_email' => 'client@example.com',
            'client_phone' => '+38344123456',
        ], 'admin');
    }

    public function test_assigned_employee_is_always_notified(): void
    {
        Notification::fake();

        $this->book();

        Notification::assertSentTo($this->employee, NewAppointmentsAssignedToEmployee::class);
    }

    public function test_owner_is_not_notified_when_opted_out(): void
    {
        Notification::fake();

        $this->assertFalse((bool) $this->owner->notify_others_appointments, 'default must be off');

        $this->book();

        Notification::assertNotSentTo($this->owner, NewAppointmentsAssignedToEmployee::class);
    }

    public function test_owner_is_notified_when_opted_in(): void
    {
        $this->owner->update(['notify_others_appointments' => true]);
        Notification::fake();

        $this->book();

        Notification::assertSentTo(
            $this->owner,
            NewAppointmentsAssignedToEmployee::class,
            fn (NewAppointmentsAssignedToEmployee $n) => $n->forOtherStaff === true
                && $n->payload['employee_name'] === $this->employee->name,
        );
    }

    public function test_staff_role_with_admin_appointments_can_watch(): void
    {
        $role = BusinessRole::create([
            'business_id' => $this->business->id,
            'name' => 'Receptionist',
            'permissions' => [Permission::AdminAppointments->value],
        ]);

        $receptionist = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $this->business->id,
            'business_role_id' => $role->id,
            'notify_others_appointments' => true,
        ]);

        Notification::fake();
        $this->book();

        Notification::assertSentTo($receptionist, NewAppointmentsAssignedToEmployee::class);
    }

    public function test_staff_without_admin_appointments_never_watches(): void
    {
        $role = BusinessRole::create([
            'business_id' => $this->business->id,
            'name' => 'Cleaner',
            'permissions' => ['employee.dashboard'],
        ]);

        $other = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $this->business->id,
            'business_role_id' => $role->id,
            // Opted in, but the permission gate must still exclude them.
            'notify_others_appointments' => true,
        ]);

        Notification::fake();
        $this->book();

        Notification::assertNotSentTo($other, NewAppointmentsAssignedToEmployee::class);
    }

    public function test_bell_is_shared_on_admin_routes_for_a_watcher(): void
    {
        // A pure admin (not bookable staff) sees no bell by default...
        $this->assertFalse((bool) $this->owner->also_works_as_staff);

        $this->actingAs($this->owner)
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('employeeNotifications', null));

        // ...but opting in has to bring it back, or the notification lands in the
        // database with nowhere to show.
        $this->owner->update(['notify_others_appointments' => true]);

        $this->actingAs($this->owner)
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('employeeNotifications.unread_count'));
    }

    public function test_watcher_gets_the_admin_appointment_screens_not_the_employee_ones(): void
    {
        $this->owner->update(['notify_others_appointments' => true]);

        // The bell links off `works_as_staff`; a pure admin must be sent to the
        // admin screens because the employee ones abort on worksAsStaff().
        $this->assertFalse($this->owner->fresh()->worksAsStaff());

        $this->actingAs($this->owner)
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('employeeAppointmentUi.works_as_staff', false));

        // And the employee calendar really would refuse them.
        $this->actingAs($this->owner)
            ->get(route('employee.appointments.calendar'))
            ->assertForbidden();
    }

    public function test_watcher_who_is_the_assignee_is_not_notified_twice(): void
    {
        $this->employee->update(['notify_others_appointments' => true]);
        Notification::fake();

        $this->book();

        Notification::assertSentToTimes($this->employee, NewAppointmentsAssignedToEmployee::class, 1);
    }
}
