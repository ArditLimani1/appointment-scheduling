<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpFoundation\RedirectResponse;

class NotificationController extends Controller
{
    public function feed(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'scope' => 'sometimes|in:unread,all',
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:30',
        ]);

        $scope = $validated['scope'] ?? 'unread';
        if (! in_array($scope, ['unread', 'all'], true)) {
            $scope = 'unread';
        }

        $page = max(1, (int) ($validated['page'] ?? 1));
        $perPage = min(30, max(1, (int) ($validated['per_page'] ?? 10)));

        $paginator = $this->paginateNotifications($request->user(), $scope, $page, $perPage);

        return response()->json([
            'data' => $paginator->getCollection()
                ->map(fn (DatabaseNotification $n) => $this->serializeNotification($n))
                ->values()
                ->all(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
            ],
        ]);
    }

    public function markRead(Request $request, string $id): RedirectResponse
    {
        $notification = $request->user()->notifications()->whereKey($id)->first();
        if ($notification !== null && $notification->read_at === null) {
            $notification->markAsRead();
        }

        return back();
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return back();
    }

    /**
     * @return LengthAwarePaginator<int, DatabaseNotification>
     */
    private function paginateNotifications(User $user, string $scope, int $page, int $perPage): LengthAwarePaginator
    {
        $query = $user->notifications()->latest();
        if ($scope === 'unread') {
            $query->whereNull('read_at');
        }

        return $query->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * @return array{id: string, read_at: string|null, data: array<string, mixed>, created_at: string}
     */
    private function serializeNotification(DatabaseNotification $n): array
    {
        return [
            'id' => $n->id,
            'read_at' => $n->read_at?->toIso8601String(),
            'data' => $n->data ?? [],
            'created_at' => $n->created_at->toIso8601String(),
        ];
    }
}
