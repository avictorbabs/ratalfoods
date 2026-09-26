import { Pagination, type Paginated } from '@/components/dashboard/pagination';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/layouts/dashboard-layout';
import { formatPrice } from '@/lib/price';
import { Head, Link } from '@inertiajs/react';
import { Award, Info } from 'lucide-react';

type PointsRow = { id: number; label: string; points: number; note: string | null; created_at: string };

type PointsProps = {
    enabled: boolean;
    balance: number;
    pointValue: number;
    pointsPerDollar: number;
    minRedeem: number;
    maxPercent: number;
    expiryMonths: number | null;
    nextExpiry: { remaining: number; expires_at: string } | null;
    transactions: Paginated<PointsRow>;
};

const formatDate = (value: string) => new Date(value).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });

export default function Points({
    enabled,
    balance,
    pointValue,
    pointsPerDollar,
    minRedeem,
    maxPercent,
    expiryMonths,
    nextExpiry,
    transactions,
}: PointsProps) {
    const worth = Math.floor(balance * pointValue * 100) / 100;

    return (
        <DashboardLayout variant="user" title="My Points" subtitle="Earn points on every order and use them at checkout">
            <Head title="My Points" />

            {!enabled && (
                <div className="font-body bg-muted mb-6 flex gap-3 rounded-lg p-4 text-sm">
                    <Info className="mt-0.5 h-5 w-5 shrink-0" />
                    <p>
                        The points program is paused right now, so points are not being earned or used. Your balance is safe and will be here when it
                        comes back.
                    </p>
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="border-border rounded-xl border bg-white p-6 shadow-sm lg:col-span-1">
                    <div className="flex items-center gap-4">
                        <span className="bg-primary/15 text-primary flex h-12 w-12 items-center justify-center rounded-lg">
                            <Award className="h-6 w-6" />
                        </span>
                        <div>
                            <p className="font-body text-muted-foreground text-sm">Your balance</p>
                            <p className="font-heading text-3xl">{balance.toLocaleString()} pts</p>
                        </div>
                    </div>
                    <p className="font-body text-muted-foreground mt-4 text-sm">Worth ${formatPrice(worth)} off your next order.</p>
                    {nextExpiry && (
                        <p className="font-body text-muted-foreground mt-2 text-xs">
                            {nextExpiry.remaining.toLocaleString()} pts expire on {formatDate(nextExpiry.expires_at)}.
                        </p>
                    )}
                    <Button asChild className="mt-5 w-full">
                        <Link href="/menu">Order now</Link>
                    </Button>
                </div>

                <div className="border-border rounded-xl border bg-white p-6 shadow-sm lg:col-span-2">
                    <h2 className="font-heading text-lg">How it works</h2>
                    <ul className="font-body text-muted-foreground mt-3 list-disc space-y-1.5 pl-5 text-sm">
                        <li>
                            Earn {pointsPerDollar} point{pointsPerDollar === 1 ? '' : 's'} for every $1 you spend, added once your order is complete.
                        </li>
                        <li>
                            Every point is worth ${pointValue.toFixed(2)}. Use them at checkout once you have at least {minRedeem.toLocaleString()}{' '}
                            points.
                        </li>
                        <li>Points can cover up to {maxPercent}% of an order.</li>
                        <li>{expiryMonths ? `Points expire ${expiryMonths} months after you earn them.` : 'Your points never expire.'}</li>
                        <li>If an order is cancelled or refunded, the points go back to where they were.</li>
                    </ul>
                </div>
            </div>

            <section className="border-border mt-8 rounded-xl border bg-white shadow-sm">
                <div className="border-border border-b px-6 py-4">
                    <h2 className="font-heading text-lg">Activity</h2>
                </div>

                {transactions.data.length === 0 ? (
                    <p className="font-body text-muted-foreground px-6 py-8 text-sm">
                        No points activity yet. Your first points arrive when an order is complete.
                    </p>
                ) : (
                    <div className="divide-border divide-y">
                        {transactions.data.map((row) => (
                            <div key={row.id} className="flex items-center justify-between gap-4 px-6 py-4">
                                <div>
                                    <p className="font-body text-sm font-medium">{row.label}</p>
                                    <p className="font-body text-muted-foreground text-xs">
                                        {formatDate(row.created_at)}
                                        {row.note ? ` · ${row.note}` : ''}
                                    </p>
                                </div>
                                <span className={`font-body text-sm font-semibold ${row.points >= 0 ? 'text-emerald-700' : 'text-foreground'}`}>
                                    {row.points >= 0 ? '+' : ''}
                                    {row.points.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
                <Pagination page={transactions} />
            </section>
        </DashboardLayout>
    );
}
