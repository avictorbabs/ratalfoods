import { Link, router } from '@inertiajs/react';
import { Copy, Eye, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatPrice } from '@/lib/price';
import { truncateText } from '@/lib/text';

export type AdminProduct = {
    id: number;
    name: string;
    description: string | null;
    category: string;
    price: string;
    sale_price?: string | null;
    image_url: string | null;
    gallery?: { type: 'image' | 'video'; url: string }[] | null;
    is_active: boolean;
    in_stock: boolean;
    stock_quantity: number;
    is_featured: boolean;
    available_for_pickup?: boolean;
    preparation_time?: string;
    serves?: string | null;
    tags?: string[] | null;
    variations?: import('@/types/ratalfoods').ProductVariation[] | null;
};

type ProductsTableProps = {
    products: AdminProduct[];
};

function ProductThumbnail({ product }: { product: AdminProduct }) {
    if (product.image_url) {
        return (
            <img
                src={product.image_url}
                alt={product.name}
                className="h-12 w-12 shrink-0 rounded-md object-cover"
            />
        );
    }

    return (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted font-body text-xs text-muted-foreground">
            No img
        </div>
    );
}

function stockLabel(product: AdminProduct): string {
    const count = product.stock_quantity ?? 0;
    if (product.in_stock && count > 0) {
        return `In stock (${count})`;
    }

    return `Out of stock (${count})`;
}

export default function ProductsTable({ products }: ProductsTableProps) {
    const [viewProduct, setViewProduct] = useState<AdminProduct | null>(null);
    const [deleteProduct, setDeleteProduct] = useState<AdminProduct | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [duplicatingId, setDuplicatingId] = useState<number | null>(null);

    const confirmDelete = () => {
        if (!deleteProduct) {
            return;
        }

        setDeleting(true);
        router.delete(`/admin/products/${deleteProduct.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteProduct(null);
            },
        });
    };

    const duplicateProduct = (product: AdminProduct) => {
        setDuplicatingId(product.id);
        router.post(
            `/admin/products/${product.id}/duplicate`,
            {},
            {
                onFinish: () => setDuplicatingId(null),
            },
        );
    };

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[960px]">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            <th className="px-6 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Product
                            </th>
                            <th className="px-6 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Promotion
                            </th>
                            <th className="px-6 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Stock
                            </th>
                            <th className="px-6 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Category
                            </th>
                            <th className="px-6 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Price
                            </th>
                            <th className="px-6 py-3 text-right font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-muted/20">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <ProductThumbnail product={product} />
                                        <div className="min-w-0">
                                            <p
                                                className="font-body text-sm font-medium text-foreground"
                                                title={product.name}
                                            >
                                                {truncateText(product.name)}
                                            </p>
                                            {!product.is_active && (
                                                <span className="mt-1 inline-block rounded-sm bg-gray-100 px-1.5 py-0.5 font-body text-[10px] uppercase tracking-wider text-gray-600">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {product.is_featured ? (
                                        <span className="inline-flex rounded-sm bg-primary/15 px-2 py-1 font-body text-xs font-medium text-primary">
                                            Featured
                                        </span>
                                    ) : (
                                        <span className="inline-flex rounded-sm bg-muted px-2 py-1 font-body text-xs font-medium text-muted-foreground">
                                            Standard
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`inline-flex rounded-sm px-2 py-1 font-body text-xs font-medium ${
                                            product.in_stock && product.stock_quantity > 0
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-red-100 text-red-700'
                                        }`}
                                    >
                                        {stockLabel(product)}
                                    </span>
                                </td>
                                <td className="max-w-[160px] truncate px-6 py-4 font-body text-xs uppercase tracking-wider text-muted-foreground">
                                    {product.category}
                                </td>
                                <td className="px-6 py-4 font-body text-sm font-semibold text-primary">
                                    ${formatPrice(product.price)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setViewProduct(product)}
                                            aria-label={`View ${product.name}`}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link
                                                href={`/admin/products/${product.id}/edit`}
                                                aria-label={`Edit ${product.name}`}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => duplicateProduct(product)}
                                            disabled={duplicatingId === product.id}
                                            aria-label={`Duplicate ${product.name}`}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeleteProduct(product)}
                                            className="text-destructive hover:text-destructive"
                                            aria-label={`Delete ${product.name}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Dialog open={viewProduct !== null} onOpenChange={(open) => !open && setViewProduct(null)}>
                <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
                    {viewProduct && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="font-heading">{viewProduct.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 font-body text-sm">
                                {viewProduct.image_url && (
                                    <img
                                        src={viewProduct.image_url}
                                        alt={viewProduct.name}
                                        className="h-40 w-full rounded-lg object-cover"
                                    />
                                )}
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                            Category
                                        </p>
                                        <p>{viewProduct.category}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                            Price
                                        </p>
                                        <p className="font-semibold text-primary">
                                            ${formatPrice(viewProduct.price)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                            Promotion
                                        </p>
                                        <p>{viewProduct.is_featured ? 'Featured' : 'Standard'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                            Stock
                                        </p>
                                        <p>{stockLabel(viewProduct)}</p>
                                    </div>
                                </div>
                                {viewProduct.description && (
                                    <div>
                                        <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                                            Description
                                        </p>
                                        <p className="text-muted-foreground">{viewProduct.description}</p>
                                    </div>
                                )}
                                {viewProduct.serves && (
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                            Serves
                                        </p>
                                        <p>{viewProduct.serves}</p>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setViewProduct(null)}>
                                    Close
                                </Button>
                                <Button asChild>
                                    <Link href={`/admin/products/${viewProduct.id}/edit`}>Edit Product</Link>
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteProduct !== null}
                onOpenChange={(open) => !open && !deleting && setDeleteProduct(null)}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading">Delete product?</DialogTitle>
                        <DialogDescription className="font-body">
                            {deleteProduct && (
                                <>
                                    You are about to permanently delete{' '}
                                    <span className="font-medium text-foreground">
                                        {deleteProduct.name}
                                    </span>
                                    . This action cannot be undone and the product will be removed
                                    from your menu.
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteProduct(null)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                            {deleting ? 'Deleting…' : 'Delete Product'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
