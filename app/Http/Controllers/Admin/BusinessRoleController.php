<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBusinessRoleRequest;
use App\Http\Requests\Admin\UpdateBusinessRoleRequest;
use App\Models\BusinessRole;
use App\Services\Interfaces\BusinessRoleServiceInterface;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BusinessRoleController extends Controller
{
    public function __construct(
        private BusinessRoleServiceInterface $businessRoleService,
    ) {}

    public function index(): Response
    {
        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);

        return Inertia::render('Admin/Roles/Index', [
            'roles' => $this->businessRoleService->listForBusiness($business),
            'permissionGroups' => $this->businessRoleService->permissionGroupsForUi(),
        ]);
    }

    public function store(StoreBusinessRoleRequest $request): RedirectResponse
    {
        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);
        $this->businessRoleService->store($business, $request->validated());

        return redirect()->back()
            ->with('success', 'Role created successfully.')
            ->with('flash_nonce', uniqid('', true));
    }

    public function update(UpdateBusinessRoleRequest $request, BusinessRole $role): RedirectResponse
    {
        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);
        $this->businessRoleService->update($business, $role, $request->validated());

        return redirect()->back()
            ->with('success', 'Role updated successfully.')
            ->with('flash_nonce', uniqid('', true));
    }

    public function destroy(BusinessRole $role): RedirectResponse
    {
        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);
        $this->businessRoleService->delete($business, $role);

        return redirect()->back()
            ->with('success', 'Role deleted successfully.')
            ->with('flash_nonce', uniqid('', true));
    }
}
