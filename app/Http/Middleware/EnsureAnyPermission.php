<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Passes when the user holds at least one of the listed permissions. Used where a
 * screen hosts sections owned by different permissions — the page opens, and each
 * section is rendered (and saved) under its own gate.
 */
class EnsureAnyPermission
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        foreach ($permissions as $permission) {
            if ($user && $user->hasPermission($permission)) {
                return $next($request);
            }
        }

        abort(403);
    }
}
