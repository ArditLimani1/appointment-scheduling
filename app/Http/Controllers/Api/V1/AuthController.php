<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\LoginRequest;
use App\Http\Resources\Api\MeResource;
use App\Models\DeviceToken;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Exchange email + password for a Sanctum personal access token.
     * Mirrors the web LoginRequest rules: active user, verified email.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $request->ensureIsNotRateLimited();

        $user = User::query()
            ->where('email', $request->string('email')->lower()->toString())
            ->first();

        if (! $user || ! Hash::check($request->string('password'), $user->password) || ! $user->is_active) {
            RateLimiter::hit($request->throttleKey());

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($request->throttleKey());

        if ($user->requiresEmailVerification() && ! $user->hasVerifiedEmail()) {
            if (Cache::add('verification-login-resend:'.$user->getKey(), true, now()->addMinute())) {
                $user->sendEmailVerificationNotification();
            }

            return response()->json([
                'message' => __('request_messages.auth.email_not_verified'),
                'code' => 'email_unverified',
            ], 403);
        }

        // Super admins manage the platform on the web; the app is admin/employee only.
        if ($user->isSuperAdmin()) {
            return response()->json([
                'message' => trans('auth.failed'),
                'code' => 'unsupported_account',
            ], 403);
        }

        $token = $user->createToken($request->string('device_name')->toString());

        return response()->json([
            'token' => $token->plainTextToken,
            'me' => (new MeResource($user))->resolve($request),
        ], 201);
    }

    /**
     * Revoke the current token and any push registration bound to it.
     */
    public function logout(Request $request): JsonResponse
    {
        $accessToken = $request->user()->currentAccessToken();

        DeviceToken::query()
            ->where('user_id', $request->user()->id)
            ->where('personal_access_token_id', $accessToken->id)
            ->delete();

        $accessToken->delete();

        return response()->json(['message' => 'ok']);
    }
}
