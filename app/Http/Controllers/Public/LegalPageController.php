<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\PageContent;
use App\Models\StoreSetting;
use Inertia\Inertia;
use Inertia\Response;

class LegalPageController extends Controller
{
    public function faq(): Response
    {
        return Inertia::render('public/Faq', [
            'pageContent' => $this->content('faq'),
        ]);
    }

    public function privacy(): Response
    {
        return $this->document('privacy');
    }

    public function terms(): Response
    {
        return $this->document('terms');
    }

    public function refund(): Response
    {
        return $this->document('refund');
    }

    private function document(string $slug): Response
    {
        return Inertia::render('public/LegalPage', [
            'pageContent' => $this->content($slug),
        ]);
    }

    /**
     * Stored content with the store details filled in, so the text never goes
     * stale when the phone number or address changes.
     *
     * @return array<string, mixed>
     */
    private function content(string $slug): array
    {
        $store = StoreSetting::current();

        $tokens = [
            '{store_name}' => $store->store_name,
            '{store_email}' => $store->email,
            '{store_phone}' => $store->phone,
            '{store_address}' => $store->address,
        ];

        $fill = function (mixed $value) use (&$fill, $tokens): mixed {
            if (is_string($value)) {
                return strtr($value, $tokens);
            }

            return is_array($value) ? array_map($fill, $value) : $value;
        };

        return $fill(PageContent::resolved($slug));
    }
}
