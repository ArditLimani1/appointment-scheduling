<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Services\Interfaces\SuperAdmin\AuditLogQueryServiceInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function __construct(
        private AuditLogQueryServiceInterface $service,
    ) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->get('search', ''));
        $action = $request->get('action');
        $actorId = $request->get('actor_id');

        return Inertia::render('SuperAdmin/AuditLogs/Index', [
            'logs' => $this->service->paginate(
                $search !== '' ? $search : null,
                $action,
                $actorId ? (int) $actorId : null,
                50,
            ),
            'actions' => $this->service->availableActions(),
            'filters' => ['search' => $search, 'action' => $action, 'actor_id' => $actorId],
        ]);
    }
}
