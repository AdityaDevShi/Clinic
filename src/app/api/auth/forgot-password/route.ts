export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin';
import { sendEmail } from '@/lib/email';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email || typeof email !== 'string') {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // 1. Check if the user exists in Firebase Auth
        const adminAuth = getAdminAuth();
        let userRecord;
        try {
            userRecord = await adminAuth.getUserByEmail(email);
        } catch {
            // Don't reveal whether the email exists — always say "sent"
            return NextResponse.json({ success: true, message: 'If an account exists with this email, a reset link has been sent.' });
        }

        // 2. Generate a secure reset token
        const token = crypto.randomBytes(32).toString('hex');

        // 3. Store token in Firestore with 1-hour expiry
        const adminDb = getAdminDb();
        await adminDb.collection('password_resets').doc(token).set({
            uid: userRecord.uid,
            email: email.toLowerCase(),
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            used: false
        });

        // 4. Build the reset link
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://arambh.net';
        const resetLink = `${baseUrl}/reset-password?token=${token}`;

        // 5. Send the branded email
        await sendEmail(
            email,
            'Reset Your Password — Arambh Clinic',
            `You requested a password reset. Click this link to set a new password: ${resetLink}\n\nThis link expires in 1 hour. If you didn't request this, you can safely ignore this email.`,
            `
            <div style="font-family: 'Georgia', serif; max-width: 500px; margin: 0 auto; padding: 32px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #4f6e5b; margin: 0; font-size: 24px;">Arambh Clinic</h2>
                    <p style="color: #888; font-size: 14px; margin-top: 4px;">Mental Health Centre</p>
                </div>
                <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;" />
                <h3 style="color: #333; font-size: 18px;">Reset Your Password</h3>
                <p style="color: #555; line-height: 1.6; font-size: 15px;">
                    We received a request to reset the password for your account. Click the button below to set a new password.
                </p>
                <div style="text-align: center; margin: 28px 0;">
                    <a href="${resetLink}" style="display: inline-block; padding: 12px 32px; background-color: #4f6e5b; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #999; font-size: 13px; line-height: 1.5;">
                    This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
                <p style="color: #aaa; font-size: 12px; text-align: center;">
                    © ${new Date().getFullYear()} Arambh Clinic. All rights reserved.
                </p>
            </div>
            `
        );

        return NextResponse.json({ success: true, message: 'If an account exists with this email, a reset link has been sent.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Failed to process request. Please try again.' }, { status: 500 });
    }
}
