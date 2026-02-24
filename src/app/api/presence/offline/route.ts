import { NextResponse } from 'next/server';
import { db, rtdb } from '@/lib/firebase/server';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, get } from 'firebase/database';
import { differenceInMinutes } from 'date-fns';

export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        const body = JSON.parse(rawBody);
        const { therapistId, beaconTime: clientBeaconTime } = body;

        // Use client beacon time if available, otherwise fallback to server time when request was received
        const beaconTime = clientBeaconTime || Date.now();

        if (!therapistId) {
            return NextResponse.json({ error: 'Missing therapistId' }, { status: 400 });
        }

        // Wait for 15 seconds to see if the user reconnects (e.g., this was just a page refresh)
        // If they refreshed, their new page will send a heartbeat and update `lastOnline`
        await new Promise((resolve) => setTimeout(resolve, 15000));

        // After the wait, check their Firestore lastOnline timestamp
        const therapistRef = doc(db, 'therapists', therapistId);
        const currentDoc = await getDoc(therapistRef);

        if (currentDoc.exists()) {
            const data = currentDoc.data();

            if (data.isOnline && data.lastOnline) {
                const lastOnlineTime = data.lastOnline.toDate().getTime();

                // Has the user sent a heartbeat AFTER this beacon was triggered?
                // We add a 2 second buffer because clock sync between client and server might be slightly off.
                // If their lastOnlineTime is OLDER than the time they supposedly dropped off, they are actually offline.
                if (lastOnlineTime <= beaconTime + 2000) {
                    // Log work hours
                    const sessionStart = data.currentSessionStart;
                    if (sessionStart) {
                        const startTime = sessionStart.toDate();
                        const endTime = new Date(); // use current time of disconnect
                        const duration = differenceInMinutes(endTime, startTime);

                        if (duration > 0) {
                            await addDoc(collection(db, 'work_logs'), {
                                therapistId,
                                startTime: sessionStart,
                                endTime: Timestamp.fromDate(endTime),
                                durationMinutes: duration,
                                createdAt: serverTimestamp()
                            });
                        }
                    }

                    // Set offline in Firestore
                    await setDoc(therapistRef, {
                        isOnline: false,
                        lastOnline: serverTimestamp(),
                        currentSessionStart: null
                    }, { merge: true });

                    return NextResponse.json({ status: 'offline_processed' });
                } else {
                    return NextResponse.json({ status: 'ignored_reconnected' });
                }
            }
        }

        return NextResponse.json({ status: 'offline_processed' });
    } catch (error) {
        console.error('API /presence/offline error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
