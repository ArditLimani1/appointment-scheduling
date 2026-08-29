<?php

use App\Http\Controllers\Api\V1;
use App\Http\Controllers\Employee as EmployeeWeb;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API v1 — mobile app (admin + employee)
|--------------------------------------------------------------------------
| Thin JSON layer over app/Services/*. Contract: docs/api-v1.md.
| SuperAdmin and public booking stay web-only.
*/

Route::prefix('v1')->name('api.v1.')->group(function () {
    Route::post('/auth/login', [V1\AuthController::class, 'login'])
        ->middleware('throttle:10,1')
        ->name('auth.login');

    Route::get('/translations', [V1\TranslationController::class, 'index'])
        ->middleware('throttle:30,1')
        ->name('translations');

    Route::middleware(['auth:sanctum'])->group(function () {
        Route::delete('/auth/logout', [V1\AuthController::class, 'logout'])->name('auth.logout');

        Route::get('/me', [V1\MeController::class, 'show'])->name('me.show');
        Route::patch('/me', [V1\MeController::class, 'update'])->name('me.update');
        Route::put('/me/password', [V1\MeController::class, 'updatePassword'])->name('me.password');
        Route::put('/me/locale', [V1\MeController::class, 'updateLocale'])->name('me.locale');

        Route::post('/devices', [V1\DeviceController::class, 'store'])->name('devices.store');
        Route::delete('/devices', [V1\DeviceController::class, 'destroy'])->name('devices.destroy');
    });

    Route::middleware(['auth:sanctum', 'employee_area', 'onboarding_completed'])
        ->prefix('employee')->name('employee.')->group(function () {
            Route::get('/notifications', [EmployeeWeb\NotificationController::class, 'feed'])->name('notifications.index');
            Route::post('/notifications/read-all', [EmployeeWeb\NotificationController::class, 'markAllRead'])->name('notifications.read-all');
            Route::post('/notifications/{id}/read', [EmployeeWeb\NotificationController::class, 'markRead'])->whereUuid('id')->name('notifications.read');

            Route::middleware('permission:employee.dashboard')->group(function () {
                Route::get('/dashboard', [V1\Employee\DashboardController::class, 'index'])->name('dashboard');
                Route::get('/appointments', [V1\Employee\AppointmentController::class, 'index'])->name('appointments.index');
            });

            Route::middleware('permission:employee.appointments')->group(function () {
                Route::get('/appointments/calendar', [V1\Employee\AppointmentController::class, 'calendar'])->name('appointments.calendar');
                Route::get('/appointments/create', [V1\Employee\AppointmentController::class, 'createData'])->name('appointments.create');
                Route::post('/appointments', [V1\Employee\AppointmentController::class, 'store'])->name('appointments.store');
                Route::get('/appointments/internal-slots', [V1\Employee\AppointmentController::class, 'internalSlots'])->name('appointments.internal-slots');
                Route::patch('/appointments/{appointment}', [V1\Employee\AppointmentController::class, 'update'])->name('appointments.update');
                Route::get('/appointments/{appointment}/slots', [V1\Employee\AppointmentController::class, 'slots'])->name('appointments.slots');
                Route::put('/appointments/{appointment}/reschedule', [V1\Employee\AppointmentController::class, 'reschedule'])->name('appointments.reschedule');
                Route::put('/appointments/{appointment}', [V1\Employee\AppointmentController::class, 'edit'])->name('appointments.edit');
            });

            Route::middleware('permission:employee.schedule')->group(function () {
                Route::get('/schedule', [V1\Employee\ScheduleController::class, 'index'])->name('schedule.index');
                Route::put('/schedule/overrides', [V1\Employee\ScheduleController::class, 'saveOverrides'])->name('schedule.overrides.update');
                Route::get('/schedule/configuration', [V1\Employee\ScheduleController::class, 'configuration'])->name('schedule.configuration');
                Route::put('/schedule/configuration', [V1\Employee\ScheduleController::class, 'update'])->name('schedule.update');
                Route::patch('/schedule/configuration/info', [V1\Employee\ScheduleController::class, 'updateInfo'])->name('schedule.configuration.info');
            });

            Route::middleware('permission:employee.analytics')->group(function () {
                Route::get('/analytics', [V1\Employee\AnalyticsController::class, 'index'])->name('analytics.index');
            });
        });

    Route::middleware(['auth:sanctum', 'admin_panel', 'onboarding_completed', 'has_business'])
        ->prefix('admin')->name('admin.')->group(function () {
            Route::middleware('permission:admin.dashboard')->group(function () {
                Route::get('/dashboard', [V1\Admin\DashboardController::class, 'index'])->name('dashboard');
            });

            Route::middleware('permission:admin.appointments')->group(function () {
                Route::get('/appointments', [V1\Admin\AppointmentController::class, 'index'])->name('appointments.index');
                Route::get('/appointments/calendar', [V1\Admin\AppointmentController::class, 'calendar'])->name('appointments.calendar');
                Route::get('/appointments/create', [V1\Admin\AppointmentController::class, 'createData'])->name('appointments.create');
                Route::post('/appointments', [V1\Admin\AppointmentController::class, 'store'])->name('appointments.store');
                Route::get('/appointments/internal-slots', [V1\Admin\AppointmentController::class, 'internalSlots'])->name('appointments.internal-slots');
                Route::get('/appointments/slots', [V1\Admin\AppointmentController::class, 'slots'])->name('appointments.slots');
                Route::patch('/appointments/{appointment}', [V1\Admin\AppointmentController::class, 'update'])->name('appointments.update');
                Route::put('/appointments/{appointment}', [V1\Admin\AppointmentController::class, 'edit'])->name('appointments.edit');
                Route::delete('/appointments/{appointment}', [V1\Admin\AppointmentController::class, 'destroy'])->name('appointments.destroy');
            });

            Route::middleware('permission:admin.employees')->group(function () {
                Route::get('/employees', [V1\Admin\EmployeeController::class, 'index'])->name('employees.index');
                Route::post('/employees', [V1\Admin\EmployeeController::class, 'store'])->name('employees.store');
                Route::put('/employees/{employee}', [V1\Admin\EmployeeController::class, 'update'])->name('employees.update');
                Route::delete('/employees/{employee}', [V1\Admin\EmployeeController::class, 'destroy'])->name('employees.destroy');
            });

            Route::middleware('permission:admin.services')->group(function () {
                Route::get('/services', [V1\Admin\ServiceController::class, 'index'])->name('services.index');
                Route::post('/services', [V1\Admin\ServiceController::class, 'store'])->name('services.store');
                Route::put('/services/{service}', [V1\Admin\ServiceController::class, 'update'])->name('services.update');
                Route::delete('/services/{service}', [V1\Admin\ServiceController::class, 'destroy'])->name('services.destroy');
            });

            Route::middleware(['permission:admin.shared_resources', 'business_uses_shared_resources'])->group(function () {
                Route::get('/shared-resources', [V1\Admin\SharedResourceController::class, 'index'])->name('shared-resources.index');
                Route::post('/shared-resources', [V1\Admin\SharedResourceController::class, 'store'])->name('shared-resources.store');
                Route::put('/shared-resources/{sharedResource}', [V1\Admin\SharedResourceController::class, 'update'])->name('shared-resources.update');
                Route::delete('/shared-resources/{sharedResource}', [V1\Admin\SharedResourceController::class, 'destroy'])->name('shared-resources.destroy');
            });

            Route::middleware('permission:admin.roles')->group(function () {
                Route::get('/roles', [V1\Admin\BusinessRoleController::class, 'index'])->name('roles.index');
                Route::post('/roles', [V1\Admin\BusinessRoleController::class, 'store'])->name('roles.store');
                Route::put('/roles/{role}', [V1\Admin\BusinessRoleController::class, 'update'])->name('roles.update');
                Route::delete('/roles/{role}', [V1\Admin\BusinessRoleController::class, 'destroy'])->name('roles.destroy');
            });

            Route::middleware('permission:admin.analytics')->group(function () {
                Route::get('/analytics', [V1\Admin\AnalyticsController::class, 'index'])->name('analytics.index');
            });

            // The settings screen opens for either permission; each section saves
            // under its own gate (the web routes make the same split).
            Route::middleware('permission_any:admin.settings,admin.appointments')->group(function () {
                Route::get('/settings', [V1\Admin\SettingsController::class, 'index'])->name('settings.index');
            });

            Route::middleware('permission:admin.appointments')->group(function () {
                Route::put('/settings/notifications', [V1\Admin\SettingsController::class, 'updateNotificationPreferences'])
                    ->name('settings.notifications.update');
            });

            Route::middleware('permission:admin.settings')->group(function () {
                Route::put('/settings', [V1\Admin\SettingsController::class, 'update'])->name('settings.update');
                // Same action over POST: PHP does not populate $_FILES on PUT,
                // so a logo upload has to arrive as multipart on a POST.
                Route::post('/settings', [V1\Admin\SettingsController::class, 'update'])->name('settings.upload');
            });
        });
});
