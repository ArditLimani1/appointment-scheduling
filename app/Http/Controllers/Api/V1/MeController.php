<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProfileUpdateRequest;
use App\Http\Resources\Api\MeResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class MeController extends Controller
{
    public function show(Request $request): MeResource
    {
        return new MeResource($request->user());
    }

    public function update(ProfileUpdateRequest $request): MeResource
    {
        $user = $request->user();

        $user->fill($request->validated());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        if ($user->requiresEmailVerification() && ! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        return new MeResource($user->fresh());
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $user = $request->user();
        $user->update(['password' => $validated['password']]);

        // New password invalidates every other device's session.
        $currentTokenId = $user->currentAccessToken()->id;
        $user->tokens()->whereKeyNot($currentTokenId)->delete();

        return response()->json(['message' => 'ok']);
    }

    public function updateLocale(Request $request): MeResource
    {
        $validated = $request->validate([
            'locale' => ['required', 'string', Rule::in(array_keys(config('locales.supported', [])))],
        ]);

        $request->user()->update(['locale' => $validated['locale']]);

        return new MeResource($request->user()->fresh());
    }
}
