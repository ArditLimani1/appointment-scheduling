<?php

namespace App\Enums;

enum Permission: string
{
    case AdminDashboard = 'admin.dashboard';
    case AdminServices = 'admin.services';
    case AdminEmployees = 'admin.employees';
    case AdminAppointments = 'admin.appointments';
    case AdminAnalytics = 'admin.analytics';
    case AdminSettings = 'admin.settings';
    case AdminRoles = 'admin.roles';
    case AdminSharedResources = 'admin.shared_resources';

    case EmployeeDashboard = 'employee.dashboard';
    case EmployeeAnalytics = 'employee.analytics';
    case EmployeeSchedule = 'employee.schedule';
    case EmployeeAppointments = 'employee.appointments';

    public function label(): string
    {
        return match ($this) {
            self::AdminDashboard => __('admin.roles.permission_labels.admin_dashboard'),
            self::AdminServices => __('admin.roles.permission_labels.admin_services'),
            self::AdminEmployees => __('admin.roles.permission_labels.admin_employees'),
            self::AdminAppointments => __('admin.roles.permission_labels.admin_appointments'),
            self::AdminAnalytics => __('admin.roles.permission_labels.admin_analytics'),
            self::AdminSettings => __('admin.roles.permission_labels.admin_settings'),
            self::AdminRoles => __('admin.roles.permission_labels.admin_roles'),
            self::AdminSharedResources => __('admin.roles.permission_labels.admin_shared_resources'),
            self::EmployeeDashboard => __('admin.roles.permission_labels.employee_dashboard'),
            self::EmployeeAnalytics => __('admin.roles.permission_labels.employee_analytics'),
            self::EmployeeSchedule => __('admin.roles.permission_labels.employee_schedule'),
            self::EmployeeAppointments => __('admin.roles.permission_labels.employee_appointments'),
        };
    }

    /**
     * @return array<int, self>
     */
    public static function adminCases(): array
    {
        return array_values(array_filter(
            self::cases(),
            fn (self $p) => str_starts_with($p->value, 'admin.')
        ));
    }

    /**
     * @return array<int, self>
     */
    public static function employeeCases(): array
    {
        return array_values(array_filter(
            self::cases(),
            fn (self $p) => str_starts_with($p->value, 'employee.')
        ));
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_map(fn (self $p) => $p->value, self::cases());
    }
}
