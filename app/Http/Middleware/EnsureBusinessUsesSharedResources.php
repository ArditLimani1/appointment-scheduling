<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureBusinessUsesSharedResources
{
    public function handle(Request $request, Closure $next): Response
    {
        $business = $request->user()?->panelBusiness();

        if ($business && ! $business->uses_shared_resources) {
            abort(403);
        }

        return $next($request);
    }
}
