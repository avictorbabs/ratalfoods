import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { Link, router, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    Award,
    CalendarCheck,
    CalendarDays,
    ChevronDown,
    ChevronsUpDown,
    ExternalLink,
    FileText,
    House,
    Image,
    Images,
    Info,
    LayoutGrid,
    LogOut,
    Mail,
    MapPinned,
    Package,
    PanelBottom,
    Repeat,
    Settings,
    ShoppingBag,
    Store,
    Tags,
    Ticket,
    UtensilsCrossed,
} from 'lucide-react';

type DashboardSidebarProps = {
    variant: 'admin' | 'user';
};

type NavLink = {
    title: string;
    href: string;
    icon: LucideIcon;
    external?: boolean;
    requiresLoyalty?: boolean;
};

const adminLinks: NavLink[] = [
    { title: 'Dashboard', href: '/admin', icon: LayoutGrid },
    { title: 'Products', href: '/admin/products', icon: Package },
    { title: 'Categories', href: '/admin/categories', icon: Tags },
    { title: 'Gallery', href: '/admin/gallery', icon: Image },
    { title: 'Blogs', href: '/admin/blogs', icon: FileText },
    { title: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { title: 'Delivery Fees', href: '/admin/delivery-fees', icon: MapPinned },
    { title: 'Coupons', href: '/admin/coupons', icon: Ticket },
    { title: 'Loyalty', href: '/admin/loyalty', icon: Award },
    { title: 'Bookings', href: '/admin/bookings', icon: CalendarDays },
    { title: 'View Store', href: '/', icon: ExternalLink, external: true },
];

const adminPageLinks: NavLink[] = [
    { title: 'Home', href: '/admin/pages/home', icon: House },
    { title: 'About', href: '/admin/pages/about', icon: Info },
    { title: 'Contact', href: '/admin/pages/contact', icon: Mail },
    { title: 'Booking', href: '/admin/pages/booking', icon: CalendarCheck },
    { title: 'Menu', href: '/admin/pages/menu', icon: UtensilsCrossed },
    { title: 'Gallery', href: '/admin/pages/gallery', icon: Images },
    { title: 'Footer', href: '/admin/pages/footer', icon: PanelBottom },
];

const userLinks: NavLink[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { title: 'My Orders', href: '/dashboard/orders', icon: ShoppingBag },
    { title: 'My Bookings', href: '/dashboard/bookings', icon: CalendarDays },
    { title: 'Repeat Orders', href: '/dashboard/recurring', icon: Repeat },
    { title: 'My Points', href: '/dashboard/points', icon: Award, requiresLoyalty: true },
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

function navButtonClass(active: boolean): string {
    return cn(
        'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        active && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium',
    );
}

export default function DashboardSidebar({ variant }: DashboardSidebarProps) {
    const { auth, storeSettings, footerContent, loyalty } = usePage<SharedData>().props;
    const pathname = usePage().url.split('?')[0] ?? '/';
    const links = (variant === 'admin' ? adminLinks : userLinks).filter((link) => !link.requiresLoyalty || loyalty !== null);
    const panelTitle = variant === 'admin' ? 'Admin Dashboard' : 'My Account';

    return (
        <Sidebar collapsible="icon" className="border-sidebar-border border-r">
            <SidebarHeader className="border-sidebar-border border-b px-4 py-5">
                <Link href="/" className="flex items-center gap-3">
                    {footerContent.logo ? (
                        <img
                            src={footerContent.logo}
                            alt={footerContent.brand_name || storeSettings.store_name}
                            className="h-10 w-auto max-w-[120px] shrink-0 object-contain"
                        />
                    ) : (
                        <p className="font-heading text-sidebar-primary text-xl tracking-tight">
                            {footerContent.brand_name || storeSettings.store_name}
                        </p>
                    )}
                    <span className="bg-sidebar-border h-8 w-px shrink-0" aria-hidden="true" />
                    <p className="font-body text-sidebar-foreground/70 text-xs">{panelTitle}</p>
                </Link>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-sidebar-foreground/55">Menu</SidebarGroupLabel>
                    <SidebarMenu>
                        {links.map((link) => (
                            <SidebarMenuItem key={link.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive(link.href, pathname)}
                                    className={navButtonClass(isActive(link.href, pathname))}
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

                {variant === 'admin' && (
                    <Collapsible defaultOpen={pathname.startsWith('/admin/pages')} className="group/pages">
                        <SidebarGroup>
                            <SidebarGroupLabel asChild className="text-sidebar-foreground/55">
                                <CollapsibleTrigger className="hover:text-sidebar-foreground w-full cursor-pointer">
                                    Pages
                                    <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/pages:rotate-180" />
                                </CollapsibleTrigger>
                            </SidebarGroupLabel>
                            <CollapsibleContent>
                                <SidebarMenu>
                                    {adminPageLinks.map((link) => (
                                        <SidebarMenuItem key={link.title}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive(link.href, pathname)}
                                                className={navButtonClass(isActive(link.href, pathname))}
                                            >
                                                <Link href={link.href}>
                                                    <link.icon className="h-4 w-4" />
                                                    <span>{link.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </CollapsibleContent>
                        </SidebarGroup>
                    </Collapsible>
                )}

                {variant === 'user' && auth.user?.role === 'admin' && (
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-sidebar-foreground/55">Admin</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className={navButtonClass(false)}>
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

            <SidebarFooter className="border-sidebar-border border-t">
                {auth.user && (
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton
                                        size="lg"
                                        className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                    >
                                        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold">
                                            {getInitials(auth.user.name)}
                                        </div>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-medium">{auth.user.name}</span>
                                            <span className="text-sidebar-foreground/60 truncate text-xs">{auth.user.email}</span>
                                        </div>
                                        <ChevronsUpDown className="ml-auto h-4 w-4" />
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="top" align="end" className="z-50 w-56" sideOffset={8}>
                                    <DropdownMenuLabel className="font-normal">
                                        <p className="text-sm font-medium">{auth.user.name}</p>
                                        <p className="text-muted-foreground text-xs">{auth.user.email}</p>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="cursor-pointer" onSelect={() => router.visit('/settings/profile')}>
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="cursor-pointer" onSelect={() => router.post('/logout')}>
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
