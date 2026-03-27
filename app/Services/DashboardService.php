<?php

namespace App\Services;

use App\Models\Business;
use App\Models\User;
use App\Repositories\Interfaces\AppointmentRepositoryInterface;
use App\Repositories\Interfaces\EmployeeRepositoryInterface;
use App\Repositories\Interfaces\ServiceRepositoryInterface;
use App\Services\Interfaces\DashboardServiceInterface;
use Carbon\Carbon;

class DashboardService implements DashboardServiceInterface
{
    public function __construct(
        private EmployeeRepositoryInterface $employeeRepository,
        private ServiceRepositoryInterface $serviceRepository,
        private AppointmentRepositoryInterface $appointmentRepository,
    ) {}

    public function getAdminDashboardData(Business $business): array
    {
        $recentAppointments = $this->appointmentRepository
            ->getRecent($business->id)
            ->map(fn ($apt) => [
                'client_name' => $apt->client_first_name . ' ' . $apt->client_last_name,
                'service_name' => $apt->service?->name ?? 'Appointment',
                'employee_name' => $apt->employee?->name,
                'date' => $apt->date->toDateString(),
                'start_time' => $apt->start_time,
                'status' => $apt->status,
            ]);

        return [
            'active_employees' => $this->employeeRepository->countActiveByBusiness($business->id),
            'total_employees' => $this->employeeRepository->countByBusiness($business->id),
            'active_services' => $this->serviceRepository->countActiveByBusiness($business->id),
            'total_services' => $this->serviceRepository->countByBusiness($business->id),
            'upcoming_appointments' => $this->appointmentRepository->getUpcomingCount($business->id),
            'total_revenue' => $this->appointmentRepository->getCompletedRevenue($business->id),
            'recent_appointments' => $recentAppointments,
        ];
    }

    public function getEmployeeDashboardData(User $user, string $date): array
    {
        $appointments = $user->appointments()
            ->with('service')
            ->whereDate('date', $date)
            ->orderBy('start_time')
            ->get();

        return [
            'appointments' => $appointments,
            'date' => $date,
        ];
    }
}
