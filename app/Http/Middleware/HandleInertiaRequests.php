<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
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

        return [
            ...parent::share($request),
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
