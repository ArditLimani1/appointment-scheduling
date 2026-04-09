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
use Illuminate\Support\Facades\Hash;
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
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'business_name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:businesses,slug|regex:/^[a-z0-9-]+$/',
            'location' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'logo' => 'nullable|image|max:2048',
            'also_works_as_staff' => ['sometimes', 'boolean'],
            'business_type_id' => [
                'required',
                'integer',
                Rule::exists('business_types', 'id')->where('is_active', true),
            ],
        ]);

        $logoPath = $request->hasFile('logo')
            ? $request->file('logo')->store('business-logos', 'public')
            : null;

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => UserRole::Admin,
        ]);

        $business = Business::create([
            'owner_id' => $user->id,
            'business_type_id' => (int) $request->business_type_id,
            'name' => $request->business_name,
            'slug' => $request->slug,
            'location' => $request->location,
            'phone' => $request->phone,
            'logo' => $logoPath,
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
        ]);

        if ($request->boolean('also_works_as_staff')) {
            $user->update([
                'also_works_as_staff' => true,
                'business_id' => $business->id,
            ]);
        }

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
