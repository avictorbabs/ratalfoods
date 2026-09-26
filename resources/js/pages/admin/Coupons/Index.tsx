import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/layouts/dashboard-layout';
import { formatPrice } from '@/lib/price';
import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';

type CouponRow = {
    id: number;
    code: string;
    type: 'percent' | 'fixed';
    value: string;
    min_order: string | null;
    max_discount: string | null;
    starts_at: string | null;
    expires_at: string | null;
    usage_limit: number | null;
    first_order_only: boolean;
    is_active: boolean;
    times_used: number;
};

type WelcomeSettings = {
    welcome_offer_enabled: boolean;
    welcome_discount_percent: string;
    welcome_max_discount: string | null;
    welcome_min_order: string | null;
    welcome_valid_days: number;
    welcome_delay_seconds: number;
    welcome_headline: string;
    welcome_body: string | null;
};

type CouponsIndexProps = {
    coupons: CouponRow[];
    welcome: WelcomeSettings;
    welcomeStats: { issued: number; redeemed: number };
    winback: WinbackSettings;
    winbackStats: { sent: number; redeemed: number };
};

const emptyCoupon = {
    code: '',
    type: 'percent' as 'percent' | 'fixed',
    value: '',
    min_order: '',
    max_discount: '',
    starts_at: '',
    expires_at: '',
    usage_limit: '',
    first_order_only: false,
    is_active: true,
};

const toDateInput = (value: string | null): string => (value ? value.slice(0, 10) : '');

const selectClass =
    'border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]';

function describe(coupon: CouponRow): string {
    return coupon.type === 'percent' ? `${Number(coupon.value)}% off` : `$${formatPrice(coupon.value)} off`;
}

