<?php

namespace App\Services\SuperAdmin;

use App\Models\User;
use App\Repositories\Interfaces\UserRepositoryInterface;
use App\Services\AuditLogger;
use App\Services\Interfaces\SuperAdmin\UserAdministrationServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Session;

class UserAdministrationService implements UserAdministrationServiceInterface
{
    public function __construct(
        private UserRepositoryInterface $users,
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
