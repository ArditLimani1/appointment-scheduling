<?php

namespace App\Http\Requests\Admin;

use App\Models\SharedResource;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $business = $this->user()?->panelBusiness();
        if ($business && ! $business->uses_shared_resources) {
            $this->merge(['resources' => []]);
        }
    }

    public function rules(): array
    {
        $businessId = $this->user()->panelBusiness()?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'duration' => ['required', 'integer', 'min:5'],
            'price' => ['required', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'is_popular' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer'],
            'resources' => ['nullable', 'array'],
            'resources.*.resource_id' => [
                'required',
                'integer',
                Rule::exists('shared_resources', 'id')->where(fn ($q) => $q->where('business_id', $businessId)),
            ],
            'resources.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $rows = $this->input('resources');
            if (! is_array($rows) || $rows === []) {
                return;
            }

            $ids = [];
            foreach ($rows as $i => $row) {
                $rid = (int) ($row['resource_id'] ?? 0);
                if ($rid > 0) {
                    $ids[] = $rid;
                }
                $qty = (int) ($row['quantity'] ?? 0);
                $resource = $rid > 0 ? SharedResource::query()->whereKey($rid)->first() : null;
                if ($resource && $qty > $resource->capacity) {
                    $validator->errors()->add(
                        "resources.$i.quantity",
                        __('request_messages.service.resource_quantity')
                    );
                }
            }

            if (count($ids) !== count(array_unique($ids))) {
                $validator->errors()->add('resources', __('request_messages.service.resource_duplicate'));
            }
        });
    }
}