function WelcomeOfferCard({ welcome, stats }: { welcome: WelcomeSettings; stats: { issued: number; redeemed: number } }) {
    const { data, setData, put, processing, errors } = useForm({
        welcome_offer_enabled: welcome.welcome_offer_enabled,
        welcome_discount_percent: welcome.welcome_discount_percent,
        welcome_max_discount: welcome.welcome_max_discount ?? '',
        welcome_min_order: welcome.welcome_min_order ?? '',
        welcome_valid_days: String(welcome.welcome_valid_days),
        welcome_delay_seconds: String(welcome.welcome_delay_seconds),
        welcome_headline: welcome.welcome_headline,
        welcome_body: welcome.welcome_body ?? '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put('/admin/coupons/welcome-offer', { preserveScroll: true });
    };

    return (
        <section className="border-border rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="font-heading text-lg">Welcome offer</h2>
                    <p className="font-body text-muted-foreground mt-1 text-sm">
                        A popup invites new visitors to join the mailing list. Each subscriber gets a personal one-time code for their first order,
                        sent by email.
                    </p>
                </div>
                <p className="font-body text-muted-foreground text-sm whitespace-nowrap">
                    {stats.issued} issued · {stats.redeemed} redeemed
                </p>
            </div>

            <form onSubmit={submit} className="mt-5 space-y-4">
                <label className="font-body flex items-center gap-3 text-sm">
                    <Checkbox
                        checked={data.welcome_offer_enabled}
                        onCheckedChange={(checked) => setData('welcome_offer_enabled', checked === true)}
                    />
                    Show the welcome popup and issue codes
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <Label htmlFor="welcome_discount_percent" required>
                            Discount (%)
                        </Label>
                        <Input
                            id="welcome_discount_percent"
                            type="number"
                            min="1"
                            max="100"
                            step="0.01"
                            required
                            value={data.welcome_discount_percent}
                            onChange={(event) => setData('welcome_discount_percent', event.target.value)}
                            className="mt-1.5"
                        />
                        {errors.welcome_discount_percent && <p className="text-destructive mt-1 text-xs">{errors.welcome_discount_percent}</p>}
                    </div>
                    <div>
                        <Label htmlFor="welcome_valid_days" required>
                            Code valid for (days)
                        </Label>
                        <Input
                            id="welcome_valid_days"
                            type="number"
                            min="1"
                            required
                            value={data.welcome_valid_days}
                            onChange={(event) => setData('welcome_valid_days', event.target.value)}
                            className="mt-1.5"
                        />
                        {errors.welcome_valid_days && <p className="text-destructive mt-1 text-xs">{errors.welcome_valid_days}</p>}
                    </div>
                    <div>
                        <Label htmlFor="welcome_min_order">Minimum order ($)</Label>
                        <Input
                            id="welcome_min_order"
                            type="number"
                            min="0"
                            step="0.01"
                            value={data.welcome_min_order}
                            onChange={(event) => setData('welcome_min_order', event.target.value)}
                            className="mt-1.5"
                            placeholder="None"
                        />
                        {errors.welcome_min_order && <p className="text-destructive mt-1 text-xs">{errors.welcome_min_order}</p>}
                    </div>
                    <div>
                        <Label htmlFor="welcome_max_discount">Maximum discount ($)</Label>
                        <Input
                            id="welcome_max_discount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={data.welcome_max_discount}
                            onChange={(event) => setData('welcome_max_discount', event.target.value)}
                            className="mt-1.5"
                            placeholder="No cap"
                        />
                        {errors.welcome_max_discount && <p className="text-destructive mt-1 text-xs">{errors.welcome_max_discount}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                    <div>
                        <Label htmlFor="welcome_delay_seconds" required>
                            Show popup after (seconds)
                        </Label>
                        <Input
                            id="welcome_delay_seconds"
                            type="number"
                            min="0"
                            required
                            value={data.welcome_delay_seconds}
                            onChange={(event) => setData('welcome_delay_seconds', event.target.value)}
                            className="mt-1.5"
                        />
                        {errors.welcome_delay_seconds && <p className="text-destructive mt-1 text-xs">{errors.welcome_delay_seconds}</p>}
                    </div>
                    <div className="lg:col-span-3">
                        <Label htmlFor="welcome_headline" required>
                            Popup headline
                        </Label>
                        <Input
                            id="welcome_headline"
                            required
                            value={data.welcome_headline}
                            onChange={(event) => setData('welcome_headline', event.target.value)}
                            className="mt-1.5"
                        />
                        {errors.welcome_headline && <p className="text-destructive mt-1 text-xs">{errors.welcome_headline}</p>}
                    </div>
                </div>

                <div>
                    <Label htmlFor="welcome_body">Popup text</Label>
                    <Textarea
                        id="welcome_body"
                        rows={2}
                        value={data.welcome_body}
                        onChange={(event) => setData('welcome_body', event.target.value)}
                        className="mt-1.5"
                        placeholder="Join our mailing list and we will email you a personal code for your first order."
                    />
                    {errors.welcome_body && <p className="text-destructive mt-1 text-xs">{errors.welcome_body}</p>}
                </div>

                <Button type="submit" disabled={processing}>
                    {processing ? 'Saving…' : 'Save welcome offer'}
                </Button>
            </form>
        </section>
    );
}

type WinbackSettings = {
    winback_enabled: boolean;
    winback_days_inactive: number;
    winback_discount_percent: string;
    winback_valid_days: number;
};

function WinbackCard({ winback, stats }: { winback: WinbackSettings; stats: { sent: number; redeemed: number } }) {
    const { data, setData, put, processing, errors } = useForm({
        winback_enabled: winback.winback_enabled,
        winback_days_inactive: String(winback.winback_days_inactive),
        winback_discount_percent: String(Number(winback.winback_discount_percent)),
        winback_valid_days: String(winback.winback_valid_days),
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put('/admin/coupons/winback', { preserveScroll: true });
    };

    return (
        <section className="border-border rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="font-heading text-lg">Win-back offer</h2>
                    <p className="font-body text-muted-foreground mt-1 text-sm">
                        Once a day, customers who have not ordered for a while get a &quot;we miss you&quot; email with a small personal code. Each
                        person is emailed at most once every 90 days, and anyone who unsubscribes is left out.
                    </p>
                </div>
                <p className="font-body text-muted-foreground text-sm whitespace-nowrap">
                    {stats.sent} sent · {stats.redeemed} redeemed
                </p>
            </div>

            <form onSubmit={submit} className="mt-5 space-y-4">
                <label className="font-body flex items-center gap-3 text-sm">
                    <Checkbox checked={data.winback_enabled} onCheckedChange={(checked) => setData('winback_enabled', checked === true)} />
                    Send win-back emails
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                        <Label htmlFor="winback_days_inactive" required>
                            Days since last order
                        </Label>
                        <Input
                            id="winback_days_inactive"
                            type="number"
                            min="7"
                            required
                            value={data.winback_days_inactive}
                            onChange={(event) => setData('winback_days_inactive', event.target.value)}
                            className="mt-1.5"
                        />
                        {errors.winback_days_inactive && <p className="text-destructive mt-1 text-xs">{errors.winback_days_inactive}</p>}
                    </div>
                    <div>
                        <Label htmlFor="winback_discount_percent" required>
                            Discount (%)
                        </Label>
                        <Input
                            id="winback_discount_percent"
                            type="number"
                            min="1"
                            max="100"
                            step="0.01"
                            required
                            value={data.winback_discount_percent}
                            onChange={(event) => setData('winback_discount_percent', event.target.value)}
                            className="mt-1.5"
                        />
                        {errors.winback_discount_percent && <p className="text-destructive mt-1 text-xs">{errors.winback_discount_percent}</p>}
                    </div>
                    <div>
                        <Label htmlFor="winback_valid_days" required>
                            Code valid for (days)
                        </Label>
                        <Input
                            id="winback_valid_days"
                            type="number"
                            min="1"
                            required
                            value={data.winback_valid_days}
                            onChange={(event) => setData('winback_valid_days', event.target.value)}
                            className="mt-1.5"
                        />
                        {errors.winback_valid_days && <p className="text-destructive mt-1 text-xs">{errors.winback_valid_days}</p>}
                    </div>
                </div>

                <Button type="submit" disabled={processing}>
                    {processing ? 'Saving…' : 'Save win-back offer'}
                </Button>
            </form>
        </section>
    );
}

export default function CouponsIndex({ coupons, welcome, welcomeStats, winback, winbackStats }: CouponsIndexProps) {
    const [editorOpen, setEditorOpen] = useState(false);
    const [editing, setEditing] = useState<CouponRow | null>(null);
    const [deleteCoupon, setDeleteCoupon] = useState<CouponRow | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm(emptyCoupon);

    const openCreate = () => {
        setEditing(null);
        clearErrors();
        setData(emptyCoupon);
        setEditorOpen(true);
    };

    const openEdit = (coupon: CouponRow) => {
        setEditing(coupon);
        clearErrors();
        setData({
            code: coupon.code,
            type: coupon.type,
            value: String(Number(coupon.value)),
            min_order: coupon.min_order ?? '',
            max_discount: coupon.max_discount ?? '',
            starts_at: toDateInput(coupon.starts_at),
            expires_at: toDateInput(coupon.expires_at),
            usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : '',
            first_order_only: coupon.first_order_only,
            is_active: coupon.is_active,
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
        const options = { preserveScroll: true, onSuccess: () => closeEditor() };

        if (editing) {
            put(`/admin/coupons/${editing.id}`, options);

            return;
        }

        post('/admin/coupons', options);
    };

    const confirmDelete = () => {
        if (!deleteCoupon) {
            return;
        }

        setDeleting(true);
        router.delete(`/admin/coupons/${deleteCoupon.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteCoupon(null);
            },
        });
    };

    return (
        <DashboardLayout variant="admin" title="Coupons" subtitle="Promo codes and the welcome offer for new customers">
            <Head title="Coupons" />

            <div className="space-y-6">
                <WelcomeOfferCard welcome={welcome} stats={welcomeStats} />

                <WinbackCard winback={winback} stats={winbackStats} />

                <div className="border-border rounded-xl border bg-white shadow-sm">
                    <div className="border-border flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <h2 className="font-heading text-lg">Promo codes ({coupons.length})</h2>
                        <Button type="button" onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Coupon
                        </Button>
                    </div>

                    {coupons.length === 0 ? (
                        <p className="font-body text-muted-foreground px-6 py-8 text-sm">
                            No promo codes yet. Create one for a campaign like SUMMER15.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px]">
                                <thead>
                                    <tr className="border-border bg-muted/40 border-b">
                                        {['Code', 'Discount', 'Rules', 'Expires', 'Used', 'Status', 'Actions'].map((heading) => (
                                            <th
                                                key={heading}
                                                className="font-body text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase last:text-right first:sm:px-6 last:sm:px-6"
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-border divide-y">
                                    {coupons.map((coupon) => (
                                        <tr key={coupon.id} className="hover:bg-muted/20">
                                            <td className="font-body px-4 py-4 text-sm font-semibold sm:px-6">{coupon.code}</td>
                                            <td className="font-body text-primary px-4 py-4 text-sm font-semibold">{describe(coupon)}</td>
                                            <td className="font-body text-muted-foreground px-4 py-4 text-xs">
                                                {[
                                                    coupon.min_order ? `Min $${formatPrice(coupon.min_order)}` : null,
                                                    coupon.max_discount ? `Max $${formatPrice(coupon.max_discount)}` : null,
                                                    coupon.first_order_only ? 'First order only' : null,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ') || '—'}
                                            </td>
                                            <td className="font-body text-muted-foreground px-4 py-4 text-sm">
                                                {coupon.expires_at ? toDateInput(coupon.expires_at) : 'Never'}
                                            </td>
                                            <td className="font-body px-4 py-4 text-sm">
                                                {coupon.times_used}
                                                {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={`font-body inline-flex rounded-sm px-2 py-1 text-xs font-medium tracking-wider uppercase ${
                                                        coupon.is_active ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    {coupon.is_active ? 'Active' : 'Off'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right sm:px-6">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEdit(coupon)}
                                                        aria-label={`Edit ${coupon.code}`}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => setDeleteCoupon(coupon)}
                                                        aria-label={`Delete ${coupon.code}`}
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
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="font-heading">{editing ? 'Edit coupon' : 'Add coupon'}</DialogTitle>
                        <DialogDescription>Shared promo code that anyone can use at checkout.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="coupon-code" required>
                                    Code
                                </Label>
                                <Input
                                    id="coupon-code"
                                    required
                                    value={data.code}
                                    onChange={(event) => setData('code', event.target.value.toUpperCase())}
                                    className="mt-1.5 uppercase"
                                    placeholder="SUMMER15"
                                />
                                {errors.code && <p className="text-destructive mt-1 text-xs">{errors.code}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="coupon-type" required>
                                        Type
                                    </Label>
                                    <select
                                        id="coupon-type"
                                        className={`${selectClass} mt-1.5`}
                                        value={data.type}
                                        onChange={(event) => setData('type', event.target.value as 'percent' | 'fixed')}
                                    >
                                        <option value="percent">Percent</option>
                                        <option value="fixed">Fixed $</option>
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="coupon-value" required>
                                        Value
                                    </Label>
                                    <Input
                                        id="coupon-value"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        required
                                        value={data.value}
                                        onChange={(event) => setData('value', event.target.value)}
                                        className="mt-1.5"
                                    />
                                </div>
                                {errors.value && <p className="text-destructive col-span-2 -mt-2 text-xs">{errors.value}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <Label htmlFor="coupon-min">Minimum order ($)</Label>
                                <Input
                                    id="coupon-min"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.min_order}
                                    onChange={(event) => setData('min_order', event.target.value)}
                                    className="mt-1.5"
                                />
                            </div>
                            <div>
                                <Label htmlFor="coupon-max">Maximum discount ($)</Label>
                                <Input
                                    id="coupon-max"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.max_discount}
                                    onChange={(event) => setData('max_discount', event.target.value)}
                                    className="mt-1.5"
                                />
                            </div>
                            <div>
                                <Label htmlFor="coupon-limit">Total uses</Label>
                                <Input
                                    id="coupon-limit"
                                    type="number"
                                    min="1"
                                    value={data.usage_limit}
                                    onChange={(event) => setData('usage_limit', event.target.value)}
                                    className="mt-1.5"
                                    placeholder="Unlimited"
                                />
                                {errors.usage_limit && <p className="text-destructive mt-1 text-xs">{errors.usage_limit}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="coupon-start">Starts</Label>
                                <Input
                                    id="coupon-start"
                                    type="date"
                                    value={data.starts_at}
                                    onChange={(event) => setData('starts_at', event.target.value)}
                                    className="mt-1.5"
                                />
                            </div>
                            <div>
                                <Label htmlFor="coupon-end">Expires</Label>
                                <Input
                                    id="coupon-end"
                                    type="date"
                                    value={data.expires_at}
                                    onChange={(event) => setData('expires_at', event.target.value)}
                                    className="mt-1.5"
                                />
                                {errors.expires_at && <p className="text-destructive mt-1 text-xs">{errors.expires_at}</p>}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-6">
                            <label className="font-body flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={data.first_order_only}
                                    onCheckedChange={(checked) => setData('first_order_only', checked === true)}
                                />
                                First order only
                            </label>
                            <label className="font-body flex items-center gap-2 text-sm">
                                <Checkbox checked={data.is_active} onCheckedChange={(checked) => setData('is_active', checked === true)} />
                                Active
                            </label>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeEditor}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving…' : editing ? 'Save changes' : 'Create coupon'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteCoupon !== null} onOpenChange={(open) => !open && setDeleteCoupon(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading">Delete coupon?</DialogTitle>
                        <DialogDescription>
                            “{deleteCoupon?.code}” will stop working. Orders that already used it keep their discount.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDeleteCoupon(null)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="destructive" disabled={deleting} onClick={confirmDelete}>
                            {deleting ? 'Deleting…' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
