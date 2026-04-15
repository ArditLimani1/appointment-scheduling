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
        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);
        $services = $this->serviceService->getServices($business);

        return Inertia::render('Admin/Services/Index', [
            'services' => $services,
            'sharedResources' => $business->sharedResources()->orderBy('name')->get(),
        ]);
    }

    public function store(StoreServiceRequest $request): RedirectResponse
    {
        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);
        $this->serviceService->store($business, $request->validated());

        return redirect()->back()
            ->with('success', 'Service created successfully.')
            ->with('flash_nonce', uniqid('', true));
    }

    public function update(UpdateServiceRequest $request, Service $service): RedirectResponse
    {
        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);
        $this->serviceService->update($business, $service, $request->validated());

        return redirect()->back()
            ->with('success', 'Service updated successfully.')
            ->with('flash_nonce', uniqid('', true));
    }

    public function destroy(Service $service): RedirectResponse
    {
        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);
        $this->serviceService->delete($business, $service);

        return redirect()->back()
            ->with('success', 'Service deleted successfully.')
            ->with('flash_nonce', uniqid('', true));
    }
}
