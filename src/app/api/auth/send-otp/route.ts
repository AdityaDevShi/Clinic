export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { sendEmail } from '@/lib/email';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email || typeof email !== 'string') {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store in Firestore
        const adminDb = getAdminDb();
        await adminDb.collection('otp_verifications').doc(email).set({
            otp,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
        });

        // Send Email
        await sendEmail(
            email,
            'Your Verification Code',
            `Your verification code is ${otp}. It expires in 10 minutes.`,
            `<p>Your verification code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`
        );

        return NextResponse.json({ success: true, message: 'OTP sent successfully' });
    } catch (error: unknown) {
        console.error('Error sending OTP:', error);
        return NextResponse.json({ error: 'Failed to send verification code. Please try again.' }, { status: 500 });
    }
}
