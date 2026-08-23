<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreEmployeeRequest;
use App\Http\Requests\Admin\UpdateEmployeeRequest;
use App\Models\User;
use App\Services\Interfaces\EmployeeServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function __construct(
        private EmployeeServiceInterface $employeeService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $data = $this->employeeService->getEmployeesWithServices($business);
        $data['businessRoles'] = $business->businessRoles()->orderBy('name')->get();
        $data['businessOwnerId'] = $business->owner_id;

        return response()->json($data);
    }

    public function store(StoreEmployeeRequest $request): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $this->employeeService->store($business, $request->validated());

        return response()->json(['message' => __('messages.employee.created')], 201);
    }

    public function update(UpdateEmployeeRequest $request, User $employee): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $this->employeeService->update($business, $employee, $request->validated());

        return response()->json(['message' => __('messages.employee.updated')]);
    }

    public function destroy(Request $request, User $employee): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $data = $request->validate([
            'delete_appointments' => ['required', 'boolean'],
        ]);

        $this->employeeService->delete($business, $employee, $data['delete_appointments']);

        return response()->json(['message' => __('messages.employee.deleted')]);
    }
}
