<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureBusinessExists
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->isAdmin() && ! $user->ownedBusiness) {
            if ($request->routeIs('admin.settings.*')) {
                return $next($request);
            }

            if ($request->expectsJson()) {
                abort(response()->json([
                    'message' => __('messages.business.setup_required'),
                    'code' => 'business_setup_required',
                ], 409));
            }

            return redirect()->route('admin.settings.index')
                ->with('info', __('messages.business.setup_required'));
        }

        return $next($request);
    }
}
