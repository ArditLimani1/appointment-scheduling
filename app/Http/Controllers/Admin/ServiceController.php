<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreServiceRequest;
use App\Http\Requests\Admin\UpdateServiceRequest;
use App\Models\Service;
use App\Services\Interfaces\ServiceServiceInterface;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function __construct(
        private ServiceServiceInterface $serviceService,
    ) {}

    public function index(): Response
    {
        $business = auth()->user()->ownedBusiness;
        $services = $this->serviceService->getServices($business);

        return Inertia::render('Admin/Services/Index', [
            'services' => $services,
        ]);
    }

    public function store(StoreServiceRequest $request): RedirectResponse
    {
        $business = auth()->user()->ownedBusiness;
        $this->serviceService->store($business, $request->validated());

        return redirect()->back()->with('success', 'Service created successfully.');
    }

    public function update(UpdateServiceRequest $request, Service $service): RedirectResponse
    {
        $business = auth()->user()->ownedBusiness;
        $this->serviceService->update($business, $service, $request->validated());

        return redirect()->back()->with('success', 'Service updated successfully.');
    }

    public function destroy(Service $service): RedirectResponse
    {
        $business = auth()->user()->ownedBusiness;
        $this->serviceService->delete($business, $service);

        return redirect()->back()->with('success', 'Service deleted successfully.');
    }
}
