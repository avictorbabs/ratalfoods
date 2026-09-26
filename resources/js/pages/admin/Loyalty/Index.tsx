import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { FormEvent, useState } from 'react';

type Settings = {
    loyalty_enabled: boolean;
    loyalty_points_per_dollar: string;
    loyalty_point_value: string;
    loyalty_min_redeem: number;
    loyalty_max_percent: number;
    loyalty_expiry_months: number | null;
};

type HistoryRow = { id: number; label: string; points: number; note: string | null; created_at: string };
type Customer = { id: number; name: string; email: string; balance: number; history: HistoryRow[] };

type LoyaltyAdminProps = {
    settings: Settings;
    stats: { outstanding: number; earned: number; redeemed: number; members: number };
    search: string;
    customers: Customer[];
};

const formatDate = (value: string) => new Date(value).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="border-border rounded-xl border bg-white p-5 shadow-sm">
            <p className="font-body text-muted-foreground text-xs tracking-wider uppercase">{label}</p>
            <p className="font-heading mt-1 text-2xl">{value.toLocaleString()}</p>
        </div>
    );
}

function SettingsCard({ settings }: { settings: Settings }) {
    const { data, setData, put, processing, errors } = useForm({
        loyalty_enabled: settings.loyalty_enabled,
        loyalty_points_per_dollar: String(Number(settings.loyalty_points_per_dollar)),
        loyalty_point_value: String(Number(settings.loyalty_point_value)),
        loyalty_min_redeem: String(settings.loyalty_min_redeem),
        loyalty_max_percent: String(settings.loyalty_max_percent),
        loyalty_expiry_months: settings.loyalty_expiry_months ? String(settings.loyalty_expiry_months) : '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put('/admin/loyalty', { preserveScroll: true });
    };

    const perHundred = (100 * Number(data.loyalty_points_per_dollar || 0) * Number(data.loyalty_point_value || 0)).toFixed(2);

    return (
        <section className="border-border rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="font-heading text-lg">Program settings</h2>
            <p className="font-body text-muted-foreground mt-1 text-sm">
                Turning the program off hides points from customers and stops earning and spending. Balances are kept and return when you turn it on
                again.
            </p>

            <form onSubmit={submit} className="mt-5 space-y-4">
                <label className="font-body flex items-center gap-3 text-sm">
                    <Checkbox checked={data.loyalty_enabled} onCheckedChange={(checked) => setData('loyalty_enabled', checked === true)} />
                    Loyalty points are on
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <Label htmlFor="loyalty_points_per_dollar" required>
                            Points earned per $1
                        </Label>
                        <Input
                            id="loyalty_points_per_dollar"
                            type="number"
                            min="0.1"
                            step="0.1"
                            required
                            value={data.loyalty_points_per_dollar}
                            onChange={(event) => setData('loyalty_points_per_dollar', event.target.value)}
                            className="mt-1.5"
                        />
                        {errors.loyalty_points_per_dollar && <p className="text-destructive mt-1 text-xs">{errors.loyalty_points_per_dollar}</p>}
                    </div>
                    <div>
                        <Label htmlFor="loyalty_point_value" required>
                            Value of one point ($)
                        </Label>
                        <Input
                            id="loyalty_point_value"
                            type="number"
                            min="0.001"
                            step="0.001"
                            required
                            value={data.loyalty_point_value}
                            onChange={(event) => setData('loyalty_point_value', event.target.value)}
                            className="mt-1.5"
                        />
                        {errors.loyalty_point_value && <p className="text-destructive mt-1 text-xs">{errors.loyalty_point_value}</p>}
                    </div>
                    <div>
                        <Label htmlFor="loyalty_min_redeem" required>
                            Minimum points to use
                        </Label>
                        <Input
                            id="loyalty_min_redeem"
                            type="number"
                            min="1"
                            required
                            value={data.loyalty_min_redeem}
                            onChange={(event) => setData('loyalty_min_redeem', event.target.value)}
                            className="mt-1.5"
                        />
                        {errors.loyalty_min_redeem && <p className="text-destructive mt-1 text-xs">{errors.loyalty_min_redeem}</p>}
                    </div>
                    <div>
                        <Label htmlFor="loyalty_max_percent" required>
                            Max % of an order points can cover
                        </Label>
                        <Input
                            id="loyalty_max_percent"
                            type="number"
                            min="1"
                            max="100"
                            required
                            value={data.loyalty_max_percent}
                            onChange={(event) => setData('loyalty_max_percent', event.target.value)}
                            className="mt-1.5"
                        />
                        {errors.loyalty_max_percent && <p className="text-destructive mt-1 text-xs">{errors.loyalty_max_percent}</p>}
                    </div>
                    <div>
                        <Label htmlFor="loyalty_expiry_months">Points expire after (months)</Label>
                        <Input
                            id="loyalty_expiry_months"
                            type="number"
                            min="1"
                            value={data.loyalty_expiry_months}
                            onChange={(event) => setData('loyalty_expiry_months', event.target.value)}
                            className="mt-1.5"
                            placeholder="Never"
                        />
                        {errors.loyalty_expiry_months && <p className="text-destructive mt-1 text-xs">{errors.loyalty_expiry_months}</p>}
                    </div>
                </div>

                <p className="font-body text-muted-foreground text-sm">
                    With these numbers a customer who spends $100 earns about ${perHundred} back in points.
                </p>

                <Button type="submit" disabled={processing}>
                    {processing ? 'Saving…' : 'Save settings'}
                </Button>
            </form>
        </section>
    );
}

function AdjustForm({ customer }: { customer: Customer }) {
    const { data, setData, post, processing, errors, reset } = useForm({ user_id: customer.id, points: '', note: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post('/admin/loyalty/adjust', { preserveScroll: true, onSuccess: () => reset('points', 'note') });
    };

    return (
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-[8rem_1fr_auto]">
            <div>
                <Input
                    type="number"
                    required
                    value={data.points}
                    onChange={(event) => setData('points', event.target.value)}
                    placeholder="+100 or -50"
                    aria-label="Points to add or remove"
                />
                {errors.points && <p className="text-destructive mt-1 text-xs">{errors.points}</p>}
            </div>
            <div>
                <Input
                    required
                    value={data.note}
                    onChange={(event) => setData('note', event.target.value)}
                    placeholder="Reason (shown to the customer)"
                />
                {errors.note && <p className="text-destructive mt-1 text-xs">{errors.note}</p>}
            </div>
            <Button type="submit" variant="outline" disabled={processing}>
                {processing ? 'Saving…' : 'Adjust'}
            </Button>
        </form>
    );
}

export default function LoyaltyIndex({ settings, stats, search, customers }: LoyaltyAdminProps) {
    const [query, setQuery] = useState(search);

    const runSearch = (event: FormEvent) => {
        event.preventDefault();
        router.get('/admin/loyalty', { q: query.trim() || undefined }, { preserveState: true, preserveScroll: true });
    };

    return (
        <DashboardLayout variant="admin" title="Loyalty" subtitle="Reward repeat customers with points">
            <Head title="Loyalty" />

            <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Stat label="Points outstanding" value={stats.outstanding} />
                    <Stat label="Points earned" value={stats.earned} />
                    <Stat label="Points used" value={stats.redeemed} />
                    <Stat label="Members with points" value={stats.members} />
                </div>

                <SettingsCard settings={settings} />

                <section className="border-border rounded-xl border bg-white p-6 shadow-sm">
                    <h2 className="font-heading text-lg">Customer points</h2>
                    <p className="font-body text-muted-foreground mt-1 text-sm">
                        Find a customer to see their history or add or remove points by hand.
                    </p>

                    <form onSubmit={runSearch} className="relative mt-4 max-w-md">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or email…" className="pl-10" />
                    </form>

                    {search !== '' && customers.length === 0 && (
                        <p className="font-body text-muted-foreground mt-4 text-sm">No customers match “{search}”.</p>
                    )}

                    <div className="mt-4 space-y-4">
                        {customers.map((customer) => (
                            <div key={customer.id} className="border-border rounded-lg border p-4">
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <div>
                                        <p className="font-body text-sm font-semibold">{customer.name}</p>
                                        <p className="font-body text-muted-foreground text-xs">{customer.email}</p>
                                    </div>
                                    <p className="font-heading text-xl">{customer.balance.toLocaleString()} pts</p>
                                </div>

                                {customer.history.length > 0 && (
                                    <div className="divide-border mt-3 divide-y text-sm">
                                        {customer.history.map((row) => (
                                            <div key={row.id} className="font-body flex justify-between gap-4 py-1.5">
                                                <span className="text-muted-foreground">
                                                    {formatDate(row.created_at)} · {row.label}
                                                    {row.note ? ` · ${row.note}` : ''}
                                                </span>
                                                <span className={row.points >= 0 ? 'text-emerald-700' : ''}>
                                                    {row.points >= 0 ? '+' : ''}
                                                    {row.points}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <AdjustForm customer={customer} />
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
