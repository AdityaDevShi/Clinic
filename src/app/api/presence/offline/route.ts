import { NextResponse } from 'next/server';
import { db, rtdb } from '@/lib/firebase/server';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, get } from 'firebase/database';
import { differenceInMinutes } from 'date-fns';

export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        const body = JSON.parse(rawBody);
        const { therapistId, isUnload } = body;

        // In Serverless environments (like Vercel or Render), we CANNOT use `setTimeout` for 15 seconds
        // because the function execution will be killed or frozen immediately after we return a response.
        // If we don't return a response, the client's `sendBeacon` might hang or be ignored.
        // Therefore, we must process the offline event immediately.

        if (!therapistId) {
            return NextResponse.json({ error: 'Missing therapistId' }, { status: 400 });
        }

        const therapistRef = doc(db, 'therapists', therapistId);
        const currentDoc = await getDoc(therapistRef);

        if (currentDoc.exists()) {
            const data = currentDoc.data();

            if (data.isOnline && data.lastOnline) {
                // Determine if this is a genuine unload/close event, or just a temporary network blip
                // If the client explicitly tells us it's an unload, we respect it immediately.
                if (isUnload) {
                    // Log work hours
                    const sessionStart = data.currentSessionStart;
                    if (sessionStart) {
                        const startTime = sessionStart.toDate();
                        const endTime = new Date();
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

                    // Set offline in Firestore immediately
                    await setDoc(therapistRef, {
                        isOnline: false,
                        lastOnline: serverTimestamp(),
                        currentSessionStart: null
                    }, { merge: true });

                    return NextResponse.json({ status: 'offline_processed_immediate' });
                } else {
                    // If it's a routine check but they missed a heartbeat by over 35 seconds, 
                    // we log them off. (30s interval + 5s grace period).
                    const lastOnlineTime = data.lastOnline.toDate().getTime();
                    const now = Date.now();

                    if (now - lastOnlineTime > 35000) {
                        // They actually timed out naturally
                        await setDoc(therapistRef, {
                            isOnline: false,
                            lastOnline: serverTimestamp(),
                            currentSessionStart: null
                        }, { merge: true });
                        return NextResponse.json({ status: 'offline_due_to_timeout' });
                    }
                }
            }
        }

        return NextResponse.json({ status: 'ignored_or_processed' });
    } catch (error) {
        console.error('API /presence/offline error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
