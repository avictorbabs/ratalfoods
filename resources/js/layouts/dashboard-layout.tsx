import { PropsWithChildren } from 'react';
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar';
import { AppShell } from '@/components/app-shell';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

type DashboardLayoutProps = PropsWithChildren<{
    variant: 'admin' | 'user';
    title: string;
    subtitle?: string;
}>;

export default function DashboardLayout({
    children,
    variant,
    title,
    subtitle,
}: DashboardLayoutProps) {
    return (
        <div className="dashboard-shell min-h-screen bg-secondary/30 font-body">
            <AppShell variant="sidebar">
                <DashboardSidebar variant={variant} />
                <SidebarInset className="bg-secondary/30">
                    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
                        <SidebarTrigger className="-ml-1 text-foreground" />
                        <Separator orientation="vertical" className="mr-1 h-6" />
                        <div>
                            <h1 className="font-heading text-xl tracking-tight text-foreground sm:text-2xl">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="font-body text-xs text-muted-foreground sm:text-sm">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </header>
                    <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
                </SidebarInset>
            </AppShell>
        </div>
    );
}
