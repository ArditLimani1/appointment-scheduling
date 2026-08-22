<?php

namespace App\Services\Interfaces\SuperAdmin;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface UserAdministrationServiceInterface
{
    public function paginateTenants(?string $search, ?string $role, int $perPage): LengthAwarePaginator;

    public function sendPasswordReset(User $user): void;

    /**
     * Permanently remove a tenant account. Returns the deleted user's email.
     */
    public function delete(User $user): string;

    public function impersonate(User $actor, User $target): void;

    public function stopImpersonating(): User;
}
