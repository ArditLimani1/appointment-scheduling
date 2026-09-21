<?php

namespace Database\Seeders;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\Schedule;
use App\Models\ScheduleBreak;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Demo barbershop for sales presentations. Safe to run in production:
 *   php artisan db:seed --class=DemoBarbershopSeeder --force
 *
 * Model events are disabled so no reminder_at is computed and no notifications
 * fire; reminders are also off on the business, so no WhatsApp goes out to the
 * fictional client numbers.
 */
class DemoBarbershopSeeder extends Seeder
{
    use WithoutModelEvents;

    private const SLUG = 'berber-beni';

    private const TIMEZONE = 'Europe/Belgrade';

    private const FROM = '2026-09-01';

    private const TO = '2026-10-31';

    public function run(): void
    {
        if (Business::query()->where('slug', self::SLUG)->exists()) {
            $this->command?->warn('Demo barbershop "'.self::SLUG.'" already exists — skipping.');

            return;
        }

        mt_srand(20260901);

        $password = 'password';

        DB::transaction(function () use ($password) {
            $owner = $this->createUser('Arben Krasniqi', 'arben@berberbeni.com', '+38344218730', 'Pronar & berber', 'arben', $password, UserRole::Admin);
            $owner->forceFill(['also_works_as_staff' => true])->save();

            $business = Business::create([
                'owner_id' => $owner->id,
                'business_type_id' => BusinessType::query()->where('name', 'Barbershop')->value('id'),
                'name' => 'Berber Beni',
                'slug' => self::SLUG,
                'phone' => '+38344218730',
                'email' => 'info@berberbeni.com',
                'description' => 'Prerje klasike dhe moderne, fade dhe rregullim mjekre. Që nga viti 2014 në zemër të Prishtinës.',
                'location' => 'Rruga Garibaldi 14, Prishtinë, Kosovë',
                'timezone' => self::TIMEZONE,
                'currency' => 'EUR',
                'currency_symbol' => '€',
                'slot_duration' => 15,
                'min_booking_notice' => 60,
                'max_booking_window' => 45,
                'is_active' => true,
                'client_identifier_type' => 'phone',
                'allow_employee_service_edit' => false,
                'uses_shared_resources' => false,
                'auto_confirm_appointments' => true,
                'single_employee_mode' => false,
                'reminders_enabled' => false,
            ]);

            $owner->forceFill(['business_id' => $business->id])->save();

            $driton = $this->createUser('Driton Gashi', 'driton@berberbeni.com', '+38345671204', 'Berber', 'driton', $password, UserRole::Employee, $business);
            $leutrim = $this->createUser('Leutrim Berisha', 'leutrim@berberbeni.com', '+38349305518', 'Berber', 'leutrim', $password, UserRole::Employee, $business);

            $services = [
                'cut' => Service::create([
                    'business_id' => $business->id,
                    'name' => 'Prerje flokësh',
                    'description' => 'Prerje me makinë dhe gërshërë, larje dhe stilim.',
                    'duration' => 30,
                    'price' => 7.00,
                    'is_active' => true,
                    'is_popular' => true,
                    'sort_order' => 1,
                ]),
                'combo' => Service::create([
                    'business_id' => $business->id,
                    'name' => 'Prerje + mjekër',
                    'description' => 'Prerje flokësh dhe rregullim i plotë i mjekrës me peshqir të nxehtë.',
                    'duration' => 45,
                    'price' => 10.00,
                    'is_active' => true,
                    'is_popular' => true,
                    'sort_order' => 2,
                ]),
                'beard' => Service::create([
                    'business_id' => $business->id,
                    'name' => 'Rregullim mjekre',
                    'description' => 'Formësim, konturë me brisk dhe vaj për mjekër.',
                    'duration' => 15,
                    'price' => 4.00,
                    'is_active' => true,
                    'is_popular' => false,
                    'sort_order' => 3,
                ]),
            ];

            $staff = [$owner, $driton, $leutrim];
            foreach ($staff as $member) {
                $member->services()->attach(array_map(fn (Service $s) => $s->id, $services));
                $this->createSchedule($member);
            }

            $this->seedAppointments($business, $staff, $services);
        });

        $this->command?->info('Demo barbershop created: /'.self::SLUG);
        $this->command?->info('Logins (password: password): arben@berberbeni.com (owner), driton@berberbeni.com, leutrim@berberbeni.com');
    }

