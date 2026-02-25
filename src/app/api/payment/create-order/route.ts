import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getAdminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { therapistId, sessionsCount, uId, bookingIds } = body;

        if (!therapistId || !sessionsCount || !uId || !bookingIds) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Securely fetch the therapist's price from the database
        const adminDb = getAdminDb();
        const therapistDoc = await adminDb.collection('therapists').doc(therapistId).get();
        if (!therapistDoc.exists) {
            return NextResponse.json({ error: 'Therapist not found' }, { status: 404 });
        }

        const therapistData = therapistDoc.data();
        // Check both 'price' and 'hourlyRate' fields, handle string values
        const rawPrice = therapistData?.price || therapistData?.hourlyRate;
        const pricePerSession = typeof rawPrice === 'string' ? parseFloat(rawPrice) : rawPrice;

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
            receipt: `rcpt_${uId}_${Date.now()}`.substring(0, 40),
            notes: {
                therapistId,
                uId,
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
