<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Models\UserAppointmentViewPreference;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();
        $business = null;

        if ($user) {
            $business = $user->isAdmin()
                ? $user->ownedBusiness
                : $user->business;
        }

        $supported = config('locales.supported', []);
        $locale = App::getLocale();
        $localeMeta = $supported[$locale] ?? ['bcp47' => 'sq-AL', 'native' => $locale];

        return [
            ...parent::share($request),
            'locale' => $locale,
            'localeBcp47' => $localeMeta['bcp47'] ?? 'sq-AL',
            'availableLocales' => collect($supported)->map(fn (array $meta, string $code) => [
                'code' => $code,
                'native' => $meta['native'] ?? $code,
            ])->values()->all(),
            'translations' => static fn () => [
                'layout' => trans('layout'),
                'admin' => trans('admin'),
                'employee' => trans('employee'),
                'auth_pages' => trans('auth_pages'),
                'booking_ui' => trans('booking_ui'),
                'common' => trans('common'),
                'profile' => trans('profile'),
                'components' => trans('components'),
                'onboarding' => trans('onboarding'),
                'welcome' => trans('welcome'),
            ],
            'auth' => [
                'user' => $user,
                'business' => $business,
                'permissions' => $user ? $user->effectivePermissionKeys() : [],
                'impersonating' => Session::has('impersonator_id'),
            ],
            'employeeNotifications' => $this->shouldShareEmployeeNotifications($user, $request)
                ? static function () use ($user) {
                    return [
                        'unread_count' => $user->unreadNotifications()->count(),
                        'recent' => $user->unreadNotifications()->latest()->limit(12)->get()->map(static function ($n) {
                            return [
                                'id' => $n->id,
                                'read_at' => $n->read_at?->toIso8601String(),
                                'data' => $n->data,
                                'created_at' => $n->created_at->toIso8601String(),
                            ];
                        })->all(),
                    ];
                }
                : null,
            'employeeAppointmentUi' => $this->shouldShareEmployeeNotifications($user, $request)
                ? static function () use ($user) {
                    $pref = UserAppointmentViewPreference::query()
                        ->where('user_id', $user->id)
                        ->first();

                    return [
                        'default_calendar' => (bool) ($pref?->is_calendar_default ?? false),
                    ];
                }
                : null,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'info' => fn () => $request->session()->get('info'),
                'nonce' => fn () => $request->session()->get('flash_nonce'),
            ],
            'features' => [
                'whatsapp' => (bool) config('features.whatsapp', false),
            ],
        ];
    }

    /**
     * Staff appointment notifications: employee routes always; admin routes when the user can be
     * assigned as bookable staff (employee role or owner/staff “also works as staff”).
     */
    private function shouldShareEmployeeNotifications(?User $user, Request $request): bool
    {
        if (! $user) {
            return false;
        }

        if ($request->routeIs('employee.*')) {
            return true;
        }

        if ($request->routeIs('admin.*') && ($user->also_works_as_staff || $user->isEmployee())) {
            return true;
        }

        return false;
    }
}
