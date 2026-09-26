export type NoticeType = 'success' | 'error';

export const NOTICE_EVENT = 'app:notice';

/** Show a toast from anywhere (the FlashToast component listens for this). */
export function notify(message: string, type: NoticeType = 'error'): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(new CustomEvent(NOTICE_EVENT, { detail: { message, type } }));
}

export const FRIENDLY_NETWORK_ERROR = 'We could not reach the server. Please check your connection and try again.';
export const FRIENDLY_GENERIC_ERROR = 'Something went wrong. Please try again in a moment.';
