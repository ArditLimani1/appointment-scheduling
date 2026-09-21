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
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Demo nail salon modeled on typical Prishtina studios (e.g. Mon–Fri 09–19, Sat 10–18).
 * Prices/durations sit in the common local range: gel manicure ~€10–15 / 45–55 min,
 * gel removal ~€5 / 30 min, pedicure and extensions higher.
 */
class NailSalonDemoSeeder extends Seeder
{
    public const SLUG = 'studio-aurora-thonjesh';

    public function run(): void
    {
        $this->call(BusinessTypeSeeder::class);

        if (Business::query()->where('slug', self::SLUG)->exists()) {
            $this->command?->info('Studio Aurora Thonjësh already seeded — skipping.');

            return;
        }

        $owner = User::create([
            'name' => 'Leonora Gashi',
            'email' => 'leonora@aurora-nails.com',
            'password' => Hash::make('password'),
        ]);
        $owner->forceFill([
            'role' => UserRole::Admin,
            'is_active' => true,
            'phone' => '+38344123456',
            'title' => 'Pronare & master nail artist',
            'booking_slug' => 'leonora-gashi',
            'email_verified_at' => now(),
            'onboarding_completed_at' => now(),
            'locale' => 'sq',
        ])->save();

        $nailSalonTypeId = BusinessType::query()->where('name', 'Nail salon')->value('id');

        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => $nailSalonTypeId,
            'name' => 'Studio Aurora Thonjësh',
            'slug' => self::SLUG,
            'phone' => '+38344123456',
            'email' => 'info@aurora-nails.com',
            'location' => 'Rruga B, Dardani, Prishtinë, Kosovë',
            'description' => 'Studio profesionale e thonjëve në Prishtinë — manikyr, pedikyr dhe gell me produkte cilësore dhe higjienë të lartë.',
            'timezone' => 'Europe/Belgrade',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'slot_duration' => 15,
            'min_booking_notice' => 120,
            'max_booking_window' => 21,
            'is_active' => true,
            'client_identifier_type' => 'phone',
            'allow_employee_service_edit' => true,
            'uses_shared_resources' => false,
            'auto_confirm_appointments' => true,
            'single_employee_mode' => false,
            'reminders_enabled' => true,
            'reminder_hours_before' => 24,
        ]);

        // Owner also takes appointments (common for small Kosovo nail studios).
        $owner->syncAlsoWorksAsStaff($business, true);
        $owner->forceFill([
            'title' => 'Pronare & master nail artist',
            'booking_slug' => 'leonora-gashi',
        ])->save();

        $blerta = User::create([
            'name' => 'Blerta Krasniqi',
            'email' => 'blerta@aurora-nails.com',
            'password' => Hash::make('password'),
            'phone' => '+38349111222',
            'title' => 'Specialiste manikyri & gell',
            'booking_slug' => 'blerta-krasniqi',
        ]);
        $blerta->forceFill([
            'role' => UserRole::Employee,
            'is_active' => true,
            'business_id' => $business->id,
            'email_verified_at' => now(),
            'onboarding_completed_at' => now(),
            'locale' => 'sq',
        ])->save();

        $arta = User::create([
            'name' => 'Arta Berisha',
            'email' => 'arta@aurora-nails.com',
            'password' => Hash::make('password'),
            'phone' => '+38349333444',
            'title' => 'Specialiste pedikyri & nail art',
            'booking_slug' => 'arta-berisha',
        ]);
        $arta->forceFill([
            'role' => UserRole::Employee,
            'is_active' => true,
            'business_id' => $business->id,
            'email_verified_at' => now(),
            'onboarding_completed_at' => now(),
            'locale' => 'sq',
        ])->save();

        $staffRole = BusinessRole::create([
            'business_id' => $business->id,
            'name' => 'Punonjëse',
            'permissions' => array_map(fn (Permission $p) => $p->value, Permission::employeeCases()),
        ]);

        foreach ([$blerta, $arta] as $employee) {
            $employee->forceFill(['business_role_id' => $staffRole->id])->save();
        }

        // Typical Prishtina nail-salon menu (Albanian labels, EUR).
        $manikyrKlasik = $this->service($business, 'Manikyr klasik', 'Formësim, kujdes i kutikulës dhe llak klasik.', 35, 8.00, true, 1);
        $manikyrGell = $this->service($business, 'Manikyr me gell', 'Manikyr me llak gell gjysmë të përhershëm (45–55 min).', 50, 12.00, true, 2);
        $mbushjeGell = $this->service($business, 'Mbushje me gell', 'Korrigjim / mbushje e thonjëve me gell ekzistues.', 55, 14.00, true, 3);
        $mbjellje = $this->service($business, 'Mbjellje thonjësh (soft gel)', 'Zgjatim dhe ndërtim me soft gel për formë të re.', 100, 25.00, true, 4);
        $heqjaGellit = $this->service($business, 'Heqja e gellit', 'Heqje e sigurt e llakut gell pa dëmtuar thonjin.', 25, 5.00, false, 5);
        $pedikyrKlasik = $this->service($business, 'Pedikyr klasik', 'Kujdes i këmbëve, formësim dhe llak klasik.', 50, 15.00, true, 6);
        $pedikyrGell = $this->service($business, 'Pedikyr me gell', 'Pedikyr i plotë me llak gell.', 65, 18.00, true, 7);
        $nailArt = $this->service($business, 'Dizajn / nail art', 'Shtesë dizajni (french, floreale, thjeshtë).', 20, 5.00, false, 8);
        $combo = $this->service($business, 'Manikyr + pedikyr me gell', 'Paketë e kombinuar për duar dhe këmbë.', 110, 28.00, true, 9);

        $allServiceIds = [
            $manikyrKlasik->id,
            $manikyrGell->id,
            $mbushjeGell->id,
            $mbjellje->id,
            $heqjaGellit->id,
            $pedikyrKlasik->id,
            $pedikyrGell->id,
            $nailArt->id,
            $combo->id,
        ];

        // Leonora offers the full menu; Blerta focuses on hands; Arta on feet + art.
        $owner->services()->sync($allServiceIds);

        $blerta->services()->attach([
            $manikyrKlasik->id,
            $manikyrGell->id,
            $mbushjeGell->id,
            $mbjellje->id,
            $heqjaGellit->id,
            $nailArt->id,
            $combo->id,
        ]);

        $arta->services()->attach([
            $manikyrKlasik->id,
            $manikyrGell->id,
            $heqjaGellit->id,
            $pedikyrKlasik->id,
            $pedikyrGell->id,
            $nailArt->id,
            $combo->id,
        ]);

        // Replace default owner schedule with salon hours; same for hired staff.
        foreach ([$owner, $blerta, $arta] as $employee) {
            $this->seedSalonSchedule($employee);
        }

        $this->seedAppointments(
            $business,
            $owner,
            $blerta,
            $arta,
            $manikyrKlasik,
            $manikyrGell,
            $mbushjeGell,
            $mbjellje,
            $heqjaGellit,
            $pedikyrKlasik,
            $pedikyrGell,
            $nailArt,
            $combo,
        );

        $this->seedOctoberAppointments(
            $business,
            $owner,
            $blerta,
            $arta,
            $manikyrKlasik,
            $manikyrGell,
            $mbushjeGell,
            $mbjellje,
            $heqjaGellit,
            $pedikyrKlasik,
            $pedikyrGell,
            $nailArt,
            $combo,
        );

        $this->command?->info('Studio Aurora Thonjësh seeded. Booking: /book/'.self::SLUG);
    }

    private function seedSalonSchedule(User $employee): void
    {
        $employee->loadMissing('schedules');
        foreach ($employee->schedules as $schedule) {
            $schedule->breaks()->delete();
        }
        $employee->schedules()->delete();

        // Mon–Fri 09:00–19:00, Saturday 10:00–18:00, Sunday closed.
        for ($day = 0; $day <= 4; $day++) {
            $schedule = Schedule::create([
                'user_id' => $employee->id,
                'day_of_week' => $day,
                'start_time' => '09:00',
                'end_time' => '19:00',
                'is_active' => true,
            ]);
            ScheduleBreak::create([
                'schedule_id' => $schedule->id,
                'start_time' => '13:00',
                'end_time' => '14:00',
            ]);
        }

        $saturday = Schedule::create([
            'user_id' => $employee->id,
            'day_of_week' => 5,
            'start_time' => '10:00',
            'end_time' => '18:00',
            'is_active' => true,
        ]);
        ScheduleBreak::create([
            'schedule_id' => $saturday->id,
            'start_time' => '13:00',
            'end_time' => '13:30',
        ]);

        Schedule::create([
            'user_id' => $employee->id,
            'day_of_week' => 6,
            'start_time' => '09:00',
            'end_time' => '17:00',
            'is_active' => false,
        ]);
    }

    private function service(
        Business $business,
        string $name,
        string $description,
        int $duration,
        float $price,
        bool $popular,
        int $sortOrder,
    ): Service {
        return Service::create([
            'business_id' => $business->id,
            'name' => $name,
            'description' => $description,
            'duration' => $duration,
            'price' => $price,
            'is_active' => true,
            'is_popular' => $popular,
            'sort_order' => $sortOrder,
        ]);
    }

    private function seedAppointments(
        Business $business,
        User $leonora,
        User $blerta,
        User $arta,
        Service $manikyrKlasik,
        Service $manikyrGell,
        Service $mbushjeGell,
        Service $mbjellje,
        Service $heqjaGellit,
        Service $pedikyrKlasik,
        Service $pedikyrGell,
        Service $nailArt,
        Service $combo,
    ): void {
        $tz = $business->timezone ?: 'Europe/Belgrade';
        $today = Carbon::today($tz);

        // Relative to today so the demo stays useful after re-seed.
        $rows = [
            // Recent / past
            [-2, '10:00', $blerta, $manikyrGell, 'Era', 'Krasniqi', '+38345100101', null, AppointmentStatus::Confirmed],
            [-2, '11:00', $arta, $pedikyrGell, 'Fjolla', 'Berisha', '+38345100102', 'Ngjyra nude.', AppointmentStatus::Confirmed],
            [-2, '14:00', $leonora, $mbjellje, 'Drita', 'Ahmeti', '+38345100201', 'Klientë e rregullt e Leonorës.', AppointmentStatus::Confirmed],
            [-1, '09:30', $blerta, $mbushjeGell, 'Gresa', 'Hoxha', '+38345100103', null, AppointmentStatus::Confirmed],
            [-1, '11:00', $leonora, $manikyrGell, 'Sara', 'Berisha', '+38345100202', 'French + glitter.', AppointmentStatus::Confirmed],
            [-1, '15:00', $arta, $manikyrKlasik, 'Hana', 'Morina', '+38345100104', null, AppointmentStatus::Confirmed],

            // Today
            [0, '09:00', $blerta, $manikyrGell, 'Iliriana', 'Gashi', '+38345100105', null, AppointmentStatus::Confirmed],
            [0, '09:30', $leonora, $combo, 'Arta', 'Krasniqi', '+38345100203', 'Paketë e plotë.', AppointmentStatus::Confirmed],
            [0, '10:00', $arta, $pedikyrKlasik, 'Jehona', 'Shala', '+38345100106', null, AppointmentStatus::Confirmed],
            [0, '11:30', $blerta, $heqjaGellit, 'Kaltrina', 'Rexha', '+38345100107', 'Pastaj manikyr i ri.', AppointmentStatus::Pending],
            [0, '14:00', $arta, $pedikyrGell, 'Lira', 'Ahmeti', '+38345100108', null, AppointmentStatus::Confirmed],
            [0, '14:30', $leonora, $mbushjeGell, 'Vesa', 'Hoxha', '+38345100204', null, AppointmentStatus::Confirmed],
            [0, '16:00', $blerta, $mbjellje, 'Mimoza', 'Leka', '+38345100109', 'Formë almond.', AppointmentStatus::Confirmed],
            [0, '16:30', $leonora, $nailArt, 'Tringa', 'Gashi', '+38345100205', 'Lule në dy thonj.', AppointmentStatus::Pending],

            // Next days
            [1, '09:00', $blerta, $manikyrGell, 'Nora', 'Kelmendi', '+38345100110', null, AppointmentStatus::Confirmed],
            [1, '09:00', $leonora, $mbjellje, 'Leona', 'Morina', '+38345100206', 'Formë coffin.', AppointmentStatus::Confirmed],
            [1, '10:00', $arta, $combo, 'Olta', 'Rama', '+38345100111', 'Dasma e kushërirës.', AppointmentStatus::Confirmed],
            [1, '14:30', $blerta, $mbushjeGell, 'Pranvera', 'Hyseni', '+38345100112', null, AppointmentStatus::Pending],
            [1, '15:00', $leonora, $manikyrGell, 'Rina', 'Shala', '+38345100207', null, AppointmentStatus::Confirmed],
            [1, '16:00', $arta, $nailArt, 'Qëndresa', 'Krasniqi', '+38345100113', 'French tip.', AppointmentStatus::Confirmed],

            [2, '09:30', $arta, $pedikyrGell, 'Rina', 'Berisha', '+38345100114', null, AppointmentStatus::Confirmed],
            [2, '10:00', $leonora, $pedikyrGell, 'Elona', 'Rexha', '+38345100208', null, AppointmentStatus::Confirmed],
            [2, '11:00', $blerta, $manikyrGell, 'Shpresa', 'Gashi', '+38345100115', null, AppointmentStatus::Confirmed],
            [2, '14:00', $blerta, $mbjellje, 'Teuta', 'Morina', '+38345100116', null, AppointmentStatus::Pending],
            [2, '14:00', $leonora, $manikyrGell, 'Anjeza', 'Leka', '+38345100209', null, AppointmentStatus::Confirmed],
            [2, '15:00', $arta, $manikyrKlasik, 'Uesa', 'Shala', '+38345100117', null, AppointmentStatus::Cancelled],

            [3, '10:00', $blerta, $manikyrGell, 'Valmira', 'Rexha', '+38345100118', null, AppointmentStatus::Confirmed],
            [3, '10:30', $leonora, $mbushjeGell, 'Blerina', 'Ahmeti', '+38345100210', null, AppointmentStatus::Pending],
            [3, '11:00', $arta, $pedikyrKlasik, 'Xheneta', 'Ahmeti', '+38345100119', null, AppointmentStatus::Pending],
            [3, '14:00', $blerta, $mbushjeGell, 'Yllka', 'Leka', '+38345100120', null, AppointmentStatus::Confirmed],
            [3, '15:00', $leonora, $combo, 'Donjeta', 'Hyseni', '+38345100211', 'Për dasmë.', AppointmentStatus::Confirmed],
            [3, '16:30', $arta, $pedikyrGell, 'Zana', 'Hoxha', '+38345100121', null, AppointmentStatus::Confirmed],

            [5, '10:00', $blerta, $combo, 'Albana', 'Krasniqi', '+38345100122', 'Fundjavë.', AppointmentStatus::Confirmed],
            [5, '10:00', $leonora, $manikyrGell, 'Fjolla', 'Rama', '+38345100212', null, AppointmentStatus::Confirmed],
            [5, '10:30', $arta, $manikyrGell, 'Blerta', 'Berisha', '+38345100123', null, AppointmentStatus::Pending],
            [5, '14:00', $blerta, $mbushjeGell, 'Dafina', 'Gashi', '+38345100124', null, AppointmentStatus::Confirmed],
            [5, '14:30', $leonora, $mbjellje, 'Gentiana', 'Morina', '+38345100213', null, AppointmentStatus::Confirmed],
            [5, '15:00', $arta, $pedikyrGell, 'Elira', 'Morina', '+38345100125', null, AppointmentStatus::Confirmed],

            [7, '09:00', $blerta, $manikyrGell, 'Fitore', 'Shala', '+38345100126', null, AppointmentStatus::Confirmed],
            [7, '09:30', $leonora, $manikyrGell, 'Hana', 'Kelmendi', '+38345100214', null, AppointmentStatus::Confirmed],
            [7, '10:00', $arta, $pedikyrKlasik, 'Gentiana', 'Rexha', '+38345100127', null, AppointmentStatus::Pending],
            [7, '11:30', $blerta, $heqjaGellit, 'Hajrie', 'Ahmeti', '+38345100128', null, AppointmentStatus::Confirmed],
            [7, '14:00', $arta, $manikyrGell, 'Igballe', 'Leka', '+38345100129', 'Ngjyra e kuqe.', AppointmentStatus::Confirmed],
            [7, '14:00', $leonora, $pedikyrGell, 'Luljeta', 'Berisha', '+38345100215', null, AppointmentStatus::Pending],
            [7, '16:00', $blerta, $mbjellje, 'Jonida', 'Hyseni', '+38345100130', null, AppointmentStatus::Pending],

            [8, '09:30', $arta, $pedikyrGell, 'Kujtesa', 'Rama', '+38345100131', null, AppointmentStatus::Confirmed],
            [8, '10:00', $leonora, $mbushjeGell, 'Merita', 'Gashi', '+38345100216', null, AppointmentStatus::Confirmed],
            [8, '11:00', $blerta, $manikyrGell, 'Luljeta', 'Kelmendi', '+38345100132', null, AppointmentStatus::Confirmed],
            [8, '14:30', $arta, $nailArt, 'Marigona', 'Krasniqi', '+38345100133', 'Lule në dy thonj.', AppointmentStatus::Pending],
            [8, '15:00', $blerta, $mbushjeGell, 'Njomza', 'Berisha', '+38345100134', null, AppointmentStatus::Confirmed],
            [8, '16:00', $leonora, $nailArt, 'Shpresa', 'Hoxha', '+38345100217', 'Ombre.', AppointmentStatus::Confirmed],

            [10, '10:00', $blerta, $manikyrGell, 'Ardiana', 'Hoxha', '+38345100135', null, AppointmentStatus::Confirmed],
            [10, '10:30', $leonora, $manikyrGell, 'Teuta', 'Shala', '+38345100218', null, AppointmentStatus::Confirmed],
            [10, '11:00', $arta, $combo, 'Besiana', 'Gashi', '+38345100136', null, AppointmentStatus::Pending],
            [10, '14:00', $blerta, $mbjellje, 'Drita', 'Morina', '+38345100137', 'Coffin shape.', AppointmentStatus::Confirmed],
            [10, '14:00', $leonora, $combo, 'Valmira', 'Rexha', '+38345100219', null, AppointmentStatus::Pending],
            [10, '15:30', $arta, $pedikyrGell, 'Edona', 'Shala', '+38345100138', null, AppointmentStatus::Confirmed],

            [12, '09:00', $blerta, $manikyrGell, 'Fatmire', 'Rexha', '+38345100139', null, AppointmentStatus::Pending],
            [12, '09:30', $leonora, $mbjellje, 'Yllka', 'Ahmeti', '+38345100220', null, AppointmentStatus::Confirmed],
            [12, '10:30', $arta, $pedikyrKlasik, 'Garentina', 'Ahmeti', '+38345100140', null, AppointmentStatus::Confirmed],
            [12, '14:00', $blerta, $mbushjeGell, 'Hasime', 'Leka', '+38345100141', null, AppointmentStatus::Confirmed],
            [12, '15:00', $leonora, $manikyrGell, 'Zana', 'Leka', '+38345100221', null, AppointmentStatus::Confirmed],
            [12, '16:00', $arta, $manikyrGell, 'Vlera', 'Hyseni', '+38345100142', null, AppointmentStatus::Cancelled],

            [14, '09:00', $blerta, $manikyrGell, 'Aulona', 'Rama', '+38345100143', null, AppointmentStatus::Confirmed],
            [14, '09:00', $leonora, $pedikyrGell, 'Emine', 'Krasniqi', '+38345100222', null, AppointmentStatus::Confirmed],
            [14, '10:00', $arta, $pedikyrGell, 'Besa', 'Kelmendi', '+38345100144', null, AppointmentStatus::Pending],
            [14, '14:00', $blerta, $combo, 'Donika', 'Krasniqi', '+38345100145', 'Për ditëlindje.', AppointmentStatus::Confirmed],
            [14, '14:30', $leonora, $mbushjeGell, 'Njomza', 'Hoxha', '+38345100223', null, AppointmentStatus::Pending],
            [14, '15:00', $arta, $manikyrKlasik, 'Emine', 'Berisha', '+38345100146', null, AppointmentStatus::Confirmed],
        ];

        foreach ($rows as $row) {
            [$offset, $start, $employee, $service, $first, $last, $phone, $notes, $status] = $row;

            $date = $today->copy()->addDays($offset);
            // Studio closed Sunday — push to Monday.
            if ($date->isSunday()) {
                $date->addDay();
            }

            // Saturday opens at 10:00.
            if ($date->isSaturday() && strcmp($start, '10:00') < 0) {
                $start = '10:00';
            }

            $end = Carbon::parse($date->toDateString().' '.$start, $tz)
                ->addMinutes($service->duration)
                ->format('H:i');

            Appointment::create([
                'business_id' => $business->id,
                'employee_id' => $employee->id,
                'employee_name' => $employee->name,
                'service_id' => $service->id,
                'service_name' => $service->name,
                'client_first_name' => $first,
                'client_last_name' => $last,
                'client_phone' => $phone,
                'client_notes' => $notes,
                'date' => $date->toDateString(),
                'start_time' => $start,
                'end_time' => $end,
                'price' => $service->price,
                'status' => $status,
            ]);
        }
    }

    /**
     * Dense October calendar so the demo has a full month of bookings ahead.
     */
    private function seedOctoberAppointments(
        Business $business,
        User $leonora,
        User $blerta,
        User $arta,
        Service $manikyrKlasik,
        Service $manikyrGell,
        Service $mbushjeGell,
        Service $mbjellje,
        Service $heqjaGellit,
        Service $pedikyrKlasik,
        Service $pedikyrGell,
        Service $nailArt,
        Service $combo,
    ): void {
        $tz = $business->timezone ?: 'Europe/Belgrade';

        // [day, start, employee, service, first, last, phone, notes, status]
        $rows = [
            [1, '09:00', $blerta, $manikyrGell, 'Aferdita', 'Krasniqi', '+38345201001', null, AppointmentStatus::Confirmed],
            [1, '10:00', $leonora, $mbjellje, 'Blerona', 'Berisha', '+38345201002', 'Fillim tetori.', AppointmentStatus::Confirmed],
            [1, '11:00', $arta, $pedikyrGell, 'Dafina', 'Gashi', '+38345201003', null, AppointmentStatus::Pending],
            [1, '14:00', $blerta, $mbushjeGell, 'Elona', 'Hoxha', '+38345201004', null, AppointmentStatus::Confirmed],
            [1, '15:00', $leonora, $manikyrGell, 'Fitore', 'Morina', '+38345201005', null, AppointmentStatus::Confirmed],
            [1, '16:00', $arta, $manikyrKlasik, 'Gresa', 'Shala', '+38345201006', null, AppointmentStatus::Confirmed],

            [2, '09:30', $leonora, $combo, 'Hana', 'Rexha', '+38345201007', null, AppointmentStatus::Confirmed],
            [2, '10:00', $blerta, $manikyrGell, 'Ilira', 'Ahmeti', '+38345201008', null, AppointmentStatus::Pending],
            [2, '11:00', $arta, $pedikyrKlasik, 'Jeta', 'Leka', '+38345201009', null, AppointmentStatus::Confirmed],
            [2, '14:30', $blerta, $mbjellje, 'Kaltrina', 'Hyseni', '+38345201010', 'Formë almond.', AppointmentStatus::Confirmed],
            [2, '15:00', $arta, $pedikyrGell, 'Lira', 'Rama', '+38345201011', null, AppointmentStatus::Confirmed],
            [2, '16:30', $leonora, $nailArt, 'Mimoza', 'Kelmendi', '+38345201012', 'French.', AppointmentStatus::Pending],

            [3, '09:00', $arta, $pedikyrGell, 'Nora', 'Krasniqi', '+38345201013', null, AppointmentStatus::Confirmed],
            [3, '10:00', $blerta, $manikyrGell, 'Olta', 'Berisha', '+38345201014', null, AppointmentStatus::Confirmed],
            [3, '10:30', $leonora, $mbushjeGell, 'Pranvera', 'Gashi', '+38345201015', null, AppointmentStatus::Confirmed],
            [3, '14:00', $blerta, $heqjaGellit, 'Qendresa', 'Morina', '+38345201016', null, AppointmentStatus::Pending],
            [3, '14:00', $leonora, $manikyrGell, 'Rina', 'Hoxha', '+38345201017', null, AppointmentStatus::Confirmed],
            [3, '15:30', $arta, $manikyrGell, 'Shpresa', 'Shala', '+38345201018', null, AppointmentStatus::Confirmed],

            [4, '10:00', $blerta, $combo, 'Teuta', 'Rexha', '+38345201019', 'Fundjavë e hershme.', AppointmentStatus::Confirmed],
            [4, '10:00', $leonora, $manikyrGell, 'Uesa', 'Ahmeti', '+38345201020', null, AppointmentStatus::Confirmed],
            [4, '10:30', $arta, $pedikyrGell, 'Valmira', 'Leka', '+38345201021', null, AppointmentStatus::Pending],
            [4, '14:00', $blerta, $mbushjeGell, 'Xheneta', 'Hyseni', '+38345201022', null, AppointmentStatus::Confirmed],
            [4, '14:30', $leonora, $mbjellje, 'Yllka', 'Rama', '+38345201023', 'Coffin.', AppointmentStatus::Confirmed],
            [4, '15:00', $arta, $nailArt, 'Zana', 'Kelmendi', '+38345201024', null, AppointmentStatus::Confirmed],

            [6, '09:00', $blerta, $manikyrGell, 'Albana', 'Krasniqi', '+38345201025', null, AppointmentStatus::Confirmed],
            [6, '09:30', $leonora, $pedikyrGell, 'Besiana', 'Berisha', '+38345201026', null, AppointmentStatus::Confirmed],
            [6, '10:00', $arta, $pedikyrKlasik, 'Drita', 'Gashi', '+38345201027', null, AppointmentStatus::Pending],
            [6, '14:00', $blerta, $mbjellje, 'Edona', 'Hoxha', '+38345201028', null, AppointmentStatus::Confirmed],
            [6, '14:00', $leonora, $manikyrGell, 'Fjolla', 'Morina', '+38345201029', null, AppointmentStatus::Confirmed],
            [6, '16:00', $arta, $manikyrGell, 'Gentiana', 'Shala', '+38345201030', null, AppointmentStatus::Confirmed],

            [7, '09:00', $leonora, $mbushjeGell, 'Hasime', 'Rexha', '+38345201031', null, AppointmentStatus::Confirmed],
            [7, '10:00', $blerta, $manikyrGell, 'Igballe', 'Ahmeti', '+38345201032', null, AppointmentStatus::Pending],
            [7, '11:00', $arta, $pedikyrGell, 'Jonida', 'Leka', '+38345201033', null, AppointmentStatus::Confirmed],
            [7, '14:30', $blerta, $mbushjeGell, 'Kujtesa', 'Hyseni', '+38345201034', null, AppointmentStatus::Confirmed],
            [7, '15:00', $leonora, $combo, 'Luljeta', 'Rama', '+38345201035', null, AppointmentStatus::Confirmed],
            [7, '16:00', $arta, $manikyrKlasik, 'Marigona', 'Kelmendi', '+38345201036', null, AppointmentStatus::Cancelled],

            [8, '09:30', $arta, $pedikyrGell, 'Njomza', 'Krasniqi', '+38345201037', null, AppointmentStatus::Confirmed],
            [8, '10:00', $blerta, $manikyrGell, 'Ardiana', 'Berisha', '+38345201038', null, AppointmentStatus::Confirmed],
            [8, '10:30', $leonora, $mbjellje, 'Besa', 'Gashi', '+38345201039', null, AppointmentStatus::Pending],
            [8, '14:00', $blerta, $heqjaGellit, 'Donika', 'Hoxha', '+38345201040', null, AppointmentStatus::Confirmed],
            [8, '14:30', $leonora, $manikyrGell, 'Emine', 'Morina', '+38345201041', null, AppointmentStatus::Confirmed],
            [8, '15:30', $arta, $pedikyrKlasik, 'Fatmire', 'Shala', '+38345201042', null, AppointmentStatus::Confirmed],

            [9, '09:00', $blerta, $manikyrGell, 'Garentina', 'Rexha', '+38345201043', null, AppointmentStatus::Confirmed],
            [9, '09:00', $leonora, $manikyrGell, 'Hajrie', 'Ahmeti', '+38345201044', null, AppointmentStatus::Confirmed],
            [9, '10:30', $arta, $combo, 'Vlera', 'Leka', '+38345201045', null, AppointmentStatus::Pending],
            [9, '14:00', $blerta, $mbushjeGell, 'Aulona', 'Hyseni', '+38345201046', null, AppointmentStatus::Confirmed],
            [9, '15:00', $leonora, $pedikyrGell, 'Tringa', 'Rama', '+38345201047', null, AppointmentStatus::Confirmed],
            [9, '16:00', $arta, $nailArt, 'Vesa', 'Kelmendi', '+38345201048', 'Ombre.', AppointmentStatus::Confirmed],

            [10, '10:00', $blerta, $combo, 'Sara', 'Krasniqi', '+38345201049', null, AppointmentStatus::Confirmed],
            [10, '10:00', $leonora, $mbjellje, 'Anjeza', 'Berisha', '+38345201050', null, AppointmentStatus::Confirmed],
            [10, '10:30', $arta, $pedikyrGell, 'Blerina', 'Gashi', '+38345201051', null, AppointmentStatus::Confirmed],
            [10, '14:00', $blerta, $manikyrGell, 'Donjeta', 'Hoxha', '+38345201052', null, AppointmentStatus::Pending],
            [10, '14:30', $leonora, $manikyrGell, 'Elira', 'Morina', '+38345201053', null, AppointmentStatus::Confirmed],
            [10, '15:00', $arta, $manikyrKlasik, 'Leona', 'Shala', '+38345201054', null, AppointmentStatus::Confirmed],

            [13, '09:00', $blerta, $manikyrGell, 'Merita', 'Rexha', '+38345201055', null, AppointmentStatus::Confirmed],
            [13, '09:30', $leonora, $mbushjeGell, 'Teuta', 'Ahmeti', '+38345201056', null, AppointmentStatus::Confirmed],
            [13, '10:00', $arta, $pedikyrKlasik, 'Yllka', 'Leka', '+38345201057', null, AppointmentStatus::Pending],
            [13, '14:00', $blerta, $mbjellje, 'Zana', 'Hyseni', '+38345201058', null, AppointmentStatus::Confirmed],
            [13, '14:00', $leonora, $combo, 'Era', 'Rama', '+38345201059', 'Mes tetori.', AppointmentStatus::Confirmed],
            [13, '16:00', $arta, $pedikyrGell, 'Fjolla', 'Kelmendi', '+38345201060', null, AppointmentStatus::Confirmed],

            [14, '09:00', $leonora, $manikyrGell, 'Gresa', 'Krasniqi', '+38345201061', null, AppointmentStatus::Confirmed],
            [14, '10:00', $blerta, $manikyrGell, 'Hana', 'Berisha', '+38345201062', null, AppointmentStatus::Pending],
            [14, '11:00', $arta, $pedikyrGell, 'Iliriana', 'Gashi', '+38345201063', null, AppointmentStatus::Confirmed],
            [14, '14:30', $blerta, $mbushjeGell, 'Jehona', 'Hoxha', '+38345201064', null, AppointmentStatus::Confirmed],
            [14, '15:00', $leonora, $mbjellje, 'Kaltrina', 'Morina', '+38345201065', null, AppointmentStatus::Confirmed],
            [14, '16:30', $arta, $manikyrGell, 'Lira', 'Shala', '+38345201066', null, AppointmentStatus::Cancelled],

            [15, '09:30', $arta, $pedikyrKlasik, 'Mimoza', 'Rexha', '+38345201067', null, AppointmentStatus::Confirmed],
            [15, '10:00', $blerta, $manikyrGell, 'Nora', 'Ahmeti', '+38345201068', null, AppointmentStatus::Confirmed],
            [15, '10:30', $leonora, $pedikyrGell, 'Olta', 'Leka', '+38345201069', null, AppointmentStatus::Pending],
            [15, '14:00', $blerta, $heqjaGellit, 'Pranvera', 'Hyseni', '+38345201070', null, AppointmentStatus::Confirmed],
            [15, '14:30', $leonora, $manikyrGell, 'Qendresa', 'Rama', '+38345201071', null, AppointmentStatus::Confirmed],
            [15, '15:30', $arta, $combo, 'Rina', 'Kelmendi', '+38345201072', null, AppointmentStatus::Confirmed],

            [16, '09:00', $blerta, $manikyrGell, 'Shpresa', 'Krasniqi', '+38345201073', null, AppointmentStatus::Confirmed],
            [16, '09:00', $leonora, $mbushjeGell, 'Teuta', 'Berisha', '+38345201074', null, AppointmentStatus::Confirmed],
            [16, '10:30', $arta, $pedikyrGell, 'Uesa', 'Gashi', '+38345201075', null, AppointmentStatus::Pending],
            [16, '14:00', $blerta, $mbjellje, 'Valmira', 'Hoxha', '+38345201076', null, AppointmentStatus::Confirmed],
            [16, '15:00', $leonora, $nailArt, 'Xheneta', 'Morina', '+38345201077', 'Lule.', AppointmentStatus::Confirmed],
            [16, '16:00', $arta, $manikyrKlasik, 'Yllka', 'Shala', '+38345201078', null, AppointmentStatus::Confirmed],

            [17, '10:00', $blerta, $combo, 'Zana', 'Rexha', '+38345201079', null, AppointmentStatus::Confirmed],
            [17, '10:00', $leonora, $manikyrGell, 'Albana', 'Ahmeti', '+38345201080', null, AppointmentStatus::Confirmed],
            [17, '10:30', $arta, $pedikyrGell, 'Besiana', 'Leka', '+38345201081', null, AppointmentStatus::Confirmed],
            [17, '14:00', $blerta, $mbushjeGell, 'Drita', 'Hyseni', '+38345201082', null, AppointmentStatus::Pending],
            [17, '14:30', $leonora, $mbjellje, 'Edona', 'Rama', '+38345201083', null, AppointmentStatus::Confirmed],
            [17, '15:00', $arta, $manikyrGell, 'Fjolla', 'Kelmendi', '+38345201084', null, AppointmentStatus::Confirmed],

            [20, '09:00', $blerta, $manikyrGell, 'Gentiana', 'Krasniqi', '+38345201085', null, AppointmentStatus::Confirmed],
            [20, '09:30', $leonora, $combo, 'Hasime', 'Berisha', '+38345201086', null, AppointmentStatus::Confirmed],
            [20, '10:00', $arta, $pedikyrKlasik, 'Igballe', 'Gashi', '+38345201087', null, AppointmentStatus::Pending],
            [20, '14:00', $blerta, $mbjellje, 'Jonida', 'Hoxha', '+38345201088', null, AppointmentStatus::Confirmed],
            [20, '14:00', $leonora, $manikyrGell, 'Kujtesa', 'Morina', '+38345201089', null, AppointmentStatus::Confirmed],
            [20, '16:00', $arta, $pedikyrGell, 'Luljeta', 'Shala', '+38345201090', null, AppointmentStatus::Confirmed],

            [21, '09:00', $leonora, $mbushjeGell, 'Marigona', 'Rexha', '+38345201091', null, AppointmentStatus::Confirmed],
            [21, '10:00', $blerta, $manikyrGell, 'Njomza', 'Ahmeti', '+38345201092', null, AppointmentStatus::Pending],
            [21, '11:00', $arta, $pedikyrGell, 'Ardiana', 'Leka', '+38345201093', null, AppointmentStatus::Confirmed],
            [21, '14:30', $blerta, $mbushjeGell, 'Besa', 'Hyseni', '+38345201094', null, AppointmentStatus::Confirmed],
            [21, '15:00', $leonora, $mbjellje, 'Donika', 'Rama', '+38345201095', null, AppointmentStatus::Confirmed],
            [21, '16:30', $arta, $manikyrGell, 'Emine', 'Kelmendi', '+38345201096', null, AppointmentStatus::Cancelled],

            [22, '09:30', $arta, $pedikyrKlasik, 'Fatmire', 'Krasniqi', '+38345201097', null, AppointmentStatus::Confirmed],
            [22, '10:00', $blerta, $manikyrGell, 'Garentina', 'Berisha', '+38345201098', null, AppointmentStatus::Confirmed],
            [22, '10:30', $leonora, $pedikyrGell, 'Hajrie', 'Gashi', '+38345201099', null, AppointmentStatus::Pending],
            [22, '14:00', $blerta, $heqjaGellit, 'Vlera', 'Hoxha', '+38345201100', null, AppointmentStatus::Confirmed],
            [22, '14:30', $leonora, $manikyrGell, 'Aulona', 'Morina', '+38345201101', null, AppointmentStatus::Confirmed],
            [22, '15:30', $arta, $combo, 'Tringa', 'Shala', '+38345201102', null, AppointmentStatus::Confirmed],

            [23, '09:00', $blerta, $manikyrGell, 'Vesa', 'Rexha', '+38345201103', null, AppointmentStatus::Confirmed],
            [23, '09:00', $leonora, $mbushjeGell, 'Sara', 'Ahmeti', '+38345201104', null, AppointmentStatus::Confirmed],
            [23, '10:30', $arta, $pedikyrGell, 'Anjeza', 'Leka', '+38345201105', null, AppointmentStatus::Pending],
            [23, '14:00', $blerta, $mbjellje, 'Blerina', 'Hyseni', '+38345201106', null, AppointmentStatus::Confirmed],
            [23, '15:00', $leonora, $nailArt, 'Donjeta', 'Rama', '+38345201107', 'French tip.', AppointmentStatus::Confirmed],
            [23, '16:00', $arta, $manikyrKlasik, 'Elira', 'Kelmendi', '+38345201108', null, AppointmentStatus::Confirmed],

            [24, '10:00', $blerta, $combo, 'Leona', 'Krasniqi', '+38345201109', null, AppointmentStatus::Confirmed],
            [24, '10:00', $leonora, $manikyrGell, 'Merita', 'Berisha', '+38345201110', null, AppointmentStatus::Confirmed],
            [24, '10:30', $arta, $pedikyrGell, 'Teuta', 'Gashi', '+38345201111', null, AppointmentStatus::Confirmed],
            [24, '14:00', $blerta, $mbushjeGell, 'Yllka', 'Hoxha', '+38345201112', null, AppointmentStatus::Pending],
            [24, '14:30', $leonora, $mbjellje, 'Zana', 'Morina', '+38345201113', 'Fund muaji.', AppointmentStatus::Confirmed],
            [24, '15:00', $arta, $manikyrGell, 'Era', 'Shala', '+38345201114', null, AppointmentStatus::Confirmed],

            [27, '09:00', $blerta, $manikyrGell, 'Fjolla', 'Rexha', '+38345201115', null, AppointmentStatus::Confirmed],
            [27, '09:30', $leonora, $combo, 'Gresa', 'Ahmeti', '+38345201116', null, AppointmentStatus::Confirmed],
            [27, '10:00', $arta, $pedikyrKlasik, 'Hana', 'Leka', '+38345201117', null, AppointmentStatus::Pending],
            [27, '14:00', $blerta, $mbjellje, 'Iliriana', 'Hyseni', '+38345201118', null, AppointmentStatus::Confirmed],
            [27, '14:00', $leonora, $manikyrGell, 'Jehona', 'Rama', '+38345201119', null, AppointmentStatus::Confirmed],
            [27, '16:00', $arta, $pedikyrGell, 'Kaltrina', 'Kelmendi', '+38345201120', null, AppointmentStatus::Confirmed],

            [28, '09:00', $leonora, $mbushjeGell, 'Lira', 'Krasniqi', '+38345201121', null, AppointmentStatus::Confirmed],
            [28, '10:00', $blerta, $manikyrGell, 'Mimoza', 'Berisha', '+38345201122', null, AppointmentStatus::Pending],
            [28, '11:00', $arta, $pedikyrGell, 'Nora', 'Gashi', '+38345201123', null, AppointmentStatus::Confirmed],
            [28, '14:30', $blerta, $mbushjeGell, 'Olta', 'Hoxha', '+38345201124', null, AppointmentStatus::Confirmed],
            [28, '15:00', $leonora, $mbjellje, 'Pranvera', 'Morina', '+38345201125', null, AppointmentStatus::Confirmed],
            [28, '16:30', $arta, $manikyrGell, 'Qendresa', 'Shala', '+38345201126', null, AppointmentStatus::Cancelled],

            [29, '09:30', $arta, $pedikyrKlasik, 'Rina', 'Rexha', '+38345201127', null, AppointmentStatus::Confirmed],
            [29, '10:00', $blerta, $manikyrGell, 'Shpresa', 'Ahmeti', '+38345201128', null, AppointmentStatus::Confirmed],
            [29, '10:30', $leonora, $pedikyrGell, 'Teuta', 'Leka', '+38345201129', null, AppointmentStatus::Pending],
            [29, '14:00', $blerta, $heqjaGellit, 'Uesa', 'Hyseni', '+38345201130', null, AppointmentStatus::Confirmed],
            [29, '14:30', $leonora, $manikyrGell, 'Valmira', 'Rama', '+38345201131', null, AppointmentStatus::Confirmed],
            [29, '15:30', $arta, $combo, 'Xheneta', 'Kelmendi', '+38345201132', null, AppointmentStatus::Confirmed],

            [30, '09:00', $blerta, $manikyrGell, 'Yllka', 'Krasniqi', '+38345201133', null, AppointmentStatus::Confirmed],
            [30, '09:00', $leonora, $mbushjeGell, 'Zana', 'Berisha', '+38345201134', null, AppointmentStatus::Confirmed],
            [30, '10:30', $arta, $pedikyrGell, 'Albana', 'Gashi', '+38345201135', null, AppointmentStatus::Pending],
            [30, '14:00', $blerta, $mbjellje, 'Besiana', 'Hoxha', '+38345201136', null, AppointmentStatus::Confirmed],
            [30, '15:00', $leonora, $nailArt, 'Drita', 'Morina', '+38345201137', 'Halloween nails.', AppointmentStatus::Confirmed],
            [30, '16:00', $arta, $manikyrKlasik, 'Edona', 'Shala', '+38345201138', null, AppointmentStatus::Confirmed],

            [31, '10:00', $blerta, $combo, 'Fjolla', 'Rexha', '+38345201139', 'Fundi i tetorit.', AppointmentStatus::Confirmed],
            [31, '10:00', $leonora, $manikyrGell, 'Gentiana', 'Ahmeti', '+38345201140', null, AppointmentStatus::Confirmed],
            [31, '10:30', $arta, $pedikyrGell, 'Hasime', 'Leka', '+38345201141', null, AppointmentStatus::Confirmed],
            [31, '14:00', $blerta, $mbushjeGell, 'Igballe', 'Hyseni', '+38345201142', null, AppointmentStatus::Pending],
            [31, '14:30', $leonora, $mbjellje, 'Jonida', 'Rama', '+38345201143', null, AppointmentStatus::Confirmed],
            [31, '15:00', $arta, $manikyrGell, 'Kujtesa', 'Kelmendi', '+38345201144', null, AppointmentStatus::Confirmed],
        ];

        foreach ($rows as $row) {
            [$day, $start, $employee, $service, $first, $last, $phone, $notes, $status] = $row;

            $date = Carbon::create(2026, 10, $day, 0, 0, 0, $tz);
            if ($date->isSunday()) {
                continue;
            }

            if ($date->isSaturday() && strcmp($start, '10:00') < 0) {
                $start = '10:00';
            }

            $end = Carbon::parse($date->toDateString().' '.$start, $tz)
                ->addMinutes($service->duration)
                ->format('H:i');

            Appointment::create([
                'business_id' => $business->id,
                'employee_id' => $employee->id,
                'employee_name' => $employee->name,
                'service_id' => $service->id,
                'service_name' => $service->name,
                'client_first_name' => $first,
                'client_last_name' => $last,
                'client_phone' => $phone,
                'client_notes' => $notes,
                'date' => $date->toDateString(),
                'start_time' => $start,
                'end_time' => $end,
                'price' => $service->price,
                'status' => $status,
            ]);
        }
    }
}
