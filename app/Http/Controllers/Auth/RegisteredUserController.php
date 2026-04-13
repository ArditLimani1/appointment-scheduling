<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\BusinessTypeCategory;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        $businessTypeCategories = BusinessTypeCategory::query()
            ->with(['businessTypes' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order')])
            ->orderBy('sort_order')
            ->get()
            ->map(fn (BusinessTypeCategory $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'types' => $category->businessTypes
                    ->map(fn (BusinessType $type) => [
                        'id' => $type->id,
                        'name' => $type->name,
                    ])
                    ->values()
                    ->all(),
            ])
            ->filter(fn (array $c) => count($c['types']) > 0)
            ->values()
            ->all();

        return Inertia::render('Auth/Register', [
            'businessTypeCategories' => $businessTypeCategories,
        ]);
    }

    /**
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'business_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('businesses', 'name'),
            ],
            'slug' => 'required|string|max:255|unique:businesses,slug|regex:/^[a-z0-9-]+$/',
            'location' => 'nullable|string|max:255',
            'phone' => [
                'nullable',
                'regex:/^\+?[1-9]\d{7,14}$/',
            ],
            'logo' => 'nullable|image|max:2048',
            'also_works_as_staff' => ['sometimes', 'boolean'],
            'business_type_id' => [
                'required',
                'integer',
                Rule::exists('business_types', 'id')->where('is_active', true),
            ],
        ]);

        $validated['phone'] = isset($validated['phone'])
            ? preg_replace('/\s+/', '', $validated['phone'])
            : null;

        $logoPath = null;

        try {
            DB::transaction(function () use ($request, $validated, &$user, &$logoPath): void {
                if ($request->hasFile('logo')) {
                    $logoPath = $request->file('logo')->store('business-logos', 'public');
                }

                $user = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'password' => Hash::make($validated['password']),
                    'role' => UserRole::Admin,
                ]);

                $business = Business::create([
                    'owner_id' => $user->id,
                    'business_type_id' => (int) $validated['business_type_id'],
                    'name' => $validated['business_name'],
                    'slug' => $validated['slug'],
                    'location' => $validated['location'] ?? null,
                    'phone' => $validated['phone'],
                    'logo' => $logoPath,
                    'timezone' => 'UTC',
                    'currency' => 'EUR',
                    'currency_symbol' => '€',
                ]);

                if (! empty($validated['also_works_as_staff'])) {
                    $user->update([
                        'also_works_as_staff' => true,
                        'business_id' => $business->id,
                    ]);
                }
            });
        } catch (\Throwable $exception) {
            if ($logoPath !== null) {
                Storage::disk('public')->delete($logoPath);
            }

            throw $exception;
        }

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
