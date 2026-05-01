<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $locales = array_keys(config('locales.supported', []));
        $emailChanging = strtolower((string) $this->input('email')) !== strtolower((string) $this->user()->email);

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
            'current_password' => [
                Rule::requiredIf(fn () => $emailChanging),
                'current_password',
            ],
            'locale' => ['sometimes', 'string', Rule::in($locales)],
        ];
    }
}
