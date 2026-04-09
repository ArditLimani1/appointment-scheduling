<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Models\Business;
use App\Models\User;
use App\Repositories\Interfaces\AppointmentRepositoryInterface;
use App\Repositories\Interfaces\EmployeeRepositoryInterface;
use App\Repositories\Interfaces\ServiceRepositoryInterface;
use App\Services\Interfaces\DashboardServiceInterface;

class DashboardService implements DashboardServiceInterface
{
    public function __construct(
        private EmployeeRepositoryInterface $employeeRepository,
        private ServiceRepositoryInterface $serviceRepository,
        private AppointmentRepositoryInterface $appointmentRepository,
    ) {}

    public function getAdminDashboardData(Business $business): array
    {
        $today = now()->toDateString();

        $recentAppointments = $this->appointmentRepository
            ->getRecent($business->id, 10, $today)
            ->map(fn ($apt) => [
                'client_name' => $apt->client_first_name.' '.$apt->client_last_name,
                'service_name' => $apt->service?->name ?? 'Appointment',
                'service_price' => $apt->price,
                'employee_name' => $apt->employee?->name,
                'date' => $apt->date->toDateString(),
                'start_time' => $apt->start_time,
                'status' => $apt->status->value,
            ]);

        return [
            'active_employees' => $this->employeeRepository->countActiveByBusiness($business->id),
            'total_employees' => $this->employeeRepository->countByBusiness($business->id),
            'active_services' => $this->serviceRepository->countActiveByBusiness($business->id),
            'total_services' => $this->serviceRepository->countByBusiness($business->id),
            'upcoming_appointments' => $this->appointmentRepository->getUpcomingCount($business->id),
            'total_revenue' => $this->appointmentRepository->getCurrentMonthRevenue($business->id),
            'recent_appointments' => $recentAppointments,
        ];
    }

    public function getEmployeeDashboardData(User $user, string $dateFrom, string $dateTo): array
    {
        $appointments = $user->appointments()
            ->with('service')
            ->whereDate('date', '>=', $dateFrom)
            ->whereDate('date', '<=', $dateTo)
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        return [
            'appointments' => $appointments,
            'appointments_count' => $appointments->count(),
            'confirmed_appointments' => $appointments->where('status', AppointmentStatus::Confirmed)->count(),
            'cancelled_appointments' => $appointments->where('status', AppointmentStatus::Cancelled)->count(),
            'completed_appointments' => $appointments->where('status', AppointmentStatus::Confirmed)->count(),
            'daily_revenue' => $appointments->where('status', AppointmentStatus::Confirmed)->sum('price'),
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
        ];
    }
}
