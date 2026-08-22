<?php

namespace App\Services\SuperAdmin;

use App\Models\Appointment;
use App\Models\User;
use App\Repositories\Interfaces\UserRepositoryInterface;
use App\Services\AuditLogger;
use App\Services\Interfaces\EmployeeServiceInterface;
use App\Services\Interfaces\SuperAdmin\UserAdministrationServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Session;

class UserAdministrationService implements UserAdministrationServiceInterface
{
    public function __construct(
        private UserRepositoryInterface $users,
        private EmployeeServiceInterface $employees,
    ) {}

    public function paginateTenants(?string $search, ?string $role, int $perPage): LengthAwarePaginator
    {
        return $this->users->paginateTenants($search, $role, $perPage);
    }

    public function sendPasswordReset(User $user): void
    {
        abort_if($user->isSuperAdmin(), 403);

        Password::sendResetLink(['email' => $user->email]);

        AuditLogger::log('user.password_reset_sent', $user, [], $user->email);
    }

    /**
     * Owners are refused: deleting them would cascade-delete their whole business.
     * Staff go through the employee flow so past appointments keep the employee name.
     */
    public function delete(User $user): string
    {
        abort_if($user->isSuperAdmin(), 403);
        abort_if((int) $user->id === (int) auth()->id(), 403);

        $user->loadMissing(['ownedBusiness', 'business']);
        abort_if($user->ownedBusiness !== null, 403);

        $email = $user->email;
        $name = $user->name;
        $userId = (int) $user->id;
        $business = $user->business;

        DB::transaction(function () use ($user, $business, $name, $userId) {
            DB::table('sessions')->where('user_id', $userId)->delete();

            if ($business) {
                $this->employees->delete($business, $user, false);

                return;
            }

            $user->services()->detach();

            Appointment::query()
                ->where('employee_id', $userId)
                ->update([
                    'employee_name' => $name,
                    'employee_id' => null,
                ]);

            $user->delete();
        });

        AuditLogger::log('user.deleted', null, ['user_id' => $userId, 'email' => $email], $name);

        return $email;
    }

    public function impersonate(User $actor, User $target): void
    {
        abort_if($target->isSuperAdmin(), 403);

        Session::put('impersonator_id', $actor->id);
        auth()->login($target);

        AuditLogger::log('user.impersonated', $target, ['original_user_id' => $actor->id], $target->email);
    }

    public function stopImpersonating(): User
    {
        $originalId = Session::pull('impersonator_id');

        abort_unless($originalId, 404);

        $original = $this->users->findById($originalId);
        abort_unless($original && $original->isSuperAdmin(), 403);

        auth()->login($original);

        return $original;
    }
}
