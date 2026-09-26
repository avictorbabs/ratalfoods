import '../css/app.css';

import AppErrorBoundary from '@/components/app-error-boundary';
import { CartProvider } from '@/lib/cart-store';
import { FRIENDLY_GENERIC_ERROR, FRIENDLY_NETWORK_ERROR, notify } from '@/lib/notify';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import type { Config } from 'ziggy-js';
import { route as ziggyRoute } from 'ziggy-js';
import { initializeTheme } from './hooks/use-appearance';

declare global {
    // eslint-disable-next-line no-var
    var route: typeof ziggyRoute;

    interface Window {
        Ziggy?: Config;
    }
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const routeFallbacks: Record<string, string> = {
    home: '/',
    login: '/login',
    register: '/register',
    'password.request': '/forgot-password',
    'password.email': '/forgot-password',
    'password.reset': '/reset-password',
    'password.store': '/reset-password',
    'password.confirm': '/confirm-password',
    'password.update': '/settings/password',
    'profile.edit': '/settings/profile',
    'profile.update': '/settings/profile',
    'profile.destroy': '/settings/profile',
    'verification.send': '/email/verification-notification',
    logout: '/logout',
    dashboard: '/dashboard',
    'admin.dashboard': '/admin',
};

function configureRoute(): void {
    if (typeof window !== 'undefined' && window.Ziggy) {
        globalThis.route = ((name, params, absolute) =>
            ziggyRoute(name, params, absolute, {
                ...window.Ziggy!,
                location: new URL(window.Ziggy!.location),
            })) as typeof ziggyRoute;

        return;
    }

    globalThis.route = ((name) => routeFallbacks[name] ?? '/') as typeof ziggyRoute;
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        configureRoute();

        const root = createRoot(el);

        root.render(
            <AppErrorBoundary>
                <CartProvider>
                    <App {...props} />
                </CartProvider>
            </AppErrorBoundary>,
        );
    },
    progress: {
        color: '#E1B44C',
    },
});

initializeTheme();

// A response Inertia cannot use (e.g. an HTML error page) or a dropped connection:
// show a friendly toast instead of Inertia's raw error modal.
router.on('invalid', (event) => {
    event.preventDefault();
    notify(FRIENDLY_GENERIC_ERROR);
});

router.on('exception', (event) => {
    event.preventDefault();
    notify(FRIENDLY_NETWORK_ERROR);
});
