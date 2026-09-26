import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/layouts/dashboard-layout';
import { formatPrice } from '@/lib/price';

type DeliveryFeeRow = {
    id: number;
    name: string;
    match_terms: string;
    fee: string;
    is_active: boolean;
};

type DeliveryFeesIndexProps = {
    fees: DeliveryFeeRow[];
    filters: {
        search: string;
    };
};

const emptyForm = {
    name: '',
    match_terms: '',
    fee: '',
    is_active: true,
};

export default function DeliveryFeesIndex({ fees, filters }: DeliveryFeesIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editing, setEditing] = useState<DeliveryFeeRow | null>(null);
    const [deleteFee, setDeleteFee] = useState<DeliveryFeeRow | null>(null);
    const [deleting, setDeleting] = useState(false);
    const mounted = useRef(false);
    const searchRef = useRef(search);
    searchRef.current = search;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm(emptyForm);

    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            return;
        }

        const timer = window.setTimeout(() => {
            if (search.trim() === (filters.search ?? '').trim()) {
                return;
            }

            router.get(
                '/admin/delivery-fees',
                { search: search.trim() || undefined },
                { preserveState: true, replace: true, preserveScroll: true },
            );
        }, 300);

        return () => window.clearTimeout(timer);
    }, [search, filters.search]);

    const openCreate = () => {
        setEditing(null);
        reset();
        clearErrors();
        setData(emptyForm);
        setEditorOpen(true);
    };

    const openEdit = (fee: DeliveryFeeRow) => {
        setEditing(fee);
        clearErrors();
        setData({
            name: fee.name,
            match_terms: fee.match_terms,
            fee: fee.fee,
            is_active: fee.is_active,
        });
        setEditorOpen(true);
    };

    const closeEditor = () => {
        setEditorOpen(false);
        setEditing(null);
        reset();
        clearErrors();
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => closeEditor(),
        };

        if (editing) {
            put(`/admin/delivery-fees/${editing.id}`, options);
            return;
        }

        post('/admin/delivery-fees', options);
    };

    const confirmDelete = () => {
        if (!deleteFee) {
            return;
        }

        setDeleting(true);
        router.delete(`/admin/delivery-fees/${deleteFee.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteFee(null);
            },
        });
    };

    return (
        <DashboardLayout
            variant="admin"
            title="Delivery Fees"
            subtitle="Set delivery costs by location or area keywords"
        >
            <Head title="Delivery Fees" />

            <div className="space-y-6">
                <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
                    <label
                        htmlFor="delivery-fee-search"
                        className="mb-1.5 block font-body text-xs font-medium uppercase tracking-wider text-muted-foreground"
                    >
                        Search
                    </label>
                    <div className="relative max-w-md">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="delivery-fee-search"
                            placeholder="Zone name or match terms..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <p className="mt-3 font-body text-xs text-muted-foreground">
                        Checkout matches the customer address against these terms
                        (case-insensitive). If more than one zone matches, the longest
                        match term wins.
                    </p>
                </div>

                <div className="rounded-xl border border-border bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <h2 className="font-heading text-lg text-foreground">
                            Delivery Zones ({fees.length})
                        </h2>
                        <Button
                            type="button"
                            onClick={openCreate}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Zone
                        </Button>
                    </div>

                    {fees.length === 0 ? (
                        <p className="px-6 py-8 font-body text-sm text-muted-foreground">
                            No delivery zones yet. Add areas like Windsor, Tecumseh, or postal codes.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px]">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40">
                                        <th className="px-4 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground sm:px-6">
                                            Zone
                                        </th>
                                        <th className="px-4 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                            Match Terms
                                        </th>
                                        <th className="px-4 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                            Fee
                                        </th>
                                        <th className="px-4 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-right font-body text-xs font-medium uppercase tracking-wider text-muted-foreground sm:px-6">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {fees.map((fee) => (
                                        <tr key={fee.id} className="hover:bg-muted/20">
                                            <td className="px-4 py-4 font-body text-sm font-medium sm:px-6">
                                                {fee.name}
                                            </td>
                                            <td className="max-w-xs px-4 py-4 font-body text-sm text-muted-foreground">
                                                {fee.match_terms}
                                            </td>
                                            <td className="px-4 py-4 font-body text-sm font-semibold text-primary">
                                                ${formatPrice(fee.fee)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={`inline-flex rounded-sm px-2 py-1 font-body text-xs font-medium uppercase tracking-wider ${
                                                        fee.is_active
                                                            ? 'bg-accent/10 text-accent'
                                                            : 'bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    {fee.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right sm:px-6">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEdit(fee)}
                                                        aria-label={`Edit ${fee.name}`}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => setDeleteFee(fee)}
                                                        aria-label={`Delete ${fee.name}`}
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
                    )}
                </div>
            </div>

            <Dialog open={editorOpen} onOpenChange={(open) => !open && closeEditor()}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-heading">
                            {editing ? 'Edit Delivery Zone' : 'Add Delivery Zone'}
                        </DialogTitle>
                        <DialogDescription>
                            Use comma-separated terms that appear in customer addresses (city,
                            neighbourhood, postal code, etc.).
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="zone-name" required>Zone name</Label>
                            <Input
                                id="zone-name"
                                value={data.name}
                                onChange={(event) => setData('name', event.target.value)}
                                placeholder="e.g. Windsor Core"
                                required
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="zone-terms" required>Match terms</Label>
                            <Textarea
                                id="zone-terms"
                                value={data.match_terms}
                                onChange={(event) => setData('match_terms', event.target.value)}
                                placeholder="Windsor, N9A, University Ave"
                                rows={3}
                                required
                            />
                            {errors.match_terms && (
                                <p className="text-sm text-destructive">{errors.match_terms}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="zone-fee" required>Fee (CAD)</Label>
                            <Input
                                id="zone-fee"
                                type="number"
                                min="0"
                                step="0.01"
                                value={data.fee}
                                onChange={(event) => setData('fee', event.target.value)}
                                required
                            />
                            {errors.fee && (
                                <p className="text-sm text-destructive">{errors.fee}</p>
                            )}
                        </div>

                        <label className="flex items-center gap-3 rounded-md border border-border p-3">
                            <Checkbox
                                checked={data.is_active}
                                onCheckedChange={(checked) => setData('is_active', checked === true)}
                            />
                            <span className="font-body text-sm">Active</span>
                        </label>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeEditor}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving…' : editing ? 'Save changes' : 'Create zone'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteFee !== null} onOpenChange={(open) => !open && setDeleteFee(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading">Delete delivery zone?</DialogTitle>
                        <DialogDescription>
                            This removes “{deleteFee?.name}” from address matching. Existing orders
                            keep their saved delivery fee.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDeleteFee(null)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={deleting}
                            onClick={confirmDelete}
                        >
                            {deleting ? 'Deleting…' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
