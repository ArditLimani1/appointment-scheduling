<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOnboardingCompleted
{
    /**
     * Bounce admins/employees back to the onboarding wizard until they finish it,
     * unless they're already on an onboarding route.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->requiresOnboarding()) {
            return $next($request);
        }

        if ($request->routeIs('onboarding.*') || $request->routeIs('logout')) {
            return $next($request);
        }

        if ($request->expectsJson()) {
            abort(response()->json([
                'message' => __('request_messages.auth.onboarding_required'),
                'code' => 'onboarding_required',
            ], 409));
        }

        return redirect()->route('onboarding.show');
    }
}
