<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
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
            'also_works_as_staff' => ['sometimes', 'boolean'],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => UserRole::Admin,
        ]);

        $business = Business::create([
            'owner_id' => $user->id,
            'name' => $request->business_name,
            'slug' => $request->slug,
            'location' => $request->location,
            'phone' => $request->phone,
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
