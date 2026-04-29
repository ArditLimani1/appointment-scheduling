<?php

namespace App\Support;

/**
 * Validates a candidate "return_to" path submitted from the frontend so that
 * server-side redirects after internal admin/employee actions cannot be
 * abused for open-redirect attacks.
 *
 * Only relative paths under /admin or /employee are accepted; anything else
 * (absolute URLs, protocol-relative URLs, javascript: URIs, paths to public
 * routes like /book or /login, …) falls back to the supplied default.
 */
final class InternalRedirect
{
    private const MAX_LENGTH = 2048;

    public static function resolve(?string $candidate, string $fallback): string
    {
        if (! is_string($candidate) || $candidate === '') {
            return $fallback;
        }

        $value = trim($candidate);
        if ($value === '') {
            return $fallback;
        }

        if (str_contains($value, '://')) {
            return $fallback;
        }

        if (str_starts_with($value, '//')) {
            return $fallback;
        }

        if (! str_starts_with($value, '/')) {
            return $fallback;
        }

        $pathOnly = explode('?', $value, 2)[0];
        $pathOnly = explode('#', $pathOnly, 2)[0];

        $allowedPrefixes = ['/admin', '/employee'];
        $allowed = false;
        foreach ($allowedPrefixes as $prefix) {
            if ($pathOnly === $prefix || str_starts_with($pathOnly, $prefix.'/')) {
                $allowed = true;
                break;
            }
        }

        if (! $allowed) {
            return $fallback;
        }

        return mb_substr($value, 0, self::MAX_LENGTH);
    }
}
