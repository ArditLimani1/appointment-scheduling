<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Business;
use App\Models\User;
use App\Services\Interfaces\BusinessServiceInterface;
use App\Services\Interfaces\ScheduleServiceInterface;
use App\Support\ClientIdentification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function __construct(
        private BusinessServiceInterface $businessService,
        private ScheduleServiceInterface $scheduleService,
    ) {}

    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if (! $user->requiresOnboarding()) {
            return redirect()->route('dashboard');
        }

        if ($user->isAdmin()) {
            return $this->renderAdmin($user);
        }

        return $this->renderEmployee($user);
    }

    public function updateBusinessSettings(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user && $user->isAdmin(), 403);

        $validated = $request->validate([
            'slot_duration' => ['required', 'integer', 'min:5', 'max:240'],
            'min_booking_notice' => ['required', 'integer', 'min:0', 'max:43200'],
            'max_booking_window' => ['required', 'integer', 'min:1', 'max:365'],
            'client_identifier_type' => ClientIdentification::storedTypeRules(),
            'allow_employee_service_edit' => ['required', 'boolean'],
            'uses_shared_resources' => ['required', 'boolean'],
            'owner_also_works_as_staff' => ['required', 'boolean'],
            'auto_confirm_appointments' => ['required', 'boolean'],
            'reminders_enabled' => ['required', 'boolean'],
            'reminder_time' => ['required_if:reminders_enabled,true', 'nullable', 'date_format:H:i'],
        ]);

        $ownerStaff = (bool) $validated['owner_also_works_as_staff'];
        unset($validated['owner_also_works_as_staff']);

        $business = $this->businessService->updateSettings($user, $validated);

        if ((int) $business->owner_id === (int) $user->id) {
            $user->syncAlsoWorksAsStaff($business, $ownerStaff);
        }

        return redirect()
            ->route('onboarding.show')
            ->with('flash_nonce', uniqid('', true));
    }

    public function updateBookingSlug(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user && $user->isEmployee(), 403);

        $slug = strtolower(trim((string) $request->input('booking_slug', '')));
        $request->merge(['booking_slug' => $slug]);

        $validated = $request->validate([
            'booking_slug' => [
                'required',
                'string',
                'max:100',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                function (string $attribute, mixed $value, \Closure $fail) use ($user) {
                    if (! $user->business_id) {
                        return;
                    }
                    if ($this->bookingSlugTakenByOtherStaff((int) $user->business_id, (int) $user->id, (string) $value)) {
                        $fail(__('errors.schedule.booking_slug_taken'));
                    }
                },
            ],
        ]);

        $user->update(['booking_slug' => $validated['booking_slug']]);

        return redirect()
            ->route('onboarding.show')
            ->with('flash_nonce', uniqid('', true));
    }

    public function updateSchedule(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user && $user->isEmployee(), 403);

        $validated = $request->validate([
            'schedules' => ['required', 'array', 'size:7'],
            'schedules.*.day_of_week' => ['required', 'integer', 'between:0,6'],
            'schedules.*.is_active' => ['required', 'boolean'],
            'schedules.*.start_time' => ['required_if:schedules.*.is_active,true', 'nullable', 'date_format:H:i'],
            'schedules.*.end_time' => ['required_if:schedules.*.is_active,true', 'nullable', 'date_format:H:i'],
            'schedules.*.breaks' => ['array'],
            'schedules.*.breaks.*.start_time' => ['required', 'date_format:H:i'],
            'schedules.*.breaks.*.end_time' => ['required', 'date_format:H:i'],
        ]);

        $this->scheduleService->updateSchedules($user, $validated);

        return redirect()
            ->route('onboarding.show')
            ->with('flash_nonce', uniqid('', true));
    }

    public function complete(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user && ($user->isAdmin() || $user->isEmployee()), 403);

        if (! $user->hasCompletedOnboarding()) {
            $user->forceFill(['onboarding_completed_at' => now()])->save();
        }

        return redirect()->route('dashboard')
            ->with('success', __('messages.onboarding.completed'))
            ->with('flash_nonce', uniqid('', true));
    }

    private function renderAdmin(User $user): Response
    {
        $business = $user->ownedBusiness ?? new Business([
            'slot_duration' => 30,
            'min_booking_notice' => 120,
            'max_booking_window' => 30,
            'client_identifier_type' => ClientIdentification::resolve(null),
            'allow_employee_service_edit' => true,
            'uses_shared_resources' => false,
            'auto_confirm_appointments' => false,
            'reminders_enabled' => false,
            'reminder_time' => '08:00',
        ]);

        return Inertia::render('Onboarding/Admin', [
            'settings' => [
                'slot_duration' => (int) ($business->slot_duration ?? 30),
                'min_booking_notice' => (int) ($business->min_booking_notice ?? 120),
                'max_booking_window' => (int) ($business->max_booking_window ?? 30),
                'client_identifier_type' => ClientIdentification::resolve($business->client_identifier_type),
                'allow_employee_service_edit' => (bool) ($business->allow_employee_service_edit ?? true),
                'uses_shared_resources' => false,
                'owner_also_works_as_staff' => false,
                'auto_confirm_appointments' => (bool) ($business->auto_confirm_appointments ?? false),
                'reminders_enabled' => (bool) ($business->reminders_enabled ?? false),
                'reminder_time' => $business->reminder_time ?: '08:00',
            ],
        ]);
    }

    private function renderEmployee(User $user): Response
    {
        $business = $user->business;
        $employeeSlug = $user->booking_slug ?: Str::slug($user->name);
        $schedules = $this->scheduleService->getSchedules($user);

        return Inertia::render('Onboarding/Employee', [
            'business_name' => $business?->name,
            'business_slug' => $business?->slug,
            'employee_email' => $user->email,
            'booking_slug' => $employeeSlug,
            'business_booking_url' => $business ? "/book/{$business->slug}" : null,
            'schedules' => $schedules->map(fn ($s) => [
                'day_of_week' => (int) $s->day_of_week,
                'is_active' => (bool) $s->is_active,
                'start_time' => substr((string) $s->start_time, 0, 5),
                'end_time' => substr((string) $s->end_time, 0, 5),
                'breaks' => $s->breaks->map(fn ($b) => [
                    'start_time' => substr((string) $b->start_time, 0, 5),
                    'end_time' => substr((string) $b->end_time, 0, 5),
                ])->values()->all(),
            ])->values()->all(),
        ]);
    }

    private function bookingSlugTakenByOtherStaff(int $businessId, int $excludeUserId, string $slug): bool
    {
        $others = User::query()
            ->where('business_id', $businessId)
            ->where('id', '!=', $excludeUserId)
            ->where('is_active', true)
            ->where(function ($q) {
                $q->where('role', UserRole::Employee)
                    ->orWhere(function ($q2) {
                        $q2->where('role', UserRole::Admin)
                            ->where('also_works_as_staff', true);
                    });
            })
            ->get(['id', 'name', 'booking_slug']);

        return $others->contains(function (User $other) use ($slug) {
            $effective = $other->booking_slug ?: Str::slug($other->name);

            return $effective === $slug;
        });
    }
}
