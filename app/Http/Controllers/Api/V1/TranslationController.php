<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Lang;
use Illuminate\Validation\Rule;

class TranslationController extends Controller
{
    /**
     * Lang groups the mobile app consumes. Web-only groups (welcome, mail,
     * onboarding, booking_ui, auth_pages) stay out of the payload.
     *
     * @var list<string>
     */
    private const GROUPS = [
        'admin', 'auth', 'common', 'components', 'employee',
        'errors', 'layout', 'messages', 'profile', 'request_messages', 'validation',
    ];

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'locale' => ['required', 'string', Rule::in(array_keys(config('locales.supported', [])))],
        ]);

        $locale = $validated['locale'];

        $translations = [];
        foreach (self::GROUPS as $group) {
            $lines = Lang::get($group, [], $locale);
            $translations[$group] = is_array($lines) ? $lines : [];
        }

        $etag = '"'.md5(json_encode($translations)).'"';

        if (trim((string) $request->header('If-None-Match')) === $etag) {
            return response()->json(null, 304)->setEtag(md5(json_encode($translations)));
        }

        return response()
            ->json(['locale' => $locale, 'translations' => $translations])
            ->setEtag(md5(json_encode($translations)));
    }
}
