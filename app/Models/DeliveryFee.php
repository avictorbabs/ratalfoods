<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class DeliveryFee extends Model
{
    protected $fillable = [
        'name',
        'match_terms',
        'fee',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'fee' => 'decimal:2',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @return list<string>
     */
    public function terms(): array
    {
        return collect(preg_split('/[,;\n]+/', (string) $this->match_terms) ?: [])
            ->map(fn (string $term) => trim($term))
            ->filter()
            ->values()
            ->all();
    }

    /**
     * Find the best matching active delivery zone for an address.
     * Prefers the longest matching term.
     */
    public static function resolveForAddress(?string $address): ?self
    {
        $normalizedAddress = mb_strtolower(trim((string) $address));

        if ($normalizedAddress === '') {
            return null;
        }

        /** @var Collection<int, self> $zones */
        $zones = static::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $bestMatch = null;
        $bestTermLength = 0;

        foreach ($zones as $zone) {
            foreach ($zone->terms() as $term) {
                $normalizedTerm = mb_strtolower($term);

                if ($normalizedTerm === '' || ! str_contains($normalizedAddress, $normalizedTerm)) {
                    continue;
                }

                $termLength = mb_strlen($normalizedTerm);

                if ($bestMatch === null || $termLength > $bestTermLength) {
                    $bestMatch = $zone;
                    $bestTermLength = $termLength;
                }
            }
        }

        return $bestMatch;
    }
}
