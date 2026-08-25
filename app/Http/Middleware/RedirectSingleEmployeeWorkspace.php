<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RedirectSingleEmployeeWorkspace
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            return $next($request);
        }

        $business = $user->isAdmin() ? $user->ownedBusiness : $user->business;
        if (! $business?->single_employee_mode) {
            return $next($request);
        }

        if ($request->routeIs('admin.roles*')) {
            return redirect()->route('admin.settings.index');
        }

        if ($request->routeIs('employee.schedule*') || $request->routeIs('employee.notifications*')) {
            return $next($request);
        }

        if ($request->routeIs('employee.dashboard')) {
            return redirect()->route('admin.dashboard');
        }

        if ($request->routeIs('employee.appointments.calendar')) {
            return redirect()->route('admin.appointments.calendar');
        }

        if ($request->routeIs('employee.appointments.create')) {
            return redirect()->route('admin.appointments.create', $request->query());
        }

        if ($request->routeIs('employee.appointments.*')) {
            return redirect()->route('admin.appointments.index');
        }

        if ($request->routeIs('employee.analytics.*')) {
            return redirect()->route('admin.analytics.index');
        }

        return $next($request);
    }
}
