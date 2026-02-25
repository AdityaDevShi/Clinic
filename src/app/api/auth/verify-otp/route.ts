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

        if (data.otp !== otp) {
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
