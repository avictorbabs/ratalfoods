import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { route as ziggyRoute } from 'ziggy-js';
import type { Config } from 'ziggy-js';
import { CartProvider } from '@/lib/cart-store';
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
    'verification.send': '/verify-email',
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
            <CartProvider>
                <App {...props} />
            </CartProvider>,
        );
    },
    progress: {
        color: '#E1B44C',
    },
});

initializeTheme();
