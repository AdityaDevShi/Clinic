export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
    try {
        const { email, otp } = await req.json();

        if (!email || !otp || typeof email !== 'string' || typeof otp !== 'string') {
            return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
        }

        const adminDb = getAdminDb();
        const docRef = adminDb.collection('otp_verifications').doc(email);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
        }

        const data = docSnap.data()!;

        // Check if expired
        const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
        if (new Date() > expiresAt) {
            // Clean up expired OTP
            await docRef.delete();
            return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
        }

        // Brute-force guard: a 6-digit code is guessable if attempts are
        // unlimited. Lock the code after 5 wrong tries.
        const attempts = data.attempts || 0;
        if (attempts >= 5) {
            await docRef.delete();
            return NextResponse.json({ error: 'Too many incorrect attempts. Please request a new code.' }, { status: 429 });
        }

        if (data.otp !== otp) {
            await docRef.update({ attempts: attempts + 1 });
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
        }

        // OTP Valid! Delete it to prevent reuse
        await docRef.delete();

        return NextResponse.json({ success: true, message: 'OTP verified successfully' });
    } catch (error: unknown) {
        console.error('Error verifying OTP:', error);
        return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 });
    }
}
