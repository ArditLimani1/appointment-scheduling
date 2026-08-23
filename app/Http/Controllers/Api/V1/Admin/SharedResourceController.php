<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSharedResourceRequest;
use App\Http\Requests\Admin\UpdateSharedResourceRequest;
use App\Models\SharedResource;
use App\Services\Interfaces\SharedResourceServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SharedResourceController extends Controller
{
    public function __construct(
        private SharedResourceServiceInterface $sharedResourceService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        return response()->json([
            'resources' => $this->sharedResourceService->getResources($business),
        ]);
    }

    public function store(StoreSharedResourceRequest $request): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $this->sharedResourceService->store($business, $request->validated());

        return response()->json(['message' => __('messages.resource.created')], 201);
    }

    public function update(UpdateSharedResourceRequest $request, SharedResource $sharedResource): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $this->sharedResourceService->update($business, $sharedResource, $request->validated());

        return response()->json(['message' => __('messages.resource.updated')]);
    }

    public function destroy(Request $request, SharedResource $sharedResource): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $this->sharedResourceService->delete($business, $sharedResource);

        return response()->json(['message' => __('messages.resource.deleted')]);
    }
}
