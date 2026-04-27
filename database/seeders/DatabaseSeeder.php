<?php

namespace Database\Seeders;

use App\Enums\AppointmentStatus;
use App\Enums\Permission;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\BusinessRole;
use App\Models\BusinessType;
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
        $this->call(BusinessTypeSeeder::class);

        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@stratos.com',
            'password' => Hash::make('password'),
            'role' => UserRole::Admin,
            'is_active' => true,
        ]);
        $admin->forceFill([
            'email_verified_at' => now(),
            'onboarding_completed_at' => now(),
        ])->save();

        $barbershopTypeId = BusinessType::query()->where('name', 'Barbershop')->value('id');

        $business = Business::create([
            'owner_id' => $admin->id,
            'business_type_id' => $barbershopTypeId,
            'name' => 'Berberi Demo',
            'slug' => 'demo-barbershop',
            'phone' => '+38349123456',
            'location' => 'Rruga Agim Ramadani, Prishtinë, Kosovë',
            'timezone' => 'Europe/Belgrade',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'slot_duration' => 30,
            'min_booking_notice' => 60,
            'max_booking_window' => 30,
            'is_active' => true,
            'client_identifier_type' => 'phone',
            'allow_employee_service_edit' => true,
            'uses_shared_resources' => false,
        ]);

        $john = User::create([
            'name' => 'John',
            'email' => 'john@stratos.com',
            'password' => Hash::make('password'),
            'role' => UserRole::Employee,
            'phone' => '+38344111222',
            'title' => 'Master berber',
            'is_active' => true,
            'business_id' => $business->id,
        ]);

        $sarah = User::create([
            'name' => 'Sarah',
            'email' => 'sarah@stratos.com',
            'password' => Hash::make('password'),
            'role' => UserRole::Employee,
            'phone' => '+38344333444',
            'title' => 'Stiliste e flokëve',
            'is_active' => true,
            'business_id' => $business->id,
        ]);

        $marcus = User::create([
            'name' => 'Marcus',
            'email' => 'marcus@stratos.com',
            'password' => Hash::make('password'),
            'role' => UserRole::Employee,
            'phone' => '+38344555666',
            'title' => 'Specialist për mjekër',
            'is_active' => true,
            'business_id' => $business->id,
        ]);

        $elena = User::create([
            'name' => 'Elena',
            'email' => 'elena@stratos.com',
            'password' => Hash::make('password'),
            'role' => UserRole::Employee,
            'phone' => '+38344777888',
            'title' => 'Specialiste ngjyrimi',
            'is_active' => true,
            'business_id' => $business->id,
        ]);

        $employees = [$john, $sarah, $marcus, $elena];

        foreach ($employees as $employee) {
            $employee->forceFill(['onboarding_completed_at' => now()])->save();
        }

        $limitedAdminPermissions = array_values(array_unique(array_merge(
            [
                Permission::AdminDashboard->value,
                Permission::AdminAppointments->value,
            ],
            array_map(fn (Permission $p) => $p->value, Permission::employeeCases())
        )));

        $administratorRole = BusinessRole::create([
            'business_id' => $business->id,
            'name' => 'Administrator',
            'permissions' => $limitedAdminPermissions,
        ]);

        $elena->forceFill(['business_role_id' => $administratorRole->id])->save();

        $prerje = Service::create([
            'business_id' => $business->id,
            'name' => 'Prerje e flokëve',
            'description' => 'Prerje profesionale me konsultim dhe stilim.',
            'duration' => 45,
            'price' => 28.00,
            'is_active' => true,
            'is_popular' => true,
            'sort_order' => 1,
        ]);

        $fade = Service::create([
            'business_id' => $business->id,
            'name' => 'Stilim me fade',
            'description' => 'Fade dhe konturë të përsosura me makina.',
            'duration' => 30,
            'price' => 22.00,
            'is_active' => true,
            'is_popular' => true,
            'sort_order' => 2,
        ]);

        $mjekër = Service::create([
            'business_id' => $business->id,
            'name' => 'Rregullim mjekre',
            'description' => 'Formësim dhe pastrim profesional i mjekrës.',
            'duration' => 25,
            'price' => 18.00,
            'is_active' => true,
            'is_popular' => false,
            'sort_order' => 3,
        ]);

        $ngjyrosje = Service::create([
            'business_id' => $business->id,
            'name' => 'Ngjyrosje flokësh',
            'description' => 'Ngjyrosje dhe rifreskim i ngjyrës me produkte premium.',
            'duration' => 90,
            'price' => 65.00,
            'is_active' => true,
            'is_popular' => false,
            'sort_order' => 4,
        ]);

        $ekspres = Service::create([
            'business_id' => $business->id,
            'name' => 'Prerje e shpejtë',
            'description' => 'Rregullim i shpejtë për në mes takimesh.',
            'duration' => 15,
            'price' => 12.00,
            'is_active' => true,
            'is_popular' => false,
            'sort_order' => 5,
        ]);

        // John: full floor + express; Sarah: cuts + color; Marcus: fade + beard + express; Elena: cut + color (subset)
        $john->services()->attach([$prerje->id, $fade->id, $mjekër->id, $ekspres->id]);
        $sarah->services()->attach([$prerje->id, $ngjyrosje->id, $ekspres->id]);
        $marcus->services()->attach([$fade->id, $mjekër->id, $ekspres->id]);
        $elena->services()->attach([$prerje->id, $ngjyrosje->id]);

        foreach ($employees as $employee) {
            // Monday (0) through Saturday (5), closed Sunday (6)
            for ($day = 0; $day <= 5; $day++) {
                $schedule = Schedule::create([
                    'user_id' => $employee->id,
                    'day_of_week' => $day,
                    'start_time' => '09:00',
                    'end_time' => '18:00',
                    'is_active' => true,
                ]);

                ScheduleBreak::create([
                    'schedule_id' => $schedule->id,
                    'start_time' => '13:00',
                    'end_time' => '14:00',
                ]);
            }
        }

        $this->seedAprilDemoAppointments($business, $john, $sarah, $marcus, $elena, $prerje, $fade, $mjekër, $ngjyrosje, $ekspres);
    }

    private function seedAprilDemoAppointments(
        Business $business,
        User $john,
        User $sarah,
        User $marcus,
        User $elena,
        Service $prerje,
        Service $fade,
        Service $mjekër,
        Service $ngjyrosje,
        Service $ekspres,
    ): void {
        $rows = [
            ['2026-04-01', '09:00', $john, $prerje, 'Ardian', 'Krasniqi', '+38345111001', 'Kthyer pas dy javësh.', AppointmentStatus::Confirmed],
            ['2026-04-01', '10:30', $sarah, $ngjyrosje, 'Edona', 'Berisha', '+38345222002', null, AppointmentStatus::Pending],
            ['2026-04-01', '14:00', $marcus, $fade, 'Besnik', 'Hoxha', '+38345333003', null, AppointmentStatus::Confirmed],
            ['2026-04-02', '09:30', $elena, $prerje, 'Dren', 'Gashi', '+38345444004', null, AppointmentStatus::Pending],
            ['2026-04-02', '11:00', $john, $mjekër, 'Fatmir', 'Morina', '+38345555005', 'Mjekër e shkurtër.', AppointmentStatus::Confirmed],
            ['2026-04-02', '15:00', $sarah, $ekspres, 'Liridona', 'Rexha', '+38345666006', null, AppointmentStatus::Cancelled],
            ['2026-04-03', '09:00', $marcus, $mjekër, 'Valmir', 'Shala', '+38345777007', null, AppointmentStatus::Confirmed],
            ['2026-04-03', '10:00', $john, $fade, 'Granit', 'Ahmeti', '+38345888008', null, AppointmentStatus::Pending],
            ['2026-04-03', '14:30', $elena, $ngjyrosje, 'Teuta', 'Krasniqi', '+38345999009', 'Pa amoniak.', AppointmentStatus::Confirmed],
            ['2026-04-06', '09:00', $sarah, $prerje, 'Albana', 'Berisha', '+38345100100', null, AppointmentStatus::Pending],
            ['2026-04-06', '11:30', $john, $prerje, 'Kushtrim', 'Leka', '+38345200200', null, AppointmentStatus::Confirmed],
            ['2026-04-07', '09:00', $john, $ekspres, 'Arta', 'Hyseni', '+38345300300', null, AppointmentStatus::Confirmed],
            ['2026-04-07', '10:00', $marcus, $fade, 'Endrit', 'Kelmendi', '+38345400400', null, AppointmentStatus::Pending],
            ['2026-04-07', '14:00', $sarah, $ngjyrosje, 'Fjolla', 'Rama', '+38345500500', null, AppointmentStatus::Confirmed],
            ['2026-04-08', '09:30', $elena, $prerje, 'Gent', 'Berisha', '+38345600600', null, AppointmentStatus::Confirmed],
            ['2026-04-08', '11:00', $john, $mjekër, 'Ilir', 'Gashi', '+38345700700', null, AppointmentStatus::Pending],
            ['2026-04-08', '15:30', $marcus, $mjekër, 'Jeton', 'Hoxha', '+38345800800', null, AppointmentStatus::Cancelled],
            ['2026-04-09', '09:00', $sarah, $prerje, 'Krenar', 'Morina', '+38345900900', null, AppointmentStatus::Confirmed],
            ['2026-04-09', '13:00', $john, $fade, 'Luan', 'Shala', '+38345101010', null, AppointmentStatus::Pending],
            ['2026-04-10', '09:00', $marcus, $ekspres, 'Mimoza', 'Rexha', '+38345202020', null, AppointmentStatus::Confirmed],
            ['2026-04-10', '10:30', $elena, $ngjyrosje, 'Nora', 'Ahmeti', '+38345303030', 'Balayage.', AppointmentStatus::Pending],
            ['2026-04-10', '14:00', $john, $prerje, 'Orges', 'Krasniqi', '+38345404040', null, AppointmentStatus::Confirmed],
            ['2026-04-13', '09:00', $sarah, $ekspres, 'Pranvera', 'Leka', '+38345505050', null, AppointmentStatus::Confirmed],
            ['2026-04-13', '11:00', $marcus, $fade, 'Qendrim', 'Berisha', '+38345606060', null, AppointmentStatus::Pending],
            ['2026-04-14', '09:00', $john, $prerje, 'Rina', 'Hoxha', '+38345707070', null, AppointmentStatus::Confirmed],
            ['2026-04-14', '10:30', $sarah, $ngjyrosje, 'Skender', 'Gashi', '+38345808080', null, AppointmentStatus::Pending],
            ['2026-04-14', '14:30', $elena, $prerje, 'Trim', 'Morina', '+38345909090', null, AppointmentStatus::Confirmed],
            ['2026-04-15', '09:00', $marcus, $mjekër, 'Urim', 'Shala', '+38345010101', null, AppointmentStatus::Confirmed],
            ['2026-04-15', '11:30', $john, $fade, 'Vlera', 'Rexha', '+38345111111', null, AppointmentStatus::Pending],
            ['2026-04-15', '15:00', $sarah, $prerje, 'Xhavit', 'Ahmeti', '+38345212121', null, AppointmentStatus::Cancelled],
            ['2026-04-16', '09:00', $john, $mjekër, 'Yllka', 'Krasniqi', '+38345313131', null, AppointmentStatus::Confirmed],
            ['2026-04-16', '10:00', $elena, $ngjyrosje, 'Zana', 'Berisha', '+38345414141', null, AppointmentStatus::Pending],
            ['2026-04-17', '09:30', $sarah, $prerje, 'Agron', 'Leka', '+38345515151', null, AppointmentStatus::Confirmed],
            ['2026-04-17', '14:00', $marcus, $fade, 'Blerta', 'Hyseni', '+38345616161', null, AppointmentStatus::Pending],
            ['2026-04-20', '09:00', $john, $prerje, 'Dardan', 'Rama', '+38345717171', null, AppointmentStatus::Confirmed],
            ['2026-04-20', '11:00', $marcus, $ekspres, 'Era', 'Kelmendi', '+38345818181', null, AppointmentStatus::Confirmed],
            ['2026-04-20', '15:00', $sarah, $ngjyrosje, 'Fisnik', 'Gashi', '+38345919191', null, AppointmentStatus::Pending],
            ['2026-04-21', '09:00', $elena, $prerje, 'Gresa', 'Morina', '+38345020202', null, AppointmentStatus::Confirmed],
            ['2026-04-21', '13:30', $john, $fade, 'Hekuran', 'Shala', '+38345121212', null, AppointmentStatus::Pending],
            ['2026-04-22', '09:00', $sarah, $ekspres, 'Igballe', 'Hoxha', '+38345222222', null, AppointmentStatus::Confirmed],
            ['2026-04-22', '10:30', $marcus, $mjekër, 'Jeta', 'Rexha', '+38345323232', null, AppointmentStatus::Confirmed],
            ['2026-04-23', '09:00', $john, $prerje, 'Klodiana', 'Ahmeti', '+38345424242', null, AppointmentStatus::Pending],
            ['2026-04-23', '14:00', $elena, $ngjyrosje, 'Leonora', 'Krasniqi', '+38345525252', null, AppointmentStatus::Confirmed],
            ['2026-04-24', '09:00', $marcus, $fade, 'Mentor', 'Berisha', '+38345626262', null, AppointmentStatus::Confirmed],
            ['2026-04-24', '11:00', $sarah, $prerje, 'Njomza', 'Leka', '+38345727272', null, AppointmentStatus::Cancelled],
            ['2026-04-27', '09:30', $john, $mjekër, 'Olti', 'Gashi', '+38345828282', null, AppointmentStatus::Confirmed],
            ['2026-04-27', '13:00', $elena, $prerje, 'Pranvera', 'Morina', '+38345929292', null, AppointmentStatus::Pending],
            ['2026-04-28', '09:00', $sarah, $ngjyrosje, 'Rinor', 'Shala', '+38345030303', null, AppointmentStatus::Confirmed],
            ['2026-04-28', '12:00', $john, $ekspres, 'Shpresa', 'Rama', '+38345131313', null, AppointmentStatus::Pending],
            ['2026-04-29', '09:00', $marcus, $mjekër, 'Taulant', 'Hyseni', '+38345232323', null, AppointmentStatus::Confirmed],
            ['2026-04-29', '10:30', $sarah, $prerje, 'Uesa', 'Kelmendi', '+38345333333', null, AppointmentStatus::Confirmed],
            ['2026-04-30', '09:00', $john, $fade, 'Valmira', 'Hoxha', '+38345434343', null, AppointmentStatus::Pending],
            ['2026-04-30', '14:00', $elena, $ngjyrosje, 'Xheni', 'Berisha', '+38345535353', 'Fundi i muajit.', AppointmentStatus::Confirmed],
        ];

        foreach ($rows as $row) {
            $start = $row[1];
            $employee = $row[2];
            $service = $row[3];
            $end = Carbon::parse($row[0].' '.$start, $business->timezone ?: 'Europe/Belgrade')
                ->addMinutes($service->duration)
                ->format('H:i');

            Appointment::create([
                'business_id' => $business->id,
                'employee_id' => $employee->id,
                'service_id' => $service->id,
                'client_first_name' => $row[4],
                'client_last_name' => $row[5],
                'client_phone' => $row[6],
                'client_notes' => $row[7],
                'date' => $row[0],
                'start_time' => $start,
                'end_time' => $end,
                'price' => $service->price,
                'status' => $row[8],
            ]);
        }
    }
}
