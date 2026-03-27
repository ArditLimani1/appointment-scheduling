<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        if (! $user) {
            abort(403, 'Unauthorized.');
        }
        $current = $user->role instanceof \BackedEnum ? $user->role->value : (string) $user->role;
        if (! in_array($current, $roles, true)) {
            abort(403, 'Unauthorized.');
        }

        return $next($request);
    }
}
