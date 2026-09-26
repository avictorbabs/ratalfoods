import { Link } from '@inertiajs/react';

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
};

export function Pagination<T>({ page }: { page: Paginated<T> }) {
    if (page.last_page <= 1) {
        return null;
    }

    const link = 'rounded-md border border-border px-3 py-1.5 font-body text-sm';

    return (
        <div className="border-border flex items-center justify-between border-t px-6 py-4">
            <span className="font-body text-muted-foreground text-xs">
                Page {page.current_page} of {page.last_page} · {page.total} total
            </span>
            <div className="flex gap-2">
                {page.prev_page_url ? (
                    <Link href={page.prev_page_url} className={`${link} hover:bg-muted`}>
                        Previous
                    </Link>
                ) : (
                    <span className={`${link} opacity-40`}>Previous</span>
                )}
                {page.next_page_url ? (
                    <Link href={page.next_page_url} className={`${link} hover:bg-muted`}>
                        Next
                    </Link>
                ) : (
                    <span className={`${link} opacity-40`}>Next</span>
                )}
            </div>
        </div>
    );
}
