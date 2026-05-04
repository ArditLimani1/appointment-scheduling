<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Booking\BookingController;
use App\Http\Controllers\Employee;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SuperAdmin;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::post('/locale', [LocaleController::class, 'update'])->name('locale.update');

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
});

Route::get('/dashboard', function () {
    $user = auth()->user();

    if ($user->isSuperAdmin()) {
        return redirect()->route('super-admin.dashboard');
    }

    if ($user->requiresOnboarding()) {
        return redirect()->route('onboarding.show');
    }

    if ($user->hasAdminPanelAccess()) {
        return redirect()->route('admin.dashboard');
    }

    return redirect()->route('employee.dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified', 'employee_area'])->prefix('onboarding')->name('onboarding.')->group(function () {
    Route::get('/', [OnboardingController::class, 'show'])->name('show');
    Route::patch('/business-settings', [OnboardingController::class, 'updateBusinessSettings'])->name('business_settings');
    Route::patch('/booking-slug', [OnboardingController::class, 'updateBookingSlug'])->name('booking_slug');
    Route::put('/schedule', [OnboardingController::class, 'updateSchedule'])->name('schedule');
    Route::post('/complete', [OnboardingController::class, 'complete'])->name('complete');
});

Route::get('/book/confirmation/{appointment}', [BookingController::class, 'confirmation'])->name('booking.confirmation');
Route::get('/book/{slug}', [BookingController::class, 'index'])->name('booking.index');
Route::get('/book/{slug}/slots', [BookingController::class, 'getAvailableSlots'])->middleware('throttle:60,1')->name('booking.slots');
Route::get('/book/{slug}/{employeeSlug}', [BookingController::class, 'indexEmployee'])->name('booking.employee');
Route::post('/book/{slug}', [BookingController::class, 'store'])->middleware('throttle:10,1')->name('booking.store');

Route::middleware(['auth', 'admin_panel', 'onboarding_completed', 'has_business'])->prefix('admin')->name('admin.')->group(function () {
    Route::middleware('permission:admin.dashboard')->group(function () {
        Route::get('/dashboard', [Admin\DashboardController::class, 'index'])->name('dashboard');
    });

    Route::middleware('permission:admin.employees')->group(function () {
        Route::resource('employees', Admin\EmployeeController::class)->only(['index', 'store', 'update', 'destroy']);
    });

    Route::middleware('permission:admin.services')->group(function () {
        Route::resource('services', Admin\ServiceController::class)->only(['index', 'store', 'update', 'destroy']);
    });

    Route::middleware(['permission:admin.shared_resources', 'business_uses_shared_resources'])->group(function () {
        Route::resource('shared-resources', Admin\SharedResourceController::class)->only(['index', 'store', 'update', 'destroy']);
    });

    Route::middleware('permission:admin.appointments')->group(function () {
        Route::get('/appointments', [Admin\AppointmentController::class, 'index'])->name('appointments.index');
        Route::get('/appointments/calendar', [Admin\AppointmentController::class, 'calendar'])->name('appointments.calendar');
        Route::get('/appointments/create', [Admin\AppointmentController::class, 'create'])->name('appointments.create');
        Route::post('/appointments', [Admin\AppointmentController::class, 'store'])->name('appointments.store');
        Route::get('/appointments/internal-slots', [Admin\AppointmentController::class, 'internalSlots'])->name('appointments.internal-slots');
        Route::get('/appointments/slots', [Admin\AppointmentController::class, 'slots'])->name('appointments.slots');
        Route::get('/appointments/export', [Admin\AppointmentController::class, 'export'])->name('appointments.export');
        Route::get('/appointments/export-pdf', [Admin\AppointmentController::class, 'exportPdf'])->name('appointments.export-pdf');
        Route::patch('/appointments/{appointment}', [Admin\AppointmentController::class, 'update'])->name('appointments.update');
        Route::put('/appointments/{appointment}', [Admin\AppointmentController::class, 'edit'])->name('appointments.edit');
        Route::delete('/appointments/{appointment}', [Admin\AppointmentController::class, 'destroy'])->name('appointments.destroy');
    });

    Route::middleware('permission:admin.analytics')->group(function () {
        Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');
        Route::get('/analytics/export', [AnalyticsController::class, 'export'])->name('analytics.export');
        Route::get('/analytics/export-pdf', [AnalyticsController::class, 'exportPdf'])->name('analytics.export-pdf');
    });

    Route::middleware('permission:admin.settings')->group(function () {
        Route::get('/settings', [Admin\SettingsController::class, 'index'])->name('settings.index');
        Route::put('/settings', [Admin\SettingsController::class, 'update'])->name('settings.update');
    });

    Route::middleware('permission:admin.roles')->group(function () {
        Route::resource('roles', Admin\BusinessRoleController::class)->only(['index', 'store', 'update', 'destroy']);
    });
});

Route::middleware(['auth', 'super_admin'])->prefix('super-admin')->name('super-admin.')->group(function () {
    Route::get('/dashboard', [SuperAdmin\DashboardController::class, 'index'])->name('dashboard');

    Route::get('/businesses', [SuperAdmin\BusinessController::class, 'index'])->name('businesses.index');
    Route::get('/businesses/{business}', [SuperAdmin\BusinessController::class, 'show'])->name('businesses.show');
    Route::put('/businesses/{business}', [SuperAdmin\BusinessController::class, 'update'])->name('businesses.update');
    Route::patch('/businesses/{business}/toggle-suspend', [SuperAdmin\BusinessController::class, 'toggleSuspend'])->name('businesses.toggle-suspend');
    Route::delete('/businesses/{business}', [SuperAdmin\BusinessController::class, 'destroy'])->name('businesses.destroy');

    Route::get('/users', [SuperAdmin\UserController::class, 'index'])->name('users.index');
    Route::post('/users/{user}/password-reset', [SuperAdmin\UserController::class, 'sendPasswordReset'])->name('users.password-reset');
    Route::post('/users/{user}/impersonate', [SuperAdmin\UserController::class, 'impersonate'])->name('users.impersonate');

    Route::get('/business-type-categories', [SuperAdmin\BusinessTypeCategoryController::class, 'index'])->name('business-type-categories.index');
    Route::post('/business-type-categories', [SuperAdmin\BusinessTypeCategoryController::class, 'store'])->name('business-type-categories.store');
    Route::put('/business-type-categories/{category}', [SuperAdmin\BusinessTypeCategoryController::class, 'update'])->name('business-type-categories.update');
    Route::delete('/business-type-categories/{category}', [SuperAdmin\BusinessTypeCategoryController::class, 'destroy'])->name('business-type-categories.destroy');

    Route::get('/business-types', [SuperAdmin\BusinessTypeController::class, 'index'])->name('business-types.index');
    Route::post('/business-types', [SuperAdmin\BusinessTypeController::class, 'store'])->name('business-types.store');
    Route::put('/business-types/{type}', [SuperAdmin\BusinessTypeController::class, 'update'])->name('business-types.update');
    Route::delete('/business-types/{type}', [SuperAdmin\BusinessTypeController::class, 'destroy'])->name('business-types.destroy');

    Route::get('/audit-logs', [SuperAdmin\AuditLogController::class, 'index'])->name('audit-logs.index');
});

Route::post('/super-admin/stop-impersonating', [SuperAdmin\UserController::class, 'stopImpersonating'])
    ->middleware('auth')
    ->name('super-admin.stop-impersonating');

Route::middleware(['auth', 'employee_area', 'onboarding_completed'])->prefix('employee')->name('employee.')->group(function () {
    Route::get('/notifications/feed', [Employee\NotificationController::class, 'feed'])->name('notifications.feed');
    Route::post('/notifications/read-all', [Employee\NotificationController::class, 'markAllRead'])->name('notifications.read-all');
    Route::post('/notifications/{id}/read', [Employee\NotificationController::class, 'markRead'])->whereUuid('id')->name('notifications.read');

    Route::middleware('permission:employee.dashboard')->group(function () {
        Route::get('/dashboard', [Employee\DashboardController::class, 'index'])->name('dashboard');
        Route::get('/appointments', [Employee\AppointmentController::class, 'index'])->name('appointments.index');
        Route::get('/appointments/export', [Employee\AppointmentController::class, 'export'])->name('appointments.export');
        Route::get('/appointments/export-pdf', [Employee\AppointmentController::class, 'exportPdf'])->name('appointments.export-pdf');
    });

    Route::middleware('permission:employee.analytics')->group(function () {
        Route::get('/analytics', [Employee\AnalyticsController::class, 'index'])->name('analytics.index');
        Route::get('/analytics/export', [Employee\AnalyticsController::class, 'export'])->name('analytics.export');
        Route::get('/analytics/export-pdf', [Employee\AnalyticsController::class, 'exportPdf'])->name('analytics.export-pdf');
    });

    Route::middleware('permission:employee.schedule')->group(function () {
        // Date-range / weekly override view
        Route::get('/schedule', [Employee\ScheduleController::class, 'index'])->name('schedule.index');
        Route::put('/schedule/overrides', [Employee\ScheduleController::class, 'saveOverrides'])->name('schedule.overrides.update');

        // Default (base) weekly schedule configuration
        Route::get('/schedule/configuration', [Employee\ScheduleController::class, 'configuration'])->name('schedule.configuration');
        Route::put('/schedule/configuration', [Employee\ScheduleController::class, 'update'])->name('schedule.update');
        Route::patch('/schedule/configuration/info', [Employee\ScheduleController::class, 'updateInfo'])->name('schedule.configuration.info');
    });

    Route::middleware('permission:employee.appointments')->group(function () {
        Route::get('/appointments/calendar', [Employee\AppointmentController::class, 'calendar'])->name('appointments.calendar');
        Route::get('/appointments/create', [Employee\AppointmentController::class, 'create'])->name('appointments.create');
        Route::post('/appointments', [Employee\AppointmentController::class, 'store'])->name('appointments.store');
        Route::get('/appointments/internal-slots', [Employee\AppointmentController::class, 'internalSlots'])->name('appointments.internal-slots');
        Route::patch('/appointments/{appointment}', [Employee\AppointmentController::class, 'update'])->name('appointments.update');
        Route::get('/appointments/{appointment}/slots', [Employee\AppointmentController::class, 'slots'])->name('appointments.slots');
        Route::put('/appointments/{appointment}/reschedule', [Employee\AppointmentController::class, 'reschedule'])->name('appointments.reschedule');
        Route::put('/appointments/{appointment}', [Employee\AppointmentController::class, 'edit'])->name('appointments.edit');
    });
});

require __DIR__.'/auth.php';
