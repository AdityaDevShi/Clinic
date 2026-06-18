import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getAdminDb, verifyRequestUid } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        // Authenticate: derive the caller's uid from the verified ID token,
        // never from the request body (which is attacker-controlled).
        const requestingUid = await verifyRequestUid(req);
        if (!requestingUid) {
            return NextResponse.json({ error: 'Unauthorized: invalid or missing auth token' }, { status: 401 });
        }

        const body = await req.json();
        const { therapistId, bookingIds } = body;

        if (!therapistId || !Array.isArray(bookingIds) || bookingIds.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const adminDb = getAdminDb();

        // Validate every referenced booking exists and belongs to the caller.
        // This stops a user from creating an order tied to arbitrary or other
        // users' bookings. The session count is derived from these
        // server-verified bookings — never trusted from the client.
        for (const id of bookingIds) {
            const bookingSnap = await adminDb.collection('bookings').doc(String(id)).get();
            if (!bookingSnap.exists || bookingSnap.data()?.clientId !== requestingUid) {
                return NextResponse.json({ error: 'Invalid booking reference' }, { status: 403 });
            }
        }
        const sessionsCount = bookingIds.length;

        // 1. Securely fetch the therapist's price from the database
        const therapistDoc = await adminDb.collection('therapists').doc(therapistId).get();
        if (!therapistDoc.exists) {
            return NextResponse.json({ error: 'Therapist not found' }, { status: 404 });
        }

        const therapistData = therapistDoc.data();
        // Check both 'price' and 'hourlyRate' fields, handle string values
        const rawPrice = therapistData?.price || therapistData?.hourlyRate;
        const originalPrice = typeof rawPrice === 'string' ? parseFloat(rawPrice) : rawPrice;

        // Use discounted rate if discount is enabled and valid
        const discountEnabled = therapistData?.discountEnabled === true;
        const rawDiscountedRate = therapistData?.discountedRate;
        const discountedRate = typeof rawDiscountedRate === 'string' ? parseFloat(rawDiscountedRate) : rawDiscountedRate;

        const pricePerSession = (discountEnabled && discountedRate && !isNaN(discountedRate) && discountedRate > 0 && discountedRate < originalPrice)
            ? discountedRate
            : originalPrice;

        if (!pricePerSession || isNaN(pricePerSession) || pricePerSession <= 0) {
            console.error('Invalid price for therapist:', therapistId, 'data:', therapistData);
            return NextResponse.json({ error: 'Invalid price configuration for therapist' }, { status: 500 });
        }

        // 2. Calculate purely based on safe server values
        const totalAmount = pricePerSession * sessionsCount;
        const amountInPaise = totalAmount * 100;

        // 3. Initialize Razorpay Server SDK
        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID as string,
            key_secret: process.env.RAZORPAY_KEY_SECRET as string,
        });

        // 4. Generate the Order
        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `rcpt_${requestingUid}_${Date.now()}`.substring(0, 40),
            notes: {
                therapistId,
                uId: requestingUid,
                sessionsCount: sessionsCount.toString(),
                bookingIds: bookingIds.join(',')
            }
        };

        const order = await instance.orders.create(options);

        return NextResponse.json({
            id: order.id,
            currency: order.currency,
            amount: order.amount,
            displayAmount: totalAmount
        });

    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
    }
}
