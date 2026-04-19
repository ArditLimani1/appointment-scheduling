<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $supported = array_keys(config('locales.supported', []));

        $fromQuery = $request->query('lang');
        if (is_string($fromQuery) && in_array($fromQuery, $supported, true)) {
            $request->session()->put('locale', $fromQuery);
        }

        $locale = null;

        if ($request->user() && filled($request->user()->locale)) {
            $locale = $request->user()->locale;
        }

        if ($locale === null || ! in_array($locale, $supported, true)) {
            $sessionLocale = $request->session()->get('locale');
            if (is_string($sessionLocale) && in_array($sessionLocale, $supported, true)) {
                $locale = $sessionLocale;
            }
        }

        if ($locale === null || ! in_array($locale, $supported, true)) {
            $locale = config('app.locale');
        }

        if (! in_array($locale, $supported, true)) {
            $locale = 'sq';
        }

        App::setLocale($locale);

        return $next($request);
    }
}
