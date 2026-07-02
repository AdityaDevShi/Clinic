// Ported from clinic-app/src/services/bookingService.ts — keep in sync with web.
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, addDoc, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { Availability, Booking, BusySlot, TimeSlot, Feedback } from '@/lib/types';
import { getDefaultAvailability, generateTimeSlotsForDate } from '@/lib/availability';
import { addDays, endOfDay, startOfDay } from 'date-fns';

export const BookingService = {
    /**
     * Get therapist availability. If none exists, returns the default schedule.
     */
    async getAvailability(therapistId: string): Promise<Availability[]> {
        try {
            const availabilityRef = collection(db, 'availability');
            const q = query(availabilityRef, where('therapistId', '==', therapistId));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return getDefaultAvailability(therapistId);
            }

            return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Availability));
        } catch (error) {
            console.error('Error fetching availability:', error);
            return getDefaultAvailability(therapistId);
        }
    },

    /**
     * Get bookings for a date range to calculate conflicts.
     */
    async getBookings(therapistId: string, start: Date, end: Date): Promise<Booking[]> {
        try {
            const bookingsRef = collection(db, 'bookings');
            const q = query(
                bookingsRef,
                where('therapistId', '==', therapistId),
                where('sessionTime', '>=', Timestamp.fromDate(start)),
                where('sessionTime', '<=', Timestamp.fromDate(end))
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    ...data,
                    sessionTime: data.sessionTime.toDate(),
                    createdAt: data.createdAt?.toDate(),
                } as Booking;
            });
        } catch (error) {
            console.error('Error fetching bookings:', error);
            return [];
        }
    },

    /**
     * Subscribe to bookings for real-time updates (Therapist View)
     */
    subscribeToTherapistBookings(therapistId: string, callback: (bookings: Booking[]) => void): () => void {
        const bookingsRef = collection(db, 'bookings');
        const q = query(bookingsRef, where('therapistId', '==', therapistId));

        return onSnapshot(q, (snapshot) => {
            const bookings = snapshot.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    ...data,
                    sessionTime: data.sessionTime?.toDate ? data.sessionTime.toDate() : new Date(data.sessionTime),
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                } as Booking;
            });
            callback(bookings);
        }, (error) => {
            console.error('Error subscribing to bookings:', error);
        });
    },

    /**
     * Subscribe to bookings for real-time updates (Client View)
     */
    subscribeToClientBookings(clientId: string, callback: (bookings: Booking[]) => void): () => void {
        const bookingsRef = collection(db, 'bookings');
        const q = query(bookingsRef, where('clientId', '==', clientId));

        return onSnapshot(q, (snapshot) => {
            const bookings = snapshot.docs.map(d => {
                const data = d.data();
                const sessionTime = data.sessionTime?.toDate ? data.sessionTime.toDate() : new Date(data.sessionTime);
                const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
                return { id: d.id, ...data, sessionTime, createdAt } as Booking;
            });
            callback(bookings);
        }, (error) => {
            console.error('Error subscribing to client bookings:', error);
        });
    },

    /**
     * Check if a client already has a booking on a specific date
     */
    async hasClientBookingOnDate(clientId: string, date: Date, excludeBookingId?: string): Promise<boolean> {
        const start = startOfDay(date);
        const end = endOfDay(date);

        const bookingsRef = collection(db, 'bookings');
        const q = query(
            bookingsRef,
            where('clientId', '==', clientId),
            where('sessionTime', '>=', Timestamp.fromDate(start)),
            where('sessionTime', '<=', Timestamp.fromDate(end))
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.some(d => {
            const data = d.data();
            if (data.status === 'cancelled' || data.status === 'pending_payment') return false;
            if (excludeBookingId && d.id === excludeBookingId) return false;
            return true;
        });
    },

    /**
     * Create a new booking (pending_payment until checkout completes)
     */
    async createBooking(bookingData: Partial<Booking>): Promise<string> {
        const start = bookingData.sessionTime!;

        // 0. One-Session-Per-Day Rule
        if (bookingData.clientId) {
            const hasExisting = await this.hasClientBookingOnDate(bookingData.clientId, start);
            if (hasExisting) {
                throw new Error('You already have a session scheduled for this day.');
            }
        }

        // 1. Double check availability
        const end = addDays(start, 0);
        const [existingBookings, busySlots] = await Promise.all([
            this.getBookings(bookingData.therapistId!, startOfDay(start), endOfDay(end)),
            this.getBusySlots(bookingData.therapistId!, startOfDay(start), endOfDay(end)),
        ]);

        const isConflict = existingBookings.some(b => {
            if (b.status === 'cancelled' || b.status === 'pending_payment') return false;
            return b.sessionTime.getTime() === start.getTime();
        });

        const isBusy = busySlots.some(slot => {
            const slotStart = slot.startTime.getTime();
            const slotEnd = slot.endTime.getTime();
            const bookingStart = start.getTime();
            const bookingEnd = bookingStart + 60 * 60 * 1000; // 60 mins
            return bookingStart < slotEnd && bookingEnd > slotStart;
        });

        if (isConflict || isBusy) {
            throw new Error('This slot is no longer available. Please select another.');
        }

        // 2. Save to Firestore
        const docRef = await addDoc(collection(db, 'bookings'), {
            ...bookingData,
            sessionTime: Timestamp.fromDate(start),
            createdAt: Timestamp.now(),
            status: bookingData.status || 'pending_payment',
            paymentStatus: bookingData.paymentStatus || 'pending',
        });

        return docRef.id;
    },

    /**
     * Get busy slots for a date range
     */
    async getBusySlots(therapistId: string, start: Date, end: Date): Promise<BusySlot[]> {
        try {
            const busySlotsRef = collection(db, 'busy_slots');
            const q = query(
                busySlotsRef,
                where('therapistId', '==', therapistId),
                where('startTime', '>=', Timestamp.fromDate(start)),
                where('startTime', '<=', Timestamp.fromDate(end))
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                startTime: d.data().startTime.toDate(),
                endTime: d.data().endTime.toDate(),
            } as BusySlot));
        } catch (error) {
            console.error('Error fetching busy slots:', error);
            return [];
        }
    },

    /**
     * Get calculated slots for a specific date
     */
    async getAvailableSlots(therapistId: string, date: Date, excludeBookingId?: string): Promise<TimeSlot[]> {
        const availability = await this.getAvailability(therapistId);

        const start = startOfDay(date);
        const end = endOfDay(date);
        const [bookings, busySlots] = await Promise.all([
            this.getBookings(therapistId, start, end),
            this.getBusySlots(therapistId, start, end),
        ]);

        let filteredBookings = bookings;
        if (excludeBookingId) {
            filteredBookings = bookings.filter(b => b.id !== excludeBookingId);
        }

        return generateTimeSlotsForDate(date, availability, busySlots, filteredBookings);
    },

    /**
     * Recalculate the average rating and review count for a therapist
     * based only on currently public feedback.
     */
    async recalculateTherapistRating(therapistId: string): Promise<void> {
        const feedbackRef = collection(db, 'feedback');
        const q = query(feedbackRef, where('therapistId', '==', therapistId));
        const snapshot = await getDocs(q);

        let totalRating = 0;
        let publicReviewCount = 0;

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.isPublic !== false) {
                totalRating += (data.rating || 0);
                publicReviewCount++;
            }
        });

        const newAverage = publicReviewCount > 0
            ? parseFloat((totalRating / publicReviewCount).toFixed(1))
            : 0;

        const therapistRef = doc(db, 'therapists', therapistId);
        await setDoc(therapistRef, {
            rating: newAverage,
            reviewCount: publicReviewCount,
        }, { merge: true });
    },

    /**
     * Submit feedback and update therapist rating
     */
    async submitFeedback(feedbackData: Omit<Feedback, 'id' | 'createdAt'>): Promise<void> {
        // 1. Check for duplicate feedback
        const feedbackRef = collection(db, 'feedback');
        const q = query(feedbackRef, where('bookingId', '==', feedbackData.bookingId));
        const existing = await getDocs(q);

        if (!existing.empty) {
            throw new Error('You have already submitted feedback for this session.');
        }

        // 2. Save feedback
        await addDoc(collection(db, 'feedback'), {
            ...feedbackData,
            createdAt: Timestamp.now(),
        });

        // 3. Mark booking as rated
        const bookingRef = doc(db, 'bookings', feedbackData.bookingId);
        await setDoc(bookingRef, { isRated: true }, { merge: true });

        // 4. Update therapist rating
        await this.recalculateTherapistRating(feedbackData.therapistId);
    },
};
