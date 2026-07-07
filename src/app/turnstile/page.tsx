'use client';

/**
 * Minimal Turnstile host page for the mobile app.
 * The app opens this in a WebView; when the user passes the check we post
 * the token back via window.ReactNativeWebView.postMessage. If Turnstile
 * isn't configured (no site key), we immediately post `disabled` so the
 * app proceeds without a token (server won't enforce either).
 */

import { useEffect, useRef } from 'react';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

declare global {
    interface Window {
        ReactNativeWebView?: { postMessage: (data: string) => void };
    }
}

function post(data: object) {
    window.ReactNativeWebView?.postMessage(JSON.stringify(data));
}

export default function TurnstileHostPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const renderedRef = useRef(false);

    useEffect(() => {
        if (!SITE_KEY) {
            post({ type: 'disabled' });
            return;
        }
        if (renderedRef.current) return;

        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.onload = () => {
            const turnstile = (window as unknown as {
                turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => void };
            }).turnstile;
            if (!containerRef.current || !turnstile || renderedRef.current) return;
            renderedRef.current = true;
            turnstile.render(containerRef.current, {
                sitekey: SITE_KEY,
                theme: 'light',
                callback: (token: string) => post({ type: 'token', token }),
                'error-callback': () => post({ type: 'error' }),
                'expired-callback': () => post({ type: 'expired' }),
            });
        };
        document.head.appendChild(script);
    }, []);

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                background: '#fdfcfa',
                fontFamily: 'system-ui, sans-serif',
            }}
        >
            <p style={{ color: '#525252', fontSize: 15, margin: 0, padding: '0 24px', textAlign: 'center' }}>
                Quick check that you&apos;re human
            </p>
            <div ref={containerRef} />
        </div>
    );
}
