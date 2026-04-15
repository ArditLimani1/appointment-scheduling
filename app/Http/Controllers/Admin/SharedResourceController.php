<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSharedResourceRequest;
use App\Http\Requests\Admin\UpdateSharedResourceRequest;
use App\Models\SharedResource;
use App\Services\Interfaces\SharedResourceServiceInterface;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SharedResourceController extends Controller
{
    public function __construct(
        private SharedResourceServiceInterface $sharedResourceService,
    ) {}

    public function index(): Response
    {
        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);
        $resources = $this->sharedResourceService->getResources($business);

        return Inertia::render('Admin/Resources/Index', [
            'resources' => $resources,
        ]);
    }

    public function store(StoreSharedResourceRequest $request): RedirectResponse
    {
        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);
        $this->sharedResourceService->store($business, $request->validated());

        return redirect()->back()
            ->with('success', 'Resource created successfully.')
            ->with('flash_nonce', uniqid('', true));
    }

    public function update(UpdateSharedResourceRequest $request, SharedResource $sharedResource): RedirectResponse
    {
        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);
        $this->sharedResourceService->update($business, $sharedResource, $request->validated());

        return redirect()->back()
            ->with('success', 'Resource updated successfully.')
            ->with('flash_nonce', uniqid('', true));
    }

    public function destroy(SharedResource $sharedResource): RedirectResponse
    {
        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);
        $this->sharedResourceService->delete($business, $sharedResource);

        return redirect()->back()
            ->with('success', 'Resource deleted successfully.')
            ->with('flash_nonce', uniqid('', true));
    }
}
