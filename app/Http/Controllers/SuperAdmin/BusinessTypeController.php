<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\StoreBusinessTypeRequest;
use App\Http\Requests\SuperAdmin\UpdateBusinessTypeRequest;
use App\Models\BusinessType;
use App\Services\Interfaces\SuperAdmin\BusinessTypeManagementServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BusinessTypeController extends Controller
{
    public function __construct(
        private BusinessTypeManagementServiceInterface $service,
    ) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->get('search', ''));
        $categoryId = $request->get('category_id');

        return Inertia::render('SuperAdmin/BusinessTypes/Index', [
            'types' => $this->service->paginate($search !== '' ? $search : null, $categoryId ? (int) $categoryId : null, 20),
            'categories' => $this->service->categoriesForSelect(),
            'filters' => ['search' => $search, 'category_id' => $categoryId],
        ]);
    }

    public function store(StoreBusinessTypeRequest $request): RedirectResponse
    {
        $this->service->create($request->validated());

        return back()->with('success', 'Lloji i biznesit u krijua.');
    }

    public function update(UpdateBusinessTypeRequest $request, BusinessType $type): RedirectResponse
    {
        $this->service->update($type, $request->validated());

        return back()->with('success', 'Lloji i biznesit u përditësua.');
    }

    public function destroy(BusinessType $type): RedirectResponse
    {
        $label = $this->service->delete($type);

        if ($label === null) {
            return back()->with('error', 'Nuk mund të fshish një lloj që përdoret nga biznese.');
        }

        return back()->with('success', "Lloji \"{$label}\" u fshi.");
    }
}
