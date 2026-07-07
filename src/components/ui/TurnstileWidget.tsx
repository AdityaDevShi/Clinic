'use client';

import { useEffect, useRef } from 'react';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

declare global {
    interface Window {
        turnstile?: {
            render: (el: HTMLElement, options: Record<string, unknown>) => string;
            reset: (widgetId?: string) => void;
        };
        _turnstileScriptLoading?: boolean;
    }
}

interface TurnstileWidgetProps {
    /** Called with the token when the user passes the check (null on expiry). */
    onToken: (token: string | null) => void;
}

/**
 * Cloudflare Turnstile "I'm not a robot" widget.
 * Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY is not configured, so
 * the feature can ship dormant and be enabled purely via env + redeploy.
 */
export default function TurnstileWidget({ onToken }: TurnstileWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const renderedRef = useRef(false);
    const onTokenRef = useRef(onToken);
    onTokenRef.current = onToken;

    useEffect(() => {
        if (!SITE_KEY || renderedRef.current) return;

        const renderWidget = () => {
            if (!containerRef.current || renderedRef.current || !window.turnstile) return;
            renderedRef.current = true;
            window.turnstile.render(containerRef.current, {
                sitekey: SITE_KEY,
                theme: 'light',
                callback: (token: string) => onTokenRef.current(token),
                'expired-callback': () => onTokenRef.current(null),
                'error-callback': () => onTokenRef.current(null),
            });
        };

        if (window.turnstile) {
            renderWidget();
            return;
        }

        // Load the script once across all widget instances.
        if (!window._turnstileScriptLoading) {
            window._turnstileScriptLoading = true;
            const script = document.createElement('script');
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            script.async = true;
            document.head.appendChild(script);
        }
        const interval = setInterval(() => {
            if (window.turnstile) {
                clearInterval(interval);
                renderWidget();
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    if (!SITE_KEY) return null;

    return <div ref={containerRef} className="my-4 flex justify-center" />;
}

/** Whether Turnstile is configured (forms can require a token before submit). */
export const turnstileEnabled = Boolean(SITE_KEY);
