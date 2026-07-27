import { Link, router, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronsUpDown,
    ExternalLink,
    FileText,
    Image,
    LayoutGrid,
    LogOut,
    Package,
    Settings,
    ShoppingBag,
    Store,
    Tags,
    UtensilsCrossed,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types/ratalfoods';
import type { LucideIcon } from 'lucide-react';

type DashboardSidebarProps = {
    variant: 'admin' | 'user';
};

type NavLink = {
    title: string;
    href: string;
    icon: LucideIcon;
    external?: boolean;
};

const adminLinks: NavLink[] = [
    { title: 'Dashboard', href: '/admin', icon: LayoutGrid },
    { title: 'Products', href: '/admin/products', icon: Package },
    { title: 'Categories', href: '/admin/categories', icon: Tags },
    { title: 'Gallery', href: '/admin/gallery', icon: Image },
    { title: 'Blogs', href: '/admin/blogs', icon: FileText },
    { title: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { title: 'Bookings', href: '/admin/bookings', icon: CalendarDays },
    { title: 'View Store', href: '/', icon: ExternalLink, external: true },
];

const userLinks: NavLink[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { title: 'My Orders', href: '/dashboard#orders', icon: ShoppingBag },
    { title: 'My Bookings', href: '/dashboard#bookings', icon: CalendarDays },
    { title: 'Browse Menu', href: '/menu', icon: UtensilsCrossed },
];

function isActive(href: string, pathname: string): boolean {
    if (href === '/admin') {
        return pathname === '/admin';
    }

    if (href === '/dashboard') {
        return pathname === '/dashboard';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

export default function DashboardSidebar({ variant }: DashboardSidebarProps) {
    const { auth, storeSettings } = usePage<SharedData>().props;
    const pathname = usePage().url.split('?')[0] ?? '/';
    const links = variant === 'admin' ? adminLinks : userLinks;
    const panelTitle = variant === 'admin' ? 'Admin Dashboard' : 'My Account';

    const signOut = () => {
        router.post('/logout');
    };

    return (
        <Sidebar collapsible="icon" className="border-r border-sidebar-border">
            <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
                <Link href="/" className="block">
                    <p className="font-heading text-xl tracking-tight text-sidebar-primary">
                        {storeSettings.store_name}
                    </p>
                    <p className="mt-1 font-body text-xs text-sidebar-foreground/60">{panelTitle}</p>
                </Link>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-sidebar-foreground/50">Menu</SidebarGroupLabel>
                    <SidebarMenu>
                        {links.map((link) => (
                            <SidebarMenuItem key={link.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive(link.href, pathname)}
                                    className={cn(
                                        'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                        isActive(link.href, pathname) &&
                                            'bg-sidebar-accent text-sidebar-primary',
                                    )}
                                >
                                    <Link href={link.href}>
                                        <link.icon className="h-4 w-4" />
                                        <span>{link.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                {variant === 'user' && auth.user?.role === 'admin' && (
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-sidebar-foreground/50">Admin</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href="/admin">
                                        <Store className="h-4 w-4" />
                                        <span>Admin Panel</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border">
                {auth.user && (
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton
                                        size="lg"
                                        className="text-sidebar-foreground hover:bg-sidebar-accent"
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
                                            {getInitials(auth.user.name)}
                                        </div>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-medium">{auth.user.name}</span>
                                            <span className="truncate text-xs text-sidebar-foreground/60">
                                                {auth.user.email}
                                            </span>
                                        </div>
                                        <ChevronsUpDown className="ml-auto h-4 w-4" />
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel className="font-normal">
                                        <p className="text-sm font-medium">{auth.user.name}</p>
                                        <p className="text-xs text-muted-foreground">{auth.user.email}</p>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/settings/profile">
                                            <Settings className="mr-2 h-4 w-4" />
                                            Settings
                                        </Link>
                                    </DropdownMenuItem>
                                    {auth.user.role === 'admin' && (
                                        <DropdownMenuItem asChild>
                                            <Link href="/admin">
                                                <Store className="mr-2 h-4 w-4" />
                                                Admin Panel
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={signOut}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Sign out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                    </SidebarMenu>
                )}
            </SidebarFooter>
        </Sidebar>
    );
}
