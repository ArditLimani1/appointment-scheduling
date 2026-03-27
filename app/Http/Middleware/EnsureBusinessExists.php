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

            return redirect()->route('admin.settings.index')
                ->with('info', 'Please complete your business setup before continuing.');
        }

        return $next($request);
    }
}
