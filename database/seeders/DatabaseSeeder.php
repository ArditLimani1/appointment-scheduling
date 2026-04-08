<?php

namespace Database\Seeders;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\Schedule;
use App\Models\ScheduleBreak;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@stratos.com',
            'password' => Hash::make('password'),
            'role' => UserRole::Admin,
            'is_active' => true,
        ]);

        $business = Business::create([
            'owner_id' => $admin->id,
            'name' => 'Tiki Style',
            'slug' => 'tiki-style',
            'location' => 'Rimanishte, Prishtine',
            'timezone' => 'Europe/Berlin',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'slot_duration' => 30,
            'min_booking_notice' => 60,
            'max_booking_window' => 30,
            'is_active' => true,
        ]);

        $john = User::create([
            'name' => 'John',
            'email' => 'john@stratos.com',
            'password' => Hash::make('password'),
            'role' => UserRole::Employee,
            'phone' => '+1234567001',
            'title' => 'Master Barber',
            'is_active' => true,
            'business_id' => $business->id,
        ]);

        $sarah = User::create([
            'name' => 'Sarah',
            'email' => 'sarah@stratos.com',
            'password' => Hash::make('password'),
            'role' => UserRole::Employee,
            'phone' => '+1234567002',
            'title' => 'Senior Stylist',
            'is_active' => true,
            'business_id' => $business->id,
        ]);

        $marcus = User::create([
            'name' => 'Marcus',
            'email' => 'marcus@stratos.com',
            'password' => Hash::make('password'),
            'role' => UserRole::Employee,
            'phone' => '+1234567003',
            'title' => 'Detail Expert',
            'is_active' => true,
            'business_id' => $business->id,
        ]);

        $elena = User::create([
            'name' => 'Elena',
            'email' => 'elena@stratos.com',
            'password' => Hash::make('password'),
            'role' => UserRole::Employee,
            'phone' => '+1234567004',
            'title' => 'Color Artist',
            'is_active' => true,
            'business_id' => $business->id,
        ]);

        $employees = [$john, $sarah, $marcus, $elena];

        $signatureHaircut = Service::create([
            'business_id' => $business->id,
            'name' => 'Signature Haircut',
            'description' => 'Premium haircut with consultation and styling',
            'duration' => 45,
            'price' => 45.00,
            'icon' => 'content_cut',
            'is_active' => true,
            'is_popular' => true,
            'sort_order' => 1,
        ]);

        $beardSculpt = Service::create([
            'business_id' => $business->id,
            'name' => 'Beard Sculpt',
            'description' => 'Professional beard trimming and shaping',
            'duration' => 30,
            'price' => 30.00,
            'icon' => 'face',
            'is_active' => true,
            'is_popular' => false,
            'sort_order' => 2,
        ]);

        $fullExecutive = Service::create([
            'business_id' => $business->id,
            'name' => 'The Full Executive',
            'description' => 'Complete grooming package including haircut, beard trim, and styling',
            'duration' => 75,
            'price' => 70.00,
            'icon' => 'star',
            'is_active' => true,
            'is_popular' => false,
            'sort_order' => 3,
        ]);

        $expressTrim = Service::create([
            'business_id' => $business->id,
            'name' => 'Express Trim',
            'description' => 'Quick trim for maintaining your look',
            'duration' => 15,
            'price' => 20.00,
            'icon' => 'content_cut',
            'is_active' => true,
            'is_popular' => false,
            'sort_order' => 4,
        ]);

        $colorTreatment = Service::create([
            'business_id' => $business->id,
            'name' => 'Color Treatment',
            'description' => 'Professional hair coloring service',
            'duration' => 60,
            'price' => 85.00,
            'icon' => 'palette',
            'is_active' => true,
            'is_popular' => false,
            'sort_order' => 5,
        ]);

        $services = [$signatureHaircut, $beardSculpt, $fullExecutive, $expressTrim, $colorTreatment];

        $john->services()->attach([$signatureHaircut->id, $beardSculpt->id, $fullExecutive->id, $expressTrim->id]);
        $sarah->services()->attach([$signatureHaircut->id, $colorTreatment->id, $fullExecutive->id]);
        $marcus->services()->attach([$beardSculpt->id, $fullExecutive->id, $expressTrim->id]);
        $elena->services()->attach([$colorTreatment->id, $signatureHaircut->id, $fullExecutive->id]);

        foreach ($employees as $employee) {
            for ($day = 0; $day <= 4; $day++) {
                $schedule = Schedule::create([
                    'user_id' => $employee->id,
                    'day_of_week' => $day,
                    'start_time' => '09:00',
                    'end_time' => '17:00',
                    'is_active' => true,
                ]);

                ScheduleBreak::create([
                    'schedule_id' => $schedule->id,
                    'start_time' => '12:30',
                    'end_time' => '13:30',
                ]);
            }
        }

        $statuses = AppointmentStatus::cases();
        $firstNames = ['James', 'Michael', 'Robert', 'David', 'William', 'Emma', 'Olivia', 'Sophia', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Lucas', 'Henry', 'Alexander', 'Daniel', 'Matthew', 'Jack'];
        $lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

        $today = Carbon::today();

        for ($i = 0; $i < 20; $i++) {
            $dayOffset = $i % 7;
            $date = $today->copy()->addDays($dayOffset);

            if ($date->isWeekend()) {
                $date = $date->next(Carbon::MONDAY);
            }

            $employee = $employees[array_rand($employees)];
            $employeeServiceIds = $employee->services->pluck('id')->toArray();
            $service = Service::find($employeeServiceIds[array_rand($employeeServiceIds)]);

            $possibleHours = [9, 10, 11, 14, 15, 16];
            $hour = $possibleHours[array_rand($possibleHours)];
            $minute = [0, 30][array_rand([0, 30])];

            $startTime = sprintf('%02d:%02d', $hour, $minute);
            $endTime = Carbon::parse($date->toDateString().' '.$startTime)
                ->addMinutes($service->duration)
                ->format('H:i');

            $status = $statuses[array_rand($statuses)];
            if ($date->lt($today)) {
                $pastStatuses = [AppointmentStatus::Completed, AppointmentStatus::Cancelled];
                $status = $pastStatuses[array_rand($pastStatuses)];
            }

            Appointment::create([
                'business_id' => $business->id,
                'employee_id' => $employee->id,
                'service_id' => $service->id,
                'client_first_name' => $firstNames[array_rand($firstNames)],
                'client_last_name' => $lastNames[array_rand($lastNames)],
                'client_phone' => '+1'.rand(1000000000, 9999999999),
                'client_notes' => $i % 3 === 0 ? 'Please be on time.' : null,
                'date' => $date->toDateString(),
                'start_time' => $startTime,
                'end_time' => $endTime,
                'price' => $service->price,
                'status' => $status,
            ]);
        }
    }
}
