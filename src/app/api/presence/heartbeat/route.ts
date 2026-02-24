import { NextResponse } from 'next/server';
import { db, rtdb } from '@/lib/firebase/server';
import { ref, set, onDisconnect } from 'firebase/database';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        if (!rawBody) return NextResponse.json({ status: 'ignored' });

        const body = JSON.parse(rawBody);
        const { therapistId } = body;

        if (!therapistId) {
            return NextResponse.json({ error: 'Missing therapistId' }, { status: 400 });
        }

        // We use the admin/server SDK to write to RTDB
        if (rtdb) {
            const presenceRef = ref(rtdb, `/presence/${therapistId}`);

            // Set them online in RTDB
            await set(presenceRef, {
                online: true,
                lastSeen: Date.now()
            });

            // If the server connection drops, disconnect them
            // Note: In serverless, onDisconnect is less reliable than in a persistent Node server,
            // so we primarily rely on the timestamp-based heartbeat check that we'll implement later if needed.
            // But we'll keep it here just in case.
            onDisconnect(presenceRef).remove();
        }

        // We also want to make sure Firestore shows them as online, without resetting their session start time
        if (db) {
            const therapistRef = doc(db, 'therapists', therapistId);
            await setDoc(therapistRef, {
                isOnline: true,
                lastOnline: serverTimestamp()
            }, { merge: true });
        }

        return NextResponse.json({ status: 'heartbeat_received' });
    } catch (error) {
        console.error('API /presence/heartbeat error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
