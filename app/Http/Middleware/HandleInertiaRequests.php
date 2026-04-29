<?php

namespace App\Http\Middleware;

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
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'info' => fn () => $request->session()->get('info'),
                'nonce' => fn () => $request->session()->get('flash_nonce'),
            ],
        ];
    }
}
