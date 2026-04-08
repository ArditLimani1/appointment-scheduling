<?php

namespace App\Providers;

use App\Repositories\AppointmentRepository;
use App\Repositories\BusinessRepository;
use App\Repositories\BusinessRoleRepository;
use App\Repositories\EmployeeRepository;
use App\Repositories\Interfaces\AppointmentRepositoryInterface;
use App\Repositories\Interfaces\BusinessRepositoryInterface;
use App\Repositories\Interfaces\BusinessRoleRepositoryInterface;
use App\Repositories\Interfaces\EmployeeRepositoryInterface;
use App\Repositories\Interfaces\ScheduleRepositoryInterface;
use App\Repositories\Interfaces\ServiceRepositoryInterface;
use App\Repositories\ScheduleRepository;
use App\Repositories\ServiceRepository;
use App\Services\AnalyticsService;
use App\Services\AppointmentService;
use App\Services\BookingService;
use App\Services\BusinessRoleService;
use App\Services\BusinessService;
use App\Services\DashboardService;
use App\Services\EmployeeService;
use App\Services\Interfaces\AnalyticsServiceInterface;
use App\Services\Interfaces\AppointmentServiceInterface;
use App\Services\Interfaces\BookingServiceInterface;
use App\Services\Interfaces\BusinessRoleServiceInterface;
use App\Services\Interfaces\BusinessServiceInterface;
use App\Services\Interfaces\DashboardServiceInterface;
use App\Services\Interfaces\EmployeeServiceInterface;
use App\Services\Interfaces\ScheduleServiceInterface;
use App\Services\Interfaces\ServiceServiceInterface;
use App\Services\ScheduleService;
use App\Services\ServiceService;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public array $bindings = [
        BusinessRepositoryInterface::class => BusinessRepository::class,
        BusinessRoleRepositoryInterface::class => BusinessRoleRepository::class,
        EmployeeRepositoryInterface::class => EmployeeRepository::class,
        ServiceRepositoryInterface::class => ServiceRepository::class,
        AppointmentRepositoryInterface::class => AppointmentRepository::class,
        ScheduleRepositoryInterface::class => ScheduleRepository::class,

        BusinessServiceInterface::class => BusinessService::class,
        BusinessRoleServiceInterface::class => BusinessRoleService::class,
        EmployeeServiceInterface::class => EmployeeService::class,
        ServiceServiceInterface::class => ServiceService::class,
        AppointmentServiceInterface::class => AppointmentService::class,
        ScheduleServiceInterface::class => ScheduleService::class,
        BookingServiceInterface::class => BookingService::class,
        DashboardServiceInterface::class => DashboardService::class,
        AnalyticsServiceInterface::class => AnalyticsService::class,
    ];

    public function register(): void {}

    public function boot(): void {}
}
