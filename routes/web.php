<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Booking\BookingController;
use App\Http\Controllers\Employee;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
});

Route::get('/dashboard', function () {
    $user = auth()->user();

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

Route::get('/book/confirmation/{appointment}', [BookingController::class, 'confirmation'])->name('booking.confirmation');
Route::get('/book/{slug}', [BookingController::class, 'index'])->name('booking.index');
Route::get('/book/{slug}/slots', [BookingController::class, 'getAvailableSlots'])->middleware('throttle:60,1')->name('booking.slots');
Route::post('/book/{slug}', [BookingController::class, 'store'])->middleware('throttle:10,1')->name('booking.store');

Route::middleware(['auth', 'admin_panel', 'has_business'])->prefix('admin')->name('admin.')->group(function () {
    Route::middleware('permission:admin.dashboard')->group(function () {
        Route::get('/dashboard', [Admin\DashboardController::class, 'index'])->name('dashboard');
    });

    Route::middleware('permission:admin.employees')->group(function () {
        Route::resource('employees', Admin\EmployeeController::class)->only(['index', 'store', 'update', 'destroy']);
    });

    Route::middleware('permission:admin.services')->group(function () {
        Route::resource('services', Admin\ServiceController::class)->only(['index', 'store', 'update', 'destroy']);
    });

    Route::middleware('permission:admin.appointments')->group(function () {
        Route::get('/appointments', [Admin\AppointmentController::class, 'index'])->name('appointments.index');
        Route::get('/appointments/slots', [Admin\AppointmentController::class, 'slots'])->name('appointments.slots');
        Route::get('/appointments/export', [Admin\AppointmentController::class, 'export'])->name('appointments.export');
        Route::patch('/appointments/{appointment}', [Admin\AppointmentController::class, 'update'])->name('appointments.update');
        Route::put('/appointments/{appointment}', [Admin\AppointmentController::class, 'edit'])->name('appointments.edit');
        Route::delete('/appointments/{appointment}', [Admin\AppointmentController::class, 'destroy'])->name('appointments.destroy');
    });

    Route::middleware('permission:admin.analytics')->group(function () {
        Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');
        Route::get('/analytics/export', [AnalyticsController::class, 'export'])->name('analytics.export');
    });

    Route::middleware('permission:admin.settings')->group(function () {
        Route::get('/settings', [Admin\SettingsController::class, 'index'])->name('settings.index');
        Route::put('/settings', [Admin\SettingsController::class, 'update'])->name('settings.update');
    });

    Route::middleware('permission:admin.roles')->group(function () {
        Route::resource('roles', Admin\BusinessRoleController::class)->only(['index', 'store', 'update', 'destroy']);
    });
});

Route::middleware(['auth', 'employee_area'])->prefix('employee')->name('employee.')->group(function () {
    Route::middleware('permission:employee.dashboard')->group(function () {
        Route::get('/dashboard', [Employee\DashboardController::class, 'index'])->name('dashboard');
    });

    Route::middleware('permission:employee.schedule')->group(function () {
        Route::get('/schedule', [Employee\ScheduleController::class, 'index'])->name('schedule.index');
        Route::put('/schedule', [Employee\ScheduleController::class, 'update'])->name('schedule.update');
    });

    Route::middleware('permission:employee.appointments')->group(function () {
        Route::patch('/appointments/{appointment}', [Employee\AppointmentController::class, 'update'])->name('appointments.update');
    });
});

require __DIR__.'/auth.php';
