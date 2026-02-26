import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const bodyText = await req.text();
        const signature = req.headers.get('x-razorpay-signature');

        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error("CRITICAL: Webhook secret is not configured.");
            return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
        }

        // 1. Verify the Razorpay Webhook Signature
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(bodyText)
            .digest('hex');

        if (expectedSignature !== signature) {
            console.error("Invalid Webhook Signature. Possible spoofing attack.");
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // 2. Parse payload safely
        const payload = JSON.parse(bodyText);
        const eventType = payload.event;
        const adminDb = getAdminDb();

        // 3. Handle 'payment.captured' / 'order.paid'
        if (eventType === 'payment.captured' || eventType === 'order.paid') {
            const paymentEntity = payload.payload.payment?.entity || payload.payload.order?.entity;
            const notes = paymentEntity?.notes;

            if (notes && notes.bookingIds) {
                const bookingIdArray = notes.bookingIds.split(',');

                console.log(`Webhook [${eventType}]: Updating ${bookingIdArray.length} bookings to Paid...`);

                const batch = adminDb.batch();
                let hasValidBookings = false;

                for (const bookingId of bookingIdArray) {
                    if (bookingId.trim()) {
                        const bookingRef = adminDb.collection('bookings').doc(bookingId.trim());
                        batch.update(bookingRef, {
                            status: 'confirmed',
                            paymentStatus: 'paid',
                            paymentId: paymentEntity?.id || null,
                            orderId: paymentEntity?.order_id || null,
                            paidAt: new Date(),
                            updatedAt: new Date(),
                        });
                        hasValidBookings = true;
                    }
                }

                if (hasValidBookings) {
                    await batch.commit();
                    console.log('Bookings successfully secured and marked as paid via webhook.');
                }
            } else {
                console.warn("Received valid webhook but no bookingIds found in notes.");
            }
        }

        // 4. Handle 'payment.failed'
        if (eventType === 'payment.failed') {
            const paymentEntity = payload.payload.payment?.entity;
            const notes = paymentEntity?.notes;

            if (notes && notes.bookingIds) {
                const bookingIdArray = notes.bookingIds.split(',');
                console.log(`Webhook [payment.failed]: Marking ${bookingIdArray.length} bookings as failed...`);

                const batch = adminDb.batch();
                for (const bookingId of bookingIdArray) {
                    if (bookingId.trim()) {
                        const bookingRef = adminDb.collection('bookings').doc(bookingId.trim());
                        batch.update(bookingRef, {
                            paymentStatus: 'failed',
                            failureReason: paymentEntity?.error_description || 'Payment failed',
                            updatedAt: new Date(),
                        });
                    }
                }
                await batch.commit();
                console.log('Bookings marked as payment failed via webhook.');
            }
        }

        // 5. Handle 'refund.processed' (Razorpay sends this when refund is actually completed)
        if (eventType === 'refund.processed') {
            const refundEntity = payload.payload.refund?.entity;
            const paymentId = refundEntity?.payment_id;
            const refundId = refundEntity?.id;
            const refundAmount = refundEntity?.amount ? refundEntity.amount / 100 : 0; // Razorpay sends in paise

            if (paymentId) {
                console.log(`Webhook [refund.processed]: Refund ${refundId} for payment ${paymentId}, amount ₹${refundAmount}`);

                // Find the booking by paymentId and update refund status
                const bookingsSnapshot = await adminDb.collection('bookings')
                    .where('paymentId', '==', paymentId)
                    .limit(5)
                    .get();

                if (!bookingsSnapshot.empty) {
                    const batch = adminDb.batch();
                    bookingsSnapshot.docs.forEach((doc: any) => {
                        batch.update(doc.ref, {
                            paymentStatus: 'refunded',
                            refundId: refundId || null,
                            refundAmount: refundAmount,
                            refundedAt: new Date(),
                            updatedAt: new Date(),
                        });
                    });
                    await batch.commit();
                    console.log(`Refund confirmed for ${bookingsSnapshot.size} booking(s).`);
                } else {
                    console.warn(`Refund webhook: No booking found for paymentId ${paymentId}`);
                }
            }
        }

        // Always return 200 quickly — Razorpay retries on non-200
        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: 'Internal server error processing webhook' }, { status: 500 });
    }
}

