import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getAdminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { bookingId, requestingUid } = body;

        if (!bookingId || !requestingUid) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch user to verify role securely
        const adminDb = getAdminDb();
        const userDoc = await adminDb.collection('users').doc(requestingUid).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: 'Unauthorized user' }, { status: 401 });
        }
        const requestingUser = userDoc.data();
        const role = requestingUser?.role || 'client';

        // 2. Fetch the Booking
        const bookingRef = adminDb.collection('bookings').doc(bookingId);
        const bookingDoc = await bookingRef.get();

        if (!bookingDoc.exists) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }
        const bookingData = bookingDoc.data();

        // 3. Security Check: Is user authorized to cancel this booking?
        if (role === 'client' && bookingData?.clientId !== requestingUid) {
            return NextResponse.json({ error: 'Unauthorized to cancel this booking' }, { status: 403 });
        }

        // 4. Time Check (24-Hour Rule for Clients)
        if (role === 'client') {
            const sessionTime = bookingData?.sessionTime?.toDate();
            if (!sessionTime) {
                return NextResponse.json({ error: 'Invalid session time data' }, { status: 500 });
            }

            const now = new Date();
            const timeDifferenceInMs = sessionTime.getTime() - now.getTime();
            const hoursUntilSession = timeDifferenceInMs / (1000 * 60 * 60);

            if (hoursUntilSession < 24) {
                return NextResponse.json({ error: 'Clients cannot cancel sessions less than 24 hours in advance' }, { status: 403 });
            }
        }

        // 5. Check if Payment Needs to be Refunded
        const paymentId = bookingData?.paymentId;
        const paymentStatus = bookingData?.paymentStatus;

        let refundId = null;

        if (paymentStatus === 'paid' && paymentId) {
            // 6. Initiate Razorpay Refund
            const instance = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID as string,
                key_secret: process.env.RAZORPAY_KEY_SECRET as string,
            });

            console.log(`Processing automatic refund for payment: ${paymentId}`);
            const refund = await instance.payments.refund(paymentId, {
                notes: {
                    bookingId,
                    cancelledBy: role,
                    reason: 'Automated 24h cancellation'
                }
            });

            refundId = refund.id;
        }

        // 7. Update Database safely
        await bookingRef.update({
            status: 'cancelled',
            paymentStatus: refundId ? 'refunded' : paymentStatus,
            refundId: refundId || null,
            updatedAt: new Date()
        });

        return NextResponse.json({ success: true, refunded: !!refundId, refundId });

    } catch (error) {
        console.error('Error in secure cancellation process:', error);
        return NextResponse.json({ error: 'Internal server error processing cancellation' }, { status: 500 });
    }
}
