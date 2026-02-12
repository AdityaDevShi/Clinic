export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/server'; // Ensure this is server-compatible or use admin SDK if needed. 
// Note: Client SDK in API routes works but Admin SDK is better. 
// For now, using existing config assuming it initializes properly in Node env or we will fix.
// Actually, standard firebase client SDK works in Next.js API routes (Edge/Node).
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { sendEmail } from '@/lib/email';
// We need a server-side initialized firebase for API routes if not already present.
// The current @/lib/firebase likely uses client SDK.
// It is okay for simple prototyping, but for production, Admin SDK is recommended.
// proceeding with client SDK logic for now as per 'db' import availability.

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
        // We use the email as the document ID for simplicity in 'otp_verifications' collection
        await setDoc(doc(db, 'otp_verifications', email), {
            otp,
            createdAt: serverTimestamp(),
            // Optional: Expiration logic can be handled in verify or via TTL policy
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
