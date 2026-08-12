<?php

namespace App\Http\Requests;

use App\Enums\CollectionMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
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
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['required', 'email', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:50'],
            'collection_method' => ['required', Rule::enum(CollectionMethod::class)],
            'pickup_date' => ['required_if:collection_method,pickup', 'nullable', 'date', 'after_or_equal:today'],
            'pickup_time' => ['required_if:collection_method,pickup', 'nullable', 'string', 'max:20'],
            'delivery_address' => ['required_if:collection_method,delivery_request', 'nullable', 'string', 'max:500'],
            'delivery_date' => ['required_if:collection_method,delivery_request', 'nullable', 'date', 'after_or_equal:today'],
            'delivery_time' => ['required_if:collection_method,delivery_request', 'nullable', 'string', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'payment_method' => ['required', 'in:cash_on_delivery,stripe'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ];
    }
}
