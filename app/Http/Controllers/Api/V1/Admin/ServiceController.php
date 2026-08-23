<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreServiceRequest;
use App\Http\Requests\Admin\UpdateServiceRequest;
use App\Models\Service;
use App\Services\Interfaces\ServiceServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function __construct(
        private ServiceServiceInterface $serviceService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        return response()->json([
            'services' => $this->serviceService->getServices($business),
            'sharedResources' => $business->uses_shared_resources
                ? $business->sharedResources()->orderBy('name')->get()
                : collect(),
        ]);
    }

    public function store(StoreServiceRequest $request): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $this->serviceService->store($business, $request->validated());

        return response()->json(['message' => __('messages.service.created')], 201);
    }

    public function update(UpdateServiceRequest $request, Service $service): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $this->serviceService->update($business, $service, $request->validated());

        return response()->json(['message' => __('messages.service.updated')]);
    }

    public function destroy(Request $request, Service $service): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $this->serviceService->delete($business, $service);

        return response()->json(['message' => __('messages.service.deleted')]);
    }
}
