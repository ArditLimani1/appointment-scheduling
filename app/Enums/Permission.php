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

    case EmployeeDashboard = 'employee.dashboard';
    case EmployeeSchedule = 'employee.schedule';
    case EmployeeAppointments = 'employee.appointments';

    public function label(): string
    {
        return match ($this) {
            self::AdminDashboard => 'Admin: Dashboard',
            self::AdminServices => 'Admin: Services',
            self::AdminEmployees => 'Admin: Employees',
            self::AdminAppointments => 'Admin: Appointments',
            self::AdminAnalytics => 'Admin: Analytics',
            self::AdminSettings => 'Admin: Configuration',
            self::AdminRoles => 'Admin: Roles & permissions',
            self::EmployeeDashboard => 'Employee: Appointments overview',
            self::EmployeeSchedule => 'Employee: Schedule',
            self::EmployeeAppointments => 'Employee: Update appointment status',
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
