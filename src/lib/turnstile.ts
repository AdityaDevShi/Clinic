/**
 * Cloudflare Turnstile server-side verification.
 *
 * Enforcement is keyed off TURNSTILE_SECRET_KEY: when it is not configured,
 * verification passes (feature dormant). This lets the token plumbing ship
 * ahead of the keys — set the secret + NEXT_PUBLIC_TURNSTILE_SITE_KEY and
 * redeploy to turn the captcha on everywhere at once.
 */
export async function verifyTurnstileToken(
    token: string | undefined | null,
    remoteIp?: string | null
): Promise<{ ok: boolean; error?: string }> {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
        return { ok: true }; // Not configured — captcha disabled.
    }

    if (!token) {
        return { ok: false, error: 'Captcha verification required' };
    }

    try {
        const params = new URLSearchParams({ secret, response: token });
        if (remoteIp) params.append('remoteip', remoteIp);

        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });
        const data = await res.json();

        if (data.success === true) {
            return { ok: true };
        }
        console.warn('Turnstile verification failed:', data['error-codes']);
        return { ok: false, error: 'Captcha verification failed. Please try again.' };
    } catch (error) {
        // Fail open on Cloudflare outages — availability of OTP/contact beats
        // strictness here; rate limits still apply underneath.
        console.error('Turnstile siteverify error (failing open):', error);
        return { ok: true };
    }
}
