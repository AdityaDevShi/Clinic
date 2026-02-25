export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { uid, email, name } = body;

        if (!uid || typeof uid !== 'string' || !email) {
            return NextResponse.json({ error: 'Missing user information' }, { status: 400 });
        }

        // 1. Verify that the user exists in Firebase Auth
        const adminAuth = getAdminAuth();
        const userRecord = await adminAuth.getUser(uid);
        if (userRecord.email !== email) {
            return NextResponse.json({ error: 'Email mismatch' }, { status: 400 });
        }

        let role = 'client';

        // 2. Securely determine role
        if (email === 'care@arambh.net') {
            role = 'admin';
        } else {
            // Check for pre-existing therapist invite securely on the server
            const adminDb = getAdminDb();
            const therapistsRef = adminDb.collection('therapists');
            const querySnapshot = await therapistsRef.where('email', '==', email).limit(1).get();

            if (!querySnapshot.empty) {
                const inviteDoc = querySnapshot.docs[0];
                const inviteData = inviteDoc.data();

                console.log('Found therapist invite during secure registration, linking account...');
                role = 'therapist';

                // Migrate pre-filled data to the new Auth UID document
                await adminDb.collection('therapists').doc(uid).set({
                    ...inviteData,
                    id: uid,
                    updatedAt: new Date()
                });

                // Delete the temporary admin-created document
                await inviteDoc.ref.delete();
            }
        }

        // 3. Create user document securely
        const adminDb = getAdminDb();
        await adminDb.collection('users').doc(uid).set({
            email,
            name,
            role,
            createdAt: new Date(),
        });

        return NextResponse.json({ success: true, role });

    } catch (error) {
        console.error('Error in secure profile registration:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
