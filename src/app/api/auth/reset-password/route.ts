export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin';

export async function POST(req: Request) {
    try {
        const { token, newPassword } = await req.json();

        if (!token || !newPassword) {
            return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // 1. Look up the token in Firestore
        const adminDb = getAdminDb();
        const tokenDoc = await adminDb.collection('password_resets').doc(token).get();

        if (!tokenDoc.exists) {
            return NextResponse.json({ error: 'Invalid or expired reset link. Please request a new one.' }, { status: 400 });
        }

        const tokenData = tokenDoc.data();

        // 2. Check if token is expired
        const expiresAt = tokenData?.expiresAt?.toDate ? tokenData.expiresAt.toDate() : new Date(tokenData?.expiresAt);
        if (new Date() > expiresAt) {
            // Clean up expired token
            await adminDb.collection('password_resets').doc(token).delete();
            return NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 });
        }

        // 3. Check if token was already used
        if (tokenData?.used) {
            return NextResponse.json({ error: 'This reset link has already been used. Please request a new one.' }, { status: 400 });
        }

        // 4. Update the user's password via Firebase Admin SDK
        const adminAuth = getAdminAuth();
        await adminAuth.updateUser(tokenData.uid, {
            password: newPassword
        });

        // 5. Mark token as used and delete it
        await adminDb.collection('password_resets').doc(token).update({
            used: true,
            usedAt: new Date()
        });

        // 6. Clean up — also delete any other reset tokens for this user
        const otherTokens = await adminDb.collection('password_resets')
            .where('uid', '==', tokenData.uid)
            .where('used', '==', false)
            .get();
        
        const batch = adminDb.batch();
        otherTokens.docs.forEach((doc: any) => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        return NextResponse.json({ success: true, message: 'Password updated successfully. You can now login with your new password.' });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Failed to reset password. Please try again.' }, { status: 500 });
    }
}
