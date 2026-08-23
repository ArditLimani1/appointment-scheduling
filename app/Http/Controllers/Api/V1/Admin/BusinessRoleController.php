<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\Permission;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBusinessRoleRequest;
use App\Http\Requests\Admin\UpdateBusinessRoleRequest;
use App\Models\BusinessRole;
use App\Services\Interfaces\BusinessRoleServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessRoleController extends Controller
{
    public function __construct(
        private BusinessRoleServiceInterface $businessRoleService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $permissionGroups = $this->businessRoleService->permissionGroupsForUi();
        if (! $business->uses_shared_resources) {
            $permissionGroups['admin'] = array_values(array_filter(
                $permissionGroups['admin'],
                fn (array $p) => $p['value'] !== Permission::AdminSharedResources->value
            ));
        }

        return response()->json([
            'roles' => $this->businessRoleService->listForBusiness($business),
            'permissionGroups' => $permissionGroups,
        ]);
    }

    public function store(StoreBusinessRoleRequest $request): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $this->businessRoleService->store($business, $request->validated());

        return response()->json(['message' => __('messages.role.created')], 201);
    }

    public function update(UpdateBusinessRoleRequest $request, BusinessRole $role): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $this->businessRoleService->update($business, $role, $request->validated());

        return response()->json(['message' => __('messages.role.updated')]);
    }

    public function destroy(Request $request, BusinessRole $role): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $this->businessRoleService->delete($business, $role);

        return response()->json(['message' => __('messages.role.deleted')]);
    }
}
