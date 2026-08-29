<?php

use App\Http\Middleware\DisableHtmlCachingInLocal;
use App\Http\Middleware\EnsureAdminPanelAccess;
use App\Http\Middleware\EnsureAnyPermission;
use App\Http\Middleware\EnsureBusinessExists;
use App\Http\Middleware\EnsureBusinessUsesSharedResources;
use App\Http\Middleware\EnsureEmployeeOrAdmin;
use App\Http\Middleware\EnsureOnboardingCompleted;
use App\Http\Middleware\EnsurePermission;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Middleware\SetLocale;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            SetLocale::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            DisableHtmlCachingInLocal::class,
        ]);

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'has_business' => EnsureBusinessExists::class,
            'admin_panel' => EnsureAdminPanelAccess::class,
            'employee_area' => EnsureEmployeeOrAdmin::class,
            'permission' => EnsurePermission::class,
            'permission_any' => EnsureAnyPermission::class,
            'super_admin' => EnsureSuperAdmin::class,
            'business_uses_shared_resources' => EnsureBusinessUsesSharedResources::class,
            'onboarding_completed' => EnsureOnboardingCompleted::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
