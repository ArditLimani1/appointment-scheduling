<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\UpdateBusinessRequest;
use App\Models\Business;
use App\Services\Interfaces\SuperAdmin\BusinessAdministrationServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BusinessController extends Controller
{
    public function __construct(
        private BusinessAdministrationServiceInterface $service,
    ) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->get('search', ''));
        $status = $request->get('status');

        return Inertia::render('SuperAdmin/Businesses/Index', [
            'businesses' => $this->service->paginate($search !== '' ? $search : null, $status, 20),
            'filters' => ['search' => $search, 'status' => $status],
        ]);
    }

    public function show(Business $business): Response
    {
        return Inertia::render('SuperAdmin/Businesses/Show', $this->service->detailsFor($business));
    }

    public function update(UpdateBusinessRequest $request, Business $business): RedirectResponse
    {
        $this->service->update($business, $request->validated());

        return back()->with('success', 'Business configuration saved.');
    }

    public function toggleSuspend(Business $business): RedirectResponse
    {
        $business = $this->service->toggleSuspension($business);

        return back()->with('success', $business->is_active ? 'Biznesi u aktivizua.' : 'Biznesi u pezullua.');
    }

    public function destroy(Business $business): RedirectResponse
    {
        $label = $this->service->delete($business);

        return redirect()->route('super-admin.businesses.index')
            ->with('success', "Biznesi \"{$label}\" u fshi.");
    }
}
