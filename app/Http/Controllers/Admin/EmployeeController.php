<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreEmployeeRequest;
use App\Http\Requests\Admin\UpdateEmployeeRequest;
use App\Models\User;
use App\Services\Interfaces\EmployeeServiceInterface;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    public function __construct(
        private EmployeeServiceInterface $employeeService,
    ) {}

    public function index(): Response
    {
        $business = auth()->user()->ownedBusiness;
        $data = $this->employeeService->getEmployeesWithServices($business);

        return Inertia::render('Admin/Employees/Index', $data);
    }

    public function store(StoreEmployeeRequest $request): RedirectResponse
    {
        $business = auth()->user()->ownedBusiness;
        $this->employeeService->store($business, $request->validated());

        return redirect()->back()->with('success', 'Employee created successfully.');
    }

    public function update(UpdateEmployeeRequest $request, User $employee): RedirectResponse
    {
        $business = auth()->user()->ownedBusiness;
        $this->employeeService->update($business, $employee, $request->validated());

        return redirect()->back()->with('success', 'Employee updated successfully.');
    }

    public function destroy(User $employee): RedirectResponse
    {
        $business = auth()->user()->ownedBusiness;
        $this->employeeService->delete($business, $employee);

        return redirect()->back()->with('success', 'Employee deleted successfully.');
    }
}
