import { Link } from '@inertiajs/react';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart-store';
import { formatPrice } from '@/lib/price';

export default function CartDrawer() {
    const { items, isOpen, setIsOpen, removeItem, updateQuantity, subtotal, itemCount } = useCart();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-md flex-col bg-background shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-border p-6">
                            <h2 className="font-heading text-xl">
                                Your Cart{' '}
                                <span className="font-body text-sm text-muted-foreground">
                                    ({itemCount})
                                </span>
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="rounded-md p-1.5 transition-colors hover:bg-muted"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {items.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
                                <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                                <p className="text-center font-body text-muted-foreground">
                                    Your cart is empty
                                </p>
                                <Button variant="outline" asChild onClick={() => setIsOpen(false)}>
                                    <Link href="/menu">Browse Menu</Link>
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 space-y-4 overflow-y-auto p-6">
                                    {items.map((item) => (
                                        <div key={item.line_id} className="group flex gap-4">
                                            {item.image_url && (
                                                <img
                                                    src={item.image_url}
                                                    alt={item.product_name}
                                                    className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
                                                />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <h4 className="truncate font-body text-sm font-medium">
                                                    {item.product_name}
                                                </h4>
                                                <p className="mt-0.5 font-body text-sm font-semibold text-primary">
                                                    ${formatPrice(item.price)}
                                                </p>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateQuantity(
                                                                item.line_id,
                                                                item.quantity - 1,
                                                            )
                                                        }
                                                        className="flex h-6 w-6 items-center justify-center rounded border border-border transition-colors hover:bg-muted"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="w-6 text-center font-body text-sm">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateQuantity(
                                                                item.line_id,
                                                                item.quantity + 1,
                                                            )
                                                        }
                                                        className="flex h-6 w-6 items-center justify-center rounded border border-border transition-colors hover:bg-muted"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(item.line_id)}
                                                        className="ml-auto text-xs text-muted-foreground opacity-0 transition-colors group-hover:opacity-100 hover:text-destructive"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4 border-t border-border p-6">
                                    <div className="flex justify-between font-body">
                                        <span className="text-sm text-muted-foreground">Subtotal</span>
                                        <span className="font-semibold">${formatPrice(subtotal)}</span>
                                    </div>
                                    <p className="font-body text-xs text-muted-foreground">
                                        Tax calculated at checkout
                                    </p>
                                    <Button
                                        className="h-12 w-full font-body text-sm tracking-wide uppercase"
                                        asChild
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <Link href="/checkout">Proceed to Checkout</Link>
                                    </Button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
