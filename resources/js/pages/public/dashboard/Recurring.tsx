import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarX, Pause, Play, Repeat } from 'lucide-react';
import { useState } from 'react';

type Schedule = {
    id: number;
    status: 'active' | 'paused';
    frequency_label: string;
    collection_method: 'pickup' | 'delivery_request';
    when: string;
    address: string | null;
    items: { name: string; quantity: number }[];
    next_date: string | null;
    ends_on: string | null;
    payment: string;
};

const formatDate = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

export default function Recurring({ schedules }: { schedules: Schedule[] }) {
    const [cancelTarget, setCancelTarget] = useState<Schedule | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);

    const act = (schedule: Schedule, action: 'pause' | 'resume' | 'skip' | 'cancel', done?: () => void) => {
        router.post(
            `/dashboard/recurring/${schedule.id}/${action}`,
            {},
            {
                preserveScroll: true,
                onStart: () => setBusyId(schedule.id),
                onFinish: () => {
                    setBusyId(null);
                    done?.();
                },
            },
        );
    };

    return (
        <DashboardLayout variant="user" title="Repeat Orders" subtitle="Orders that come back on their own, paid on pickup or delivery">
            <Head title="Repeat Orders" />

            {schedules.length === 0 ? (
                <div className="border-border rounded-xl border bg-white p-8 text-center shadow-sm">
                    <Repeat className="text-primary mx-auto mb-3 h-8 w-8" />
                    <h2 className="font-heading text-xl">No repeat orders yet</h2>
                    <p className="font-body text-muted-foreground mx-auto mt-2 max-w-md text-sm">
                        Great for office lunches and weekly favourites. At checkout, tick &quot;Repeat this order&quot; and we will take care of the
                        rest.
                    </p>
                    <Button asChild className="mt-5">
                        <Link href="/menu">Browse the menu</Link>
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {schedules.map((schedule) => (
                        <section key={schedule.id} className="border-border rounded-xl border bg-white p-6 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="font-heading text-lg">{schedule.frequency_label}</p>
                                    <p className="font-body text-muted-foreground text-sm">
                                        {schedule.when} · {schedule.payment}
                                    </p>
                                    {schedule.address && <p className="font-body text-muted-foreground text-sm">{schedule.address}</p>}
                                </div>
                                <span
                                    className={`font-body inline-flex rounded-sm px-2 py-1 text-xs font-medium tracking-wider uppercase ${
                                        schedule.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                    }`}
                                >
                                    {schedule.status === 'active' ? 'Active' : 'Paused'}
                                </span>
                            </div>

                            <ul className="font-body mt-4 space-y-1 text-sm">
                                {schedule.items.map((item, index) => (
                                    <li key={index}>
                                        {item.name} <span className="text-muted-foreground">×{item.quantity}</span>
                                    </li>
                                ))}
                            </ul>

                            <p className="font-body text-muted-foreground mt-4 text-sm">
                                {schedule.status === 'paused'
                                    ? 'Paused. Nothing will be ordered until you resume.'
                                    : schedule.next_date
                                      ? `Next order: ${formatDate(schedule.next_date)}`
                                      : 'No more orders are planned.'}
                                {schedule.ends_on ? ` · Ends ${formatDate(schedule.ends_on)}` : ''}
                            </p>

                            <div className="mt-5 flex flex-wrap gap-2">
                                {schedule.status === 'active' ? (
                                    <>
                                        {schedule.next_date && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={busyId === schedule.id}
                                                onClick={() => act(schedule, 'skip')}
                                            >
                                                <CalendarX className="h-4 w-4" />
                                                Skip next
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm" disabled={busyId === schedule.id} onClick={() => act(schedule, 'pause')}>
                                            <Pause className="h-4 w-4" />
                                            Pause
                                        </Button>
                                    </>
                                ) : (
                                    <Button size="sm" disabled={busyId === schedule.id} onClick={() => act(schedule, 'resume')}>
                                        <Play className="h-4 w-4" />
                                        Resume
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setCancelTarget(schedule)}
                                >
                                    Cancel repeat
                                </Button>
                            </div>
                        </section>
                    ))}
                </div>
            )}

            <Dialog open={cancelTarget !== null} onOpenChange={(open) => !open && setCancelTarget(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading">Cancel this repeat order?</DialogTitle>
                        <DialogDescription>
                            No more orders will be created. An order that is already placed and not started will be cancelled too.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelTarget(null)}>
                            Keep it
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={busyId === cancelTarget?.id}
                            onClick={() => cancelTarget && act(cancelTarget, 'cancel', () => setCancelTarget(null))}
                        >
                            Cancel repeat
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
