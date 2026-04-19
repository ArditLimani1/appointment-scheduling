<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Interfaces\SuperAdmin\UserAdministrationServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(
        private UserAdministrationServiceInterface $service,
    ) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->get('search', ''));
        $role = $request->get('role');

        return Inertia::render('SuperAdmin/Users/Index', [
            'users' => $this->service->paginateTenants($search !== '' ? $search : null, $role, 20),
            'filters' => ['search' => $search, 'role' => $role],
        ]);
    }

    public function sendPasswordReset(User $user): RedirectResponse
    {
        $this->service->sendPasswordReset($user);

        return back()->with('success', "Lidhja për rivendosjen e fjalëkalimit u dërgua në {$user->email}.");
    }

    public function impersonate(Request $request, User $user): RedirectResponse
    {
        $this->service->impersonate($request->user(), $user);

        return redirect('/dashboard');
    }

    public function stopImpersonating(): RedirectResponse
    {
        $this->service->stopImpersonating();

        return redirect()->route('super-admin.dashboard');
    }
}
