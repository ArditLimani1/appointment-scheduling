<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DeviceToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DeviceController extends Controller
{
    /**
     * Register (or refresh) an Expo push token for the current session.
     * Upserts by token: a token that changes hands moves to the new user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'expo_push_token' => ['required', 'string', 'max:255'],
            'platform' => ['required', Rule::in(['ios', 'android'])],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        DeviceToken::query()->updateOrCreate(
            ['expo_push_token' => $validated['expo_push_token']],
            [
                'user_id' => $request->user()->id,
                'platform' => $validated['platform'],
                'device_name' => $validated['device_name'] ?? null,
                'personal_access_token_id' => $request->user()->currentAccessToken()->id,
                'last_seen_at' => now(),
            ],
        );

        return response()->json(['message' => 'ok'], 201);
    }

    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'expo_push_token' => ['required', 'string', 'max:255'],
        ]);

        DeviceToken::query()
            ->where('user_id', $request->user()->id)
            ->where('expo_push_token', $validated['expo_push_token'])
            ->delete();

        return response()->json(['message' => 'ok']);
    }
}
