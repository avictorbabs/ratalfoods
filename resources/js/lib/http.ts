import { FRIENDLY_GENERIC_ERROR, FRIENDLY_NETWORK_ERROR } from '@/lib/notify';

type JsonResult<T> = { ok: boolean; status: number; data: T & { message?: string } };

function xsrfToken(): string {
    const match = document.cookie.split('; ').find((row) => row.startsWith('XSRF-TOKEN='));

    return match ? decodeURIComponent(match.split('=')[1]) : '';
}

async function request<T>(url: string, init: RequestInit): Promise<JsonResult<T>> {
    try {
        const response = await fetch(url, {
            credentials: 'same-origin',
            ...init,
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(init.headers ?? {}),
            },
        });

        const data = (await response.json().catch(() => ({}))) as T & { message?: string };

        // Never surface a raw server message for failures we did not expect.
        if (!response.ok && !data.message) {
            data.message = FRIENDLY_GENERIC_ERROR;
        }

        return { ok: response.ok, status: response.status, data };
    } catch {
        // Offline, blocked or timed out: report it as a normal failed result instead of throwing.
        return { ok: false, status: 0, data: { message: FRIENDLY_NETWORK_ERROR } as T & { message?: string } };
    }
}

/** POST JSON to a same-origin Laravel route (small background calls outside Inertia). Never throws. */
export function postJson<T = unknown>(url: string, body: unknown): Promise<JsonResult<T>> {
    return request<T>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': xsrfToken() },
        body: JSON.stringify(body),
    });
}

/** GET JSON from a same-origin Laravel route. Never throws. */
export function getJson<T = unknown>(url: string): Promise<JsonResult<T>> {
    return request<T>(url, { method: 'GET' });
}
