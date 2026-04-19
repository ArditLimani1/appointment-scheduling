<?php

namespace App\Services\SuperAdmin;

use App\Repositories\Interfaces\AppointmentRepositoryInterface;
use App\Repositories\Interfaces\AuditLogRepositoryInterface;
use App\Repositories\Interfaces\BusinessRepositoryInterface;
use App\Repositories\Interfaces\UserRepositoryInterface;
use App\Services\Interfaces\SuperAdmin\PlatformDashboardServiceInterface;
use Carbon\Carbon;

class PlatformDashboardService implements PlatformDashboardServiceInterface
{
    public function __construct(
        private BusinessRepositoryInterface $businesses,
        private UserRepositoryInterface $users,
        private AppointmentRepositoryInterface $appointments,
        private AuditLogRepositoryInterface $auditLogs,
    ) {}

    public function overview(): array
    {
        $thirtyDaysAgo = Carbon::now()->subDays(30);

        return [
            'stats' => [
                'businesses_total' => $this->businesses->countAll(),
                'businesses_active' => $this->businesses->countActive(),
                'businesses_suspended' => $this->businesses->countSuspended(),
                'users_total' => $this->users->countTenants(),
                'appointments_total' => $this->appointments->countAll(),
                'appointments_last_30_days' => $this->appointments->countSince($thirtyDaysAgo),
                'audit_logs_total' => $this->auditLogs->count(),
            ],
            'signups_by_day' => $this->users->signupsByDay(30),
            'recent_businesses' => $this->businesses->recentForDashboard(5),
            'recent_audit_logs' => $this->auditLogs->recent(8),
        ];
    }
}
