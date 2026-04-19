<?php

namespace App\Providers;

use App\Repositories\AppointmentRepository;
use App\Repositories\AuditLogRepository;
use App\Repositories\BusinessRepository;
use App\Repositories\BusinessRoleRepository;
use App\Repositories\BusinessTypeCategoryRepository;
use App\Repositories\BusinessTypeRepository;
use App\Repositories\EmployeeRepository;
use App\Repositories\Interfaces\AppointmentRepositoryInterface;
use App\Repositories\Interfaces\AuditLogRepositoryInterface;
use App\Repositories\Interfaces\BusinessRepositoryInterface;
use App\Repositories\Interfaces\BusinessRoleRepositoryInterface;
use App\Repositories\Interfaces\BusinessTypeCategoryRepositoryInterface;
use App\Repositories\Interfaces\BusinessTypeRepositoryInterface;
use App\Repositories\Interfaces\EmployeeRepositoryInterface;
use App\Repositories\Interfaces\ScheduleOverrideRepositoryInterface;
use App\Repositories\Interfaces\ScheduleRepositoryInterface;
use App\Repositories\Interfaces\ServiceRepositoryInterface;
use App\Repositories\Interfaces\SharedResourceRepositoryInterface;
use App\Repositories\Interfaces\UserRepositoryInterface;
use App\Repositories\ScheduleOverrideRepository;
use App\Repositories\ScheduleRepository;
use App\Repositories\ServiceRepository;
use App\Repositories\SharedResourceRepository;
use App\Repositories\UserRepository;
use App\Services\AnalyticsService;
use App\Services\AppointmentService;
use App\Services\BookingService;
use App\Services\BusinessRoleService;
use App\Services\BusinessService;
use App\Services\DashboardService;
use App\Services\EmployeeAnalyticsService;
use App\Services\EmployeeService;
use App\Services\Interfaces\AnalyticsServiceInterface;
use App\Services\Interfaces\AppointmentServiceInterface;
use App\Services\Interfaces\BookingServiceInterface;
use App\Services\Interfaces\BusinessRoleServiceInterface;
use App\Services\Interfaces\BusinessServiceInterface;
use App\Services\Interfaces\DashboardServiceInterface;
use App\Services\Interfaces\EmployeeAnalyticsServiceInterface;
use App\Services\Interfaces\EmployeeServiceInterface;
use App\Services\Interfaces\ScheduleServiceInterface;
use App\Services\Interfaces\ServiceServiceInterface;
use App\Services\Interfaces\SharedResourceServiceInterface;
use App\Services\Interfaces\SuperAdmin\AuditLogQueryServiceInterface;
use App\Services\Interfaces\SuperAdmin\BusinessAdministrationServiceInterface;
use App\Services\Interfaces\SuperAdmin\BusinessTypeCategoryManagementServiceInterface;
use App\Services\Interfaces\SuperAdmin\BusinessTypeManagementServiceInterface;
use App\Services\Interfaces\SuperAdmin\PlatformDashboardServiceInterface;
use App\Services\Interfaces\SuperAdmin\UserAdministrationServiceInterface;
use App\Services\ScheduleService;
use App\Services\ServiceService;
use App\Services\SharedResourceService;
use App\Services\SuperAdmin\AuditLogQueryService;
use App\Services\SuperAdmin\BusinessAdministrationService;
use App\Services\SuperAdmin\BusinessTypeCategoryManagementService;
use App\Services\SuperAdmin\BusinessTypeManagementService;
use App\Services\SuperAdmin\PlatformDashboardService;
use App\Services\SuperAdmin\UserAdministrationService;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public array $bindings = [
        BusinessRepositoryInterface::class => BusinessRepository::class,
        BusinessRoleRepositoryInterface::class => BusinessRoleRepository::class,
        BusinessTypeRepositoryInterface::class => BusinessTypeRepository::class,
        BusinessTypeCategoryRepositoryInterface::class => BusinessTypeCategoryRepository::class,
        EmployeeRepositoryInterface::class => EmployeeRepository::class,
        ServiceRepositoryInterface::class => ServiceRepository::class,
        SharedResourceRepositoryInterface::class => SharedResourceRepository::class,
        AppointmentRepositoryInterface::class => AppointmentRepository::class,
        ScheduleRepositoryInterface::class => ScheduleRepository::class,
        ScheduleOverrideRepositoryInterface::class => ScheduleOverrideRepository::class,
        AuditLogRepositoryInterface::class => AuditLogRepository::class,
        UserRepositoryInterface::class => UserRepository::class,

        BusinessServiceInterface::class => BusinessService::class,
        BusinessRoleServiceInterface::class => BusinessRoleService::class,
        EmployeeServiceInterface::class => EmployeeService::class,
        ServiceServiceInterface::class => ServiceService::class,
        SharedResourceServiceInterface::class => SharedResourceService::class,
        AppointmentServiceInterface::class => AppointmentService::class,
        ScheduleServiceInterface::class => ScheduleService::class,
        BookingServiceInterface::class => BookingService::class,
        DashboardServiceInterface::class => DashboardService::class,
        AnalyticsServiceInterface::class => AnalyticsService::class,
        EmployeeAnalyticsServiceInterface::class => EmployeeAnalyticsService::class,

        BusinessAdministrationServiceInterface::class => BusinessAdministrationService::class,
        UserAdministrationServiceInterface::class => UserAdministrationService::class,
        BusinessTypeManagementServiceInterface::class => BusinessTypeManagementService::class,
        BusinessTypeCategoryManagementServiceInterface::class => BusinessTypeCategoryManagementService::class,
        PlatformDashboardServiceInterface::class => PlatformDashboardService::class,
        AuditLogQueryServiceInterface::class => AuditLogQueryService::class,
    ];

    public function register(): void {}

    public function boot(): void {}
}