    private function createUser(string $name, string $email, string $phone, string $title, string $slug, string $password, UserRole $role, ?Business $business = null): User
    {
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'phone' => $phone,
            'title' => $title,
            'booking_slug' => $slug,
            'locale' => 'sq',
        ]);

        $user->forceFill([
            'role' => $role,
            'is_active' => true,
            'business_id' => $business?->id,
            'email_verified_at' => now(),
            'onboarding_completed_at' => now(),
        ])->save();

        return $user;
    }

    /**
     * Mon–Fri 09:00–19:00 (pause 13:00–13:30), Sat 09:00–16:00, Sunday closed.
     */
    private function createSchedule(User $user): void
    {
        for ($day = 0; $day <= 6; $day++) {
            $schedule = Schedule::create([
                'user_id' => $user->id,
                'day_of_week' => $day,
                'start_time' => '09:00',
                'end_time' => $day === 5 ? '16:00' : '19:00',
                'is_active' => $day !== 6,
            ]);

            if ($day <= 4) {
                ScheduleBreak::create([
                    'schedule_id' => $schedule->id,
                    'start_time' => '13:00',
                    'end_time' => '13:30',
                ]);
            }
        }
    }

    /**
     * @param  list<User>  $staff
     * @param  array<string, Service>  $services
     */
    private function seedAppointments(Business $business, array $staff, array $services): void
    {
        $clients = $this->clientPool();
        $today = Carbon::now(self::TIMEZONE)->startOfDay();
        $now = Carbon::now(self::TIMEZONE);
        $notes = [
            'Fade i ulët anash.', 'Vetëm me gërshërë.', 'Mjekra pak më e shkurtër.', 'Si herën e kaluar.',
            'Vjen me djalin.', 'Mos e shkurto shumë lart.', 'Klient i rregullt.', 'Mund të vonohet 5 min.',
            'Skin fade.', 'Vija anash.',
        ];

        for ($date = Carbon::parse(self::FROM, self::TIMEZONE); $date->lte(Carbon::parse(self::TO, self::TIMEZONE)); $date->addDay()) {
            if ($date->isSunday()) {
                continue;
            }

            $isSaturday = $date->isSaturday();
            $daysAhead = (int) $today->diffInDays($date, false);
            $clientsToday = [];

            foreach ($staff as $index => $employee) {
                // The owner takes slightly fewer clients; Saturdays are busiest.
                [$min, $max] = $isSaturday ? [7, 10] : [4, 8];
                if ($index === 0) {
                    $max--;
                }
                $target = mt_rand($min, $max);

                // Far-future days are only partially booked yet.
                if ($daysAhead > 14) {
                    $target = (int) round($target * mt_rand(35, 60) / 100);
                } elseif ($daysAhead > 5) {
                    $target = (int) round($target * mt_rand(60, 85) / 100);
                }

                $dayEnd = $isSaturday ? 16 * 60 : 19 * 60;
                $busy = $isSaturday ? [] : [[13 * 60, 13 * 60 + 30]];

                $candidates = range(9 * 60, $dayEnd - 15, 15);
                $this->shuffle($candidates);

                $placed = 0;
                foreach ($candidates as $start) {
                    if ($placed >= $target) {
                        break;
                    }

                    $service = $this->pickService($services);
                    $end = $start + $service->duration;

                    if ($end > $dayEnd || $this->overlaps($busy, $start, $end)) {
                        continue;
                    }

                    $busy[] = [$start, $end];
                    $placed++;

                    do {
                        $clientIndex = mt_rand(0, count($clients) - 1);
                    } while (isset($clientsToday[$clientIndex]));
                    $clientsToday[$clientIndex] = true;
                    $client = $clients[$clientIndex];
                    $startsAt = $date->copy()->setTime(intdiv($start, 60), $start % 60);
                    $status = $this->pickStatus($daysAhead);
                    $createdAt = $startsAt->copy()->subDays(mt_rand(0, 6))->subHours(mt_rand(1, 10));
                    if ($createdAt->gt($now)) {
                        $createdAt = $now->copy()->subHours(mt_rand(1, 48));
                    }

                    $appointment = new Appointment;
                    $appointment->forceFill([
                        'booking_reference' => Str::uuid()->toString(),
                        'business_id' => $business->id,
                        'employee_id' => $employee->id,
                        'employee_name' => $employee->name,
                        'service_id' => $service->id,
                        'service_name' => $service->name,
                        'client_first_name' => $client[0],
                        'client_last_name' => $client[1],
                        'client_phone' => $client[2],
                        'client_notes' => mt_rand(1, 100) <= 12 ? $notes[mt_rand(0, count($notes) - 1)] : null,
                        'date' => $date->format('Y-m-d'),
                        'start_time' => sprintf('%02d:%02d', intdiv($start, 60), $start % 60),
                        'end_time' => sprintf('%02d:%02d', intdiv($end, 60), $end % 60),
                        'price' => $service->price,
                        'status' => $status,
                        'created_at' => $createdAt->utc(),
                        'updated_at' => $status === AppointmentStatus::Cancelled
                            ? $createdAt->copy()->addHours(mt_rand(2, 30))->min($now)->utc()
                            : $createdAt->utc(),
                    ])->save();
                }
            }
        }
    }

    /**
     * @param  array<string, Service>  $services
     */
    private function pickService(array $services): Service
    {
        $roll = mt_rand(1, 100);

        return match (true) {
            $roll <= 55 => $services['cut'],
            $roll <= 85 => $services['combo'],
            default => $services['beard'],
        };
    }

    private function pickStatus(int $daysAhead): AppointmentStatus
    {
        $roll = mt_rand(1, 100);

        if ($daysAhead < 0) {
            return $roll <= 92 ? AppointmentStatus::Confirmed : AppointmentStatus::Cancelled;
        }

        if ($daysAhead <= 3) {
            return match (true) {
                $roll <= 80 => AppointmentStatus::Confirmed,
                $roll <= 93 => AppointmentStatus::Pending,
                default => AppointmentStatus::Cancelled,
            };
        }

        return match (true) {
            $roll <= 65 => AppointmentStatus::Confirmed,
            $roll <= 95 => AppointmentStatus::Pending,
            default => AppointmentStatus::Cancelled,
        };
    }

    /**
     * @param  list<array{int, int}>  $busy
     */
    private function overlaps(array $busy, int $start, int $end): bool
    {
        foreach ($busy as [$bStart, $bEnd]) {
            if ($start < $bEnd && $end > $bStart) {
                return true;
            }
        }

        return false;
    }

    /**
     * Deterministic Fisher–Yates on the seeded mt_rand.
     */
    private function shuffle(array &$items): void
    {
        for ($i = count($items) - 1; $i > 0; $i--) {
            $j = mt_rand(0, $i);
            [$items[$i], $items[$j]] = [$items[$j], $items[$i]];
        }
    }

    /**
     * ~140 recurring clients, each with a stable Kosovo mobile number.
     *
     * @return list<array{string, string, string}>
     */
    private function clientPool(): array
    {
        $firstNames = [
            'Agon', 'Albion', 'Alban', 'Altin', 'Ardit', 'Ardian', 'Arian', 'Armend', 'Arton', 'Avni',
            'Bekim', 'Besart', 'Besim', 'Besnik', 'Blerim', 'Bujar', 'Burim', 'Dardan', 'Dafin', 'Diar',
            'Donat', 'Drilon', 'Egzon', 'Elion', 'Elvis', 'Endrit', 'Enis', 'Erion', 'Eron', 'Fatos',
            'Fisnik', 'Florent', 'Flamur', 'Gazmend', 'Genc', 'Gent', 'Granit', 'Hamdi', 'Ilir', 'Jetmir',
            'Jeton', 'Kastriot', 'Kushtrim', 'Labinot', 'Liridon', 'Lorik', 'Lulzim', 'Mentor', 'Mirlind', 'Njazi',
            'Nol', 'Orhan', 'Petrit', 'Qëndrim', 'Rilind', 'Rinor', 'Rron', 'Shpend', 'Shkëlzen', 'Taulant',
            'Toni', 'Trim', 'Uran', 'Valon', 'Valdrin', 'Vigan', 'Visar', 'Ylber', 'Yll', 'Zgjim',
        ];

        $lastNames = [
            'Ahmeti', 'Aliu', 'Bajrami', 'Berisha', 'Bytyqi', 'Dema', 'Dervishi', 'Gashi', 'Gjinolli', 'Haliti',
            'Hasani', 'Hoti', 'Hoxha', 'Hyseni', 'Isufi', 'Jashari', 'Kastrati', 'Kelmendi', 'Krasniqi', 'Kryeziu',
            'Kurti', 'Limani', 'Maliqi', 'Mehmeti', 'Morina', 'Musliu', 'Osmani', 'Qerimi', 'Rama', 'Rexhepi',
            'Sahiti', 'Salihu', 'Shala', 'Shabani', 'Sylejmani', 'Thaçi', 'Zeqiri', 'Zymberi',
        ];

        $prefixes = ['44', '44', '44', '45', '45', '49', '49', '43', '48'];

        $pool = [];
        $usedPhones = [];
        while (count($pool) < 140) {
            $phone = '+383'.$prefixes[mt_rand(0, count($prefixes) - 1)].mt_rand(100000, 999999);
            if (isset($usedPhones[$phone])) {
                continue;
            }
            $usedPhones[$phone] = true;

            $pool[] = [
                $firstNames[mt_rand(0, count($firstNames) - 1)],
                $lastNames[mt_rand(0, count($lastNames) - 1)],
                $phone,
            ];
        }

        return $pool;
    }
}
