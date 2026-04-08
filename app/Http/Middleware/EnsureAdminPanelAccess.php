<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminPanelAccess
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        abort_unless($user && ($user->isAdmin() || $user->isEmployee()), 403);

        abort_unless($user->hasAdminPanelAccess(), 403);

        return $next($request);
    }
}
