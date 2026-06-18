import { NextResponse } from 'next/server';
import { getAdminDb, verifyRequestUid } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { bookingId, newSessionTime } = body;

        if (!bookingId || !newSessionTime) {
            return NextResponse.json({ error: 'Missing required fields (bookingId, newSessionTime)' }, { status: 400 });
        }

        // Authenticate: derive the caller's uid from the verified ID token,
        // never from the request body (which is attacker-controlled).
        const requestingUid = await verifyRequestUid(req);
        if (!requestingUid) {
            return NextResponse.json({ error: 'Unauthorized: invalid or missing auth token' }, { status: 401 });
        }

        const adminDb = getAdminDb();

        // 1. Verify requesting user exists
        const userDoc = await adminDb.collection('users').doc(requestingUid).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: 'Unauthorized user' }, { status: 401 });
        }
        const requestingUser = userDoc.data();
        const role = requestingUser?.role || 'client';

        // 2. Fetch the Booking
        const bookingRef = adminDb.collection('bookings').doc(bookingId);
        const bookingDoc = await bookingRef.get();

        if (!bookingDoc.exists) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }
        const bookingData = bookingDoc.data();

        // 3. Security Check: Is user authorized to reschedule this booking?
        if (role === 'client' && bookingData?.clientId !== requestingUid) {
            return NextResponse.json({ error: 'Unauthorized to reschedule this booking' }, { status: 403 });
        }
        if (role === 'therapist' && bookingData?.therapistId !== requestingUid) {
            return NextResponse.json({ error: 'Unauthorized to reschedule this booking' }, { status: 403 });
        }

        // 4. Verify booking is in a reschedulable state
        if (bookingData?.status === 'cancelled' || bookingData?.status === 'completed') {
            return NextResponse.json({ error: 'Cannot reschedule a cancelled or completed booking' }, { status: 400 });
        }

        const newDate = new Date(newSessionTime);
        if (isNaN(newDate.getTime())) {
            return NextResponse.json({ error: 'Invalid session time provided' }, { status: 400 });
        }

        // 5. Check if new date is in the future
        if (newDate <= new Date()) {
            return NextResponse.json({ error: 'New session time must be in the future' }, { status: 400 });
        }

        // 6. One-Session-Per-Day Rule for the client
        const clientId = bookingData?.clientId;
        if (clientId) {
            const dayStart = new Date(newDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(newDate);
            dayEnd.setHours(23, 59, 59, 999);

            const existingBookings = await adminDb.collection('bookings')
                .where('clientId', '==', clientId)
                .where('sessionTime', '>=', dayStart)
                .where('sessionTime', '<=', dayEnd)
                .get();

            const hasConflict = existingBookings.docs.some((doc: any) => {
                const data = doc.data();
                if (doc.id === bookingId) return false; // Exclude current booking
                if (data.status === 'cancelled' || data.status === 'pending_payment') return false;
                return true;
            });

            if (hasConflict) {
                return NextResponse.json({ error: 'Client already has a session scheduled for this day' }, { status: 409 });
            }
        }

        // 7. Check therapist slot conflict
        const therapistId = bookingData?.therapistId;
        const dayStart = new Date(newDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(newDate);
        dayEnd.setHours(23, 59, 59, 999);

        const therapistBookings = await adminDb.collection('bookings')
            .where('therapistId', '==', therapistId)
            .where('sessionTime', '>=', dayStart)
            .where('sessionTime', '<=', dayEnd)
            .get();

        const slotConflict = therapistBookings.docs.some((doc: any) => {
            const data = doc.data();
            if (doc.id === bookingId) return false; // Exclude current booking  
            if (data.status === 'cancelled' || data.status === 'pending_payment') return false;
            const existingTime = data.sessionTime?.toDate ? data.sessionTime.toDate() : new Date(data.sessionTime);
            return existingTime.getTime() === newDate.getTime();
        });

        if (slotConflict) {
            return NextResponse.json({ error: 'The selected slot is no longer available' }, { status: 409 });
        }

        // 7b. Check therapist busy/blocked slots
        const busySlots = await adminDb.collection('busy_slots')
            .where('therapistId', '==', therapistId)
            .where('startTime', '>=', dayStart)
            .where('startTime', '<=', dayEnd)
            .get();

        const SESSION_DURATION_MS = 50 * 60 * 1000; // 50 minutes in ms
        const newSessionEnd = new Date(newDate.getTime() + SESSION_DURATION_MS);

        const isBusyBlocked = busySlots.docs.some((doc: any) => {
            const data = doc.data();
            const busyStart = data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime);
            const busyEnd = data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime);
            // Overlap check: newStart < busyEnd && newEnd > busyStart
            return newDate < busyEnd && newSessionEnd > busyStart;
        });

        if (isBusyBlocked) {
            return NextResponse.json({ error: 'This time slot has been blocked by the therapist' }, { status: 409 });
        }

        // 8. Update the booking with new session time
        await bookingRef.update({
            sessionTime: newDate,
            status: 'confirmed',
            rescheduledBy: role,
            rescheduledAt: new Date(),
            updatedAt: new Date()
        });

        return NextResponse.json({
            success: true,
            message: 'Session rescheduled successfully.'
        });

    } catch (error) {
        console.error('Error in reschedule process:', error);
        return NextResponse.json({ error: 'Internal server error processing reschedule' }, { status: 500 });
    }
}
