import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payment/verify-payment
 * 
 * Server-side Razorpay payment verification.
 * Called by the client after Razorpay checkout succeeds.
 * Verifies the signature and marks bookings as paid with full transaction metadata.
 * 
 * This acts as a reliable complement to the webhook — whichever fires first
 * sets the payment data; the second is a no-op (idempotent).
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            bookingIds
        } = body;

        // Validate required fields
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !bookingIds?.length) {
            return NextResponse.json(
                { error: 'Missing required fields: razorpay_payment_id, razorpay_order_id, razorpay_signature, bookingIds' },
                { status: 400 }
            );
        }

        // 1. Verify the Razorpay Signature (server-side, tamper-proof)
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
            console.error('CRITICAL: RAZORPAY_KEY_SECRET is not configured.');
            return NextResponse.json({ error: 'Payment verification not configured' }, { status: 500 });
        }

        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            console.error('Payment verification failed: signature mismatch.');
            return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
        }

        // 2. Signature verified — update all bookings in a batch
        const adminDb = getAdminDb();
        const batch = adminDb.batch();
        const now = new Date();

        for (const bookingId of bookingIds) {
            const trimmedId = bookingId.trim();
            if (!trimmedId) continue;

            const bookingRef = adminDb.collection('bookings').doc(trimmedId);
            batch.update(bookingRef, {
                status: 'confirmed',
                paymentStatus: 'paid',
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                paidAt: now,
                updatedAt: now,
            });
        }

        await batch.commit();

        console.log(`Payment verified & ${bookingIds.length} booking(s) confirmed. PaymentID: ${razorpay_payment_id}`);

        return NextResponse.json({
            success: true,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            bookingsConfirmed: bookingIds.length,
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        return NextResponse.json(
            { error: 'Internal server error during payment verification' },
            { status: 500 }
        );
    }
}
