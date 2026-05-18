<?php

namespace App\Http\Controllers\Auth\Concerns;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

trait RedirectsAfterAuthentication
{
    protected function redirectAfterLogin(Request $request, User $user, string $default): RedirectResponse
    {
        $intended = $request->session()->pull('url.intended');

        if (is_string($intended) && $this->userCanAccessUrl($user, $intended)) {
            return redirect()->to($intended);
        }

        return redirect()->to($default);
    }

    protected function userCanAccessUrl(User $user, string $url): bool
    {
        $path = parse_url($url, PHP_URL_PATH) ?? '';

        if ($path === '' || in_array($path, ['/login', '/register'], true)) {
            return false;
        }

        if (str_starts_with($path, '/super-admin')) {
            return $user->isSuperAdmin();
        }

        if (str_starts_with($path, '/admin')) {
            return $user->hasAdminPanelAccess();
        }

        if (str_starts_with($path, '/employee') || str_starts_with($path, '/onboarding')) {
            return $user->isAdmin() || $user->isEmployee();
        }

        return true;
    }
}
