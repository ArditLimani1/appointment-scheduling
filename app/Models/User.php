<?php

namespace App\Models;

use App\Enums\Permission;
use App\Enums\UserRole;
use App\Enums\UserType;
use App\Notifications\VerifyBusinessEmail;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail as MustVerifyEmailContract;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmailContract
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'phone', 'title', 'avatar', 'booking_slug', 'locale', 'onboarding_completed_at',
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'onboarding_completed_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'also_works_as_staff' => 'boolean',
            'role' => UserRole::class,
            'user_type' => UserType::class,
        ];
    }

    public function hasCompletedOnboarding(): bool
    {
        return $this->onboarding_completed_at !== null;
    }

    /**
     * Super admins skip onboarding entirely; only role-based admins/employees go through it.
     */
    public function requiresOnboarding(): bool
    {
        if ($this->isSuperAdmin()) {
            return false;
        }

        if (! ($this->isAdmin() || $this->isEmployee())) {
            return false;
        }

        return ! $this->hasCompletedOnboarding();
    }

    public function isOwnerOf(Business $business): bool
    {
        return (int) $this->id === (int) $business->owner_id;
    }

    /**
     * Owner appears as bookable staff (booking page, schedules, team list) while keeping the admin account.
     */
    public function syncAlsoWorksAsStaff(Business $business, bool $enabled): void
    {
        abort_unless($this->isOwnerOf($business), 403);

        if ($enabled) {
            $this->forceFill([
                'also_works_as_staff' => true,
                'business_id' => $business->id,
            ])->save();

            return;
        }

        $this->loadMissing('schedules');
        foreach ($this->schedules as $schedule) {
            $schedule->breaks()->delete();
        }
        $this->schedules()->delete();

        $this->services()->detach();

        $this->forceFill([
            'also_works_as_staff' => false,
            'business_id' => null,
            'business_role_id' => null,
        ])->save();
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    public function isEmployee(): bool
    {
        return $this->role === UserRole::Employee;
    }

    /**
     * Employee role, or business owner who enabled "also works as staff" in settings.
     */
    public function worksAsStaff(): bool
    {
        return $this->isEmployee() || ($this->isAdmin() && $this->also_works_as_staff);
    }

    public function isSuperAdmin(): bool
    {
        return $this->user_type === UserType::SuperAdmin;
    }

    public function requiresEmailVerification(): bool
    {
        return $this->isAdmin() && ! $this->isSuperAdmin();
    }

    public function hasVerifiedEmail(): bool
    {
        if (! $this->requiresEmailVerification()) {
            return true;
        }

        return ! is_null($this->email_verified_at);
    }

    public function sendEmailVerificationNotification(): void
    {
        if (! $this->requiresEmailVerification()) {
            return;
        }

        $this->notify(new VerifyBusinessEmail);
    }

    public function ownedBusiness(): HasOne
    {
        return $this->hasOne(Business::class, 'owner_id');
    }

    /**
     * Business context for the admin panel (owner or staff with admin permissions).
     */
    public function panelBusiness(): ?Business
    {
        if ($this->isAdmin()) {
            return $this->ownedBusiness;
        }

        if ($this->isEmployee()) {
            return $this->business;
        }

        return null;
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function businessRole(): BelongsTo
    {
        return $this->belongsTo(BusinessRole::class);
    }

    public function hasAdminPanelAccess(): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        return $this->isEmployee() && $this->hasAnyAdminPermission();
    }

    public function hasAnyAdminPermission(): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        foreach (Permission::adminCases() as $permission) {
            if ($this->hasPermission($permission->value)) {
                return true;
            }
        }

        return false;
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        if (! $this->isEmployee()) {
            return false;
        }

        if (! $this->business_role_id) {
            return str_starts_with($permission, 'employee.');
        }

        $this->loadMissing('businessRole');

        if (! $this->businessRole) {
            return str_starts_with($permission, 'employee.');
        }

        $assigned = $this->businessRole->permissions ?? [];

        if ($permission === Permission::AdminDashboard->value) {
            if (in_array($permission, $assigned, true)) {
                return true;
            }

            foreach (Permission::adminCases() as $p) {
                if ($p === Permission::AdminDashboard) {
                    continue;
                }
                if (in_array($p->value, $assigned, true)) {
                    return true;
                }
            }

            return false;
        }

        return in_array($permission, $assigned, true);
    }

    /**
     * @return array<int, string>
     */
    public function effectivePermissionKeys(): array
    {
        if ($this->isAdmin()) {
            return Permission::values();
        }

        if (! $this->isEmployee()) {
            return [];
        }

        if (! $this->business_role_id) {
            return array_map(
                fn (Permission $p) => $p->value,
                Permission::employeeCases()
            );
        }

        $this->loadMissing('businessRole');

        $keys = array_values($this->businessRole->permissions ?? []);

        $hasOtherAdmin = false;
        foreach (Permission::adminCases() as $p) {
            if ($p === Permission::AdminDashboard) {
                continue;
            }
            if (in_array($p->value, $keys, true)) {
                $hasOtherAdmin = true;
                break;
            }
        }

        if ($hasOtherAdmin && ! in_array(Permission::AdminDashboard->value, $keys, true)) {
            $keys[] = Permission::AdminDashboard->value;
        }

        return array_values(array_unique($keys));
    }

    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'employee_service');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'employee_id');
    }

    public function appointmentViewPreference(): HasOne
    {
        return $this->hasOne(UserAppointmentViewPreference::class);
    }
}
