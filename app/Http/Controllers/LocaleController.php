<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

class LocaleController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $supported = array_keys(config('locales.supported', []));

        $validated = $request->validate([
            'locale' => ['required', 'string', 'in:'.implode(',', $supported)],
        ]);

        $locale = $validated['locale'];

        $request->session()->put('locale', $locale);

        if ($request->user()) {
            $request->user()->forceFill(['locale' => $locale])->save();
        }

        App::setLocale($locale);

        return redirect()->back();
    }
}
