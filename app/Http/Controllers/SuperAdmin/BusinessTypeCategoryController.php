<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\StoreBusinessTypeCategoryRequest;
use App\Http\Requests\SuperAdmin\UpdateBusinessTypeCategoryRequest;
use App\Models\BusinessTypeCategory;
use App\Services\Interfaces\SuperAdmin\BusinessTypeCategoryManagementServiceInterface;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BusinessTypeCategoryController extends Controller
{
    public function __construct(
        private BusinessTypeCategoryManagementServiceInterface $service,
    ) {}

    public function index(): Response
    {
        return Inertia::render('SuperAdmin/BusinessTypeCategories/Index', [
            'categories' => $this->service->listAll(),
        ]);
    }

    public function store(StoreBusinessTypeCategoryRequest $request): RedirectResponse
    {
        $this->service->create($request->validated());

        return back()->with('success', 'Kategoria u krijua.');
    }

    public function update(UpdateBusinessTypeCategoryRequest $request, BusinessTypeCategory $category): RedirectResponse
    {
        $this->service->update($category, $request->validated());

        return back()->with('success', 'Kategoria u përditësua.');
    }

    public function destroy(BusinessTypeCategory $category): RedirectResponse
    {
        $label = $this->service->delete($category);

        if ($label === null) {
            return back()->with('error', 'Nuk mund të fshish një kategori që ka lloje biznesi.');
        }

        return back()->with('success', "Kategoria \"{$label}\" u fshi.");
    }
}
