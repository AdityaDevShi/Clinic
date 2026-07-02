import { auth } from './firebase';

/**
 * Thin client for the production API routes on arambh.net.
 * These are the same Cloud Function routes the website uses; privileged
 * calls carry the caller's Firebase ID token as a Bearer token.
 */
const BASE_URL = 'https://arambh.net';

class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

async function request<T>(
    path: string,
    body: Record<string, unknown>,
    { authenticated = true }: { authenticated?: boolean } = {}
): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (authenticated) {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new ApiError('Not signed in', 401);
        headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
    }
    return data as T;
}

export const api = {
    registerProfile: (payload: { uid: string; email: string | null; name: string }) =>
        request<{ success: boolean; role: string }>('/api/auth/register-profile', payload),

    sendOtp: (email: string) =>
        request<{ success: boolean }>('/api/auth/send-otp', { email }, { authenticated: false }),

    verifyOtp: (email: string, otp: string) =>
        request<{ success: boolean }>('/api/auth/verify-otp', { email, otp }, { authenticated: false }),

    forgotPassword: (email: string) =>
        request<{ success: boolean; message: string }>('/api/auth/forgot-password', { email }, { authenticated: false }),

    createOrder: (payload: { therapistId: string; sessionsCount: number; uId: string; bookingIds: string[] }) =>
        request<{ id: string; currency: string; amount: number; displayAmount: number }>(
            '/api/payment/create-order', payload),

    verifyPayment: (payload: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
        bookingIds: string[];
    }) => request<{ success: boolean; bookingsConfirmed: number }>('/api/payment/verify-payment', payload, { authenticated: false }),

    cancelBooking: (bookingId: string) =>
        request<{ success: boolean; refunded: boolean; lateCancel: boolean; message: string }>(
            '/api/payment/cancel-booking', { bookingId }),

    rescheduleBooking: (bookingId: string, newSessionTime: string) =>
        request<{ success: boolean; message: string }>(
            '/api/payment/reschedule-booking', { bookingId, newSessionTime }),

    saveConsent: (payload: {
        clientId: string;
        clientName: string;
        therapistName: string;
        pdfBase64: string;
        agreedAt: string;
    }) => request<{ success: boolean; consentId: string }>('/api/consent/save', payload),
};

export { ApiError };
