<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Services\Interfaces\SuperAdmin\PlatformDashboardServiceInterface;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private PlatformDashboardServiceInterface $service,
    ) {}

    public function index(): Response
    {
        return Inertia::render('SuperAdmin/Dashboard', $this->service->overview());
    }
}
