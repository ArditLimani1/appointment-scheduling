<?php

namespace App\Support;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Str;

class StaffBookingSlug
{
    /**
     * Whether another active bookable staff member in the business already uses this URL slug.
     */
    public static function takenByOtherStaff(int $businessId, int $excludeUserId, string $slug): bool
    {
        $others = User::query()
            ->where('business_id', $businessId)
            ->where('id', '!=', $excludeUserId)
            ->where('is_active', true)
            ->where(function ($q) {
                $q->where('role', UserRole::Employee)
                    ->orWhere(function ($q2) {
                        $q2->where('role', UserRole::Admin)
                            ->where('also_works_as_staff', true);
                    });
            })
            ->get(['id', 'name', 'booking_slug']);

        return $others->contains(function (User $other) use ($slug) {
            $effective = $other->booking_slug ?: Str::slug($other->name);

            return $effective === $slug;
        });
    }
}
