<?php

namespace App\Support;

use App\Models\PageContent;
use App\Models\StoreSetting;

class PickupInfo
{
    /**
     * The store hours / ready time box shown at checkout. Wording is edited on the
     * Menu page in the admin; blank hours or ready time fall back to Store Settings.
     *
     * @param  array<string, mixed>|null  $content  Menu page content (loaded when null)
     * @return array{heading: string, hours: string, ready_label: string, ready_time: string, note: string, lead_hours: int}
     */
    public static function resolve(?array $content = null): array
    {
        $info = ($content ?? PageContent::resolved('menu'))['pickup_info'] ?? [];
        $store = StoreSetting::current();

        $text = fn (string $key, string $fallback = ''): string => trim((string) ($info[$key] ?? '')) !== '' ? trim((string) $info[$key]) : $fallback;

        return [
            'heading' => $text('heading', 'Store Hours'),
            'hours' => $text('hours', (string) $store->opening_hours),
            'ready_label' => $text('ready_label', 'Typical ready time'),
            'ready_time' => $text('ready_time', (string) $store->pickup_message),
            'note' => $text('note'),
            'lead_hours' => is_numeric($info['lead_hours'] ?? null) ? max(0, min(720, (int) $info['lead_hours'])) : 24,
        ];
    }
}
