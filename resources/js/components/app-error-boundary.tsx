import { Component, type ErrorInfo, type ReactNode } from 'react';

type State = { failed: boolean };

/**
 * Last line of defence: if a page crashes while rendering, show a calm
 * message with a way forward instead of a blank screen.
 */
export default class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
    state: State = { failed: false };

    static getDerivedStateFromError(): State {
        return { failed: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error('Page crashed', error, info.componentStack);
    }

    render() {
        if (!this.state.failed) {
            return this.props.children;
        }

        return (
            <div className="bg-background flex min-h-screen items-center justify-center px-4">
                <div className="border-border max-w-md rounded-xl border bg-white p-8 text-center shadow-sm">
                    <h1 className="font-heading text-2xl">Something went wrong</h1>
                    <p className="font-body text-muted-foreground mt-3 text-sm">
                        We hit a snag showing this page. Your cart is safe. Please try again, or head back to the home page.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="bg-primary text-primary-foreground rounded-md px-5 py-2.5 text-sm font-medium"
                        >
                            Try again
                        </button>
                        <a href="/" className="border-border rounded-md border px-5 py-2.5 text-sm font-medium">
                            Go to home page
                        </a>
                    </div>
                </div>
            </div>
        );
    }
}
