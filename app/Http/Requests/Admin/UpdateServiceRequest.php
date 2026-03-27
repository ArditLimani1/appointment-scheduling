<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'duration' => ['required', 'integer', 'min:5'],
            'price' => ['required', 'numeric', 'min:0'],
            'icon' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
            'is_popular' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer'],
        ];
    }
}
