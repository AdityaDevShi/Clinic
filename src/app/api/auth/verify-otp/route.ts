export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/server';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';

export async function POST(req: Request) {
    try {
        const { email, otp } = await req.json();

        if (!email || !otp || typeof email !== 'string' || typeof otp !== 'string') {
            return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
        }

        const docRef = doc(db, 'otp_verifications', email);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
        }

        const data = docSnap.data();

        // Check if expired
        // Firestore timestamps need conversion if coming from serverTimestamp() but here likely Date or Timestamp
        const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
        if (new Date() > expiresAt) {
            // Clean up expired OTP
            await deleteDoc(docRef);
            return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
        }

        if (data.otp !== otp) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
        }

        // OTP Valid! Delete it to prevent reuse
        await deleteDoc(docRef);

        return NextResponse.json({ success: true, message: 'OTP verified successfully' });
    } catch (error: unknown) {
        console.error('Error verifying OTP:', error);
        return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 });
    }
}
