import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type PropsWithChildren,
} from 'react';
import type { Product } from '@/types/ratalfoods';
import { getEffectiveBasePrice } from '@/lib/product-pricing';

export type CartItem = {
    line_id: string;
    product_id: number;
    product_name: string;
    price: number;
    image_url: string | null;
    quantity: number;
    variant_label?: string | null;
};

type AddItemOptions = {
    quantity?: number;
    variantKey?: string;
    variantLabel?: string;
    unitPrice?: number;
};

type CartContextValue = {
    items: CartItem[];
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    addItem: (product: Product, options?: AddItemOptions) => void;
    removeItem: (lineId: string) => void;
    updateQuantity: (lineId: string, quantity: number) => void;
    clearCart: () => void;
    itemCount: number;
    subtotal: number;
};

const CART_STORAGE_KEY = 'ratalfoods_cart';

const CartContext = createContext<CartContextValue | null>(null);

function buildLineId(productId: number, variantKey?: string): string {
    return `${productId}:${variantKey ?? 'default'}`;
}

function readStoredCart(): CartItem[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const raw = window.localStorage.getItem(CART_STORAGE_KEY);
        if (!raw) {
            return [];
        }

        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.filter(
            (item): item is CartItem =>
                typeof item === 'object' &&
                item !== null &&
                typeof (item as CartItem).line_id === 'string' &&
                typeof (item as CartItem).product_id === 'number' &&
                typeof (item as CartItem).product_name === 'string' &&
                typeof (item as CartItem).price === 'number' &&
                typeof (item as CartItem).quantity === 'number',
        );
    } catch {
        return [];
    }
}

export function CartProvider({ children }: PropsWithChildren) {
    const [items, setItems] = useState<CartItem[]>(() => readStoredCart());
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const addItem = useCallback((product: Product, options?: AddItemOptions) => {
        const quantityToAdd = options?.quantity ?? 1;
        const price = options?.unitPrice ?? getEffectiveBasePrice(product);
        const lineId = buildLineId(product.id, options?.variantKey);
        const productName = options?.variantLabel
            ? `${product.name} (${options.variantLabel})`
            : product.name;

        setItems((prev) => {
            const existing = prev.find((item) => item.line_id === lineId);

            if (existing) {
                return prev.map((item) =>
                    item.line_id === lineId
                        ? { ...item, quantity: item.quantity + quantityToAdd }
                        : item,
                );
            }

            return [
                ...prev,
                {
                    line_id: lineId,
                    product_id: product.id,
                    product_name: productName,
                    price,
                    image_url: product.image_url,
                    quantity: quantityToAdd,
                    variant_label: options?.variantLabel ?? null,
                },
            ];
        });
        setIsOpen(true);
    }, []);

    const removeItem = useCallback((lineId: string) => {
        setItems((prev) => prev.filter((item) => item.line_id !== lineId));
    }, []);

    const updateQuantity = useCallback((lineId: string, quantity: number) => {
        if (quantity <= 0) {
            setItems((prev) => prev.filter((item) => item.line_id !== lineId));
            return;
        }

        setItems((prev) =>
            prev.map((item) => (item.line_id === lineId ? { ...item, quantity } : item)),
        );
    }, []);

    const clearCart = useCallback(() => setItems([]), []);

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                isOpen,
                setIsOpen,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                itemCount,
                subtotal,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart(): CartContextValue {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }

    return context;
}
