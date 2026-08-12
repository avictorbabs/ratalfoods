<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class DeliveryFeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'match_terms' => ['required', 'string', 'max:2000'],
            'fee' => ['required', 'numeric', 'min:0', 'max:9999.99'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array{name: string, match_terms: string, fee: float, is_active: bool, sort_order: int}
     */
    public function feeAttributes(): array
    {
        return [
            'name' => $this->string('name')->toString(),
            'match_terms' => $this->string('match_terms')->toString(),
            'fee' => (float) $this->input('fee'),
            'is_active' => $this->boolean('is_active', true),
            'sort_order' => 0,
        ];
    }
}
