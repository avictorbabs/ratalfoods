import { router, usePage } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getProductPricing } from '@/lib/product-pricing';
import ProductPriceDisplay from '@/components/products/product-price-display';
import type { SharedData } from '@/types/ratalfoods';

type InlineSearchProps = {
    open: boolean;
    onClose: () => void;
};

export default function InlineSearch({ open, onClose }: InlineSearchProps) {
    const { searchProducts } = usePage<SharedData>().props;
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
        }
    }, [open]);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClick);
        }

        return () => document.removeEventListener('mousedown', handleClick);
    }, [open, onClose]);

    const results = useMemo(() => {
        const trimmed = query.trim().toLowerCase();

        if (!trimmed) {
            return [];
        }

        return searchProducts
            .filter(
                (product) =>
                    product.name.toLowerCase().includes(trimmed) ||
                    product.category.toLowerCase().includes(trimmed),
            )
            .slice(0, 6);
    }, [query, searchProducts]);

    const handleSelect = (id: number) => {
        router.visit(`/menu/${id}`);
        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    ref={containerRef}
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-0 right-0 bottom-0 left-0 z-10 flex items-center bg-background px-4 sm:px-6 lg:px-8"
                >
                    <div className="relative mx-auto flex w-full max-w-7xl flex-1 items-center gap-3">
                        <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search Products"
                            className="flex-1 border-b border-border bg-transparent py-1 font-body text-sm text-foreground outline-none placeholder:text-muted-foreground"
                        />
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <AnimatePresence>
                            {results.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 4 }}
                                    className="absolute top-full right-8 left-0 z-50 mt-2 overflow-hidden rounded-md border border-border bg-card shadow-lg"
                                >
                                    {results.map((product) => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onMouseDown={() => handleSelect(product.id)}
                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted"
                                        >
                                            {product.image_url && (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="h-8 w-8 flex-shrink-0 rounded-sm object-cover"
                                                />
                                            )}
                                            <div className="min-w-0">
                                                <p className="truncate font-body text-sm">
                                                    {product.name}
                                                </p>
                                                <p className="font-body text-xs text-muted-foreground">
                                                    {product.category}
                                                </p>
                                            </div>
                                            <ProductPriceDisplay
                                                pricing={getProductPricing(product)}
                                                size="sm"
                                                className="ml-auto"
                                            />
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
