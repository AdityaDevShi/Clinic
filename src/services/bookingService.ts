import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { Availability, Booking, TimeSlot, Feedback, Therapist } from '@/types';
import { getDefaultAvailability, generateTimeSlotsForDate } from '@/lib/scheduling/availability';
import { addDays, endOfDay, startOfDay } from 'date-fns';

export const BookingService = {
    /**
     * Get therapist availability. If none exists, returns default M-F 9-5 schedule.
     */
    async getAvailability(therapistId: string): Promise<Availability[]> {
        if (!db) return getDefaultAvailability(therapistId); // Fallback if no DB

        try {
            const availabilityRef = collection(db, 'availability');
            const q = query(availabilityRef, where('therapistId', '==', therapistId));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                // Return default availability if not set
                // In a real app, we might save this default to DB here
                return getDefaultAvailability(therapistId);
            }

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Availability));
        } catch (error) {
            console.error("Error fetching availability:", error);
            return getDefaultAvailability(therapistId);
        }
    },

    /**
     * Get bookings for a date range to calculate conflicts.
     */
    async getBookings(therapistId: string, start: Date, end: Date): Promise<Booking[]> {
        if (!db) return [];

        try {
            const bookingsRef = collection(db, 'bookings');
            const q = query(
                bookingsRef,
                where('therapistId', '==', therapistId),
                where('sessionTime', '>=', Timestamp.fromDate(start)),
                where('sessionTime', '<=', Timestamp.fromDate(end))
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    sessionTime: data.sessionTime.toDate(), // Convert Timestamp to Date
                    createdAt: data.createdAt?.toDate(),
                } as Booking;
            });
        } catch (error) {
            console.error("Error fetching bookings:", error);
            return [];
        }
    },

    /**
     * Create a new booking
     */
    async createBooking(bookingData: Partial<Booking>): Promise<string> {
        if (!db) throw new Error("Database not initialized");

        try {
            // 1. Double check availability
            const start = bookingData.sessionTime!;
            const end = addDays(start, 0); // Same day check
            const existingBookings = await this.getBookings(bookingData.therapistId!, startOfDay(start), endOfDay(end));

            const isConflict = existingBookings.some(b => {
                if (b.status === 'cancelled') return false;
                const bStart = b.sessionTime;
                return bStart.getTime() === start.getTime(); // Exact match check for slot system
            });

            if (isConflict) {
                throw new Error("This slot was just booked by someone else. Please select another.");
            }

            // 2. Save to Firestore
            const docRef = await addDoc(collection(db, 'bookings'), {
                ...bookingData,
                sessionTime: Timestamp.fromDate(bookingData.sessionTime!),
                createdAt: Timestamp.now(),
                status: 'confirmed', // Auto-confirm for now
                paymentStatus: 'paid' // Assuming payment flow is separate/mocked
            });

            return docRef.id;

        } catch (error) {
            console.error("Error creating booking:", error);
            throw error;
        }
    },

    /**
     * Get calculated slots for a specific date
     */
    async getAvailableSlots(therapistId: string, date: Date, excludeBookingId?: string): Promise<TimeSlot[]> {
        // 1. Get Availability Rules
        const availability = await this.getAvailability(therapistId);

        // 2. Get Existing Bookings for the day
        const start = startOfDay(date);
        const end = endOfDay(date);
        let bookings = await this.getBookings(therapistId, start, end);

        // Filter out the booking being rescheduled if ID is provided
        if (excludeBookingId) {
            bookings = bookings.filter(b => b.id !== excludeBookingId);
        }

        // 3. Generate Slots (this handles breaks, past times, and booking conflicts)
        // We pass empty busySlots for now as that feature isn't fully built
        return generateTimeSlotsForDate(date, availability, [], bookings);
    },
    /**
     * Submit feedback and update therapist rating
     */
    async submitFeedback(feedbackData: Omit<Feedback, 'id' | 'createdAt'>): Promise<void> {
        if (!db) throw new Error("Database not initialized");

        try {
            // 1. Save Feedback
            const feedbackRef = await addDoc(collection(db, 'feedback'), {
                ...feedbackData,
                createdAt: Timestamp.now(),
            });

            // 2. Update Therapist Rating
            const therapistRef = doc(db, 'therapists', feedbackData.therapistId);
            const therapistDoc = await getDoc(therapistRef);

            if (therapistDoc.exists()) {
                const data = therapistDoc.data() as Therapist;
                const currentRating = data.rating || 0;
                const currentCount = data.reviewCount || 0;

                const newCount = currentCount + 1;
                const newRating = ((currentRating * currentCount) + feedbackData.rating) / newCount;

                await setDoc(therapistRef, {
                    ...data,
                    rating: parseFloat(newRating.toFixed(1)), // Round to 1 decimal
                    reviewCount: newCount
                });
            }

        } catch (error) {
            console.error("Error submitting feedback:", error);
            throw error;
        }
    },

    /**
     * Reschedule an existing booking to a new time
     */
    async rescheduleBooking(bookingId: string, newDate: Date, therapistId: string): Promise<void> {
        if (!db) throw new Error("Database not initialized");

        try {
            // 1. Check if new slot is available
            const start = newDate;
            const end = addDays(start, 0);
            const existingBookings = await this.getBookings(therapistId, startOfDay(start), endOfDay(end));

            const isConflict = existingBookings.some(b => {
                if (b.status === 'cancelled' || b.id === bookingId) return false; // Ignore self and cancelled
                const bStart = b.sessionTime;
                return bStart.getTime() === start.getTime();
            });

            if (isConflict) {
                throw new Error("The selected slot is no longer available.");
            }

            // 2. Update Booking
            const bookingRef = doc(db, 'bookings', bookingId);

            // We verify the booking exists and belongs to the user? (Security rule handles this usually, but good to check)
            // For now, direct update.
            await setDoc(bookingRef, {
                sessionTime: Timestamp.fromDate(newDate),
                status: 'confirmed', // Re-confirm if it was cancelled? 
                // If we allow rescheduling cancelled, yes. If only active, strictly 'confirmed'.
                updatedAt: Timestamp.now()
            }, { merge: true });

        } catch (error) {
            console.error("Error rescheduling booking:", error);
            throw error;
        }
    },

    /**
     * Cancel a booking
     */
    async cancelBooking(bookingId: string): Promise<void> {
        if (!db) throw new Error("Database not initialized");

        try {
            const bookingRef = doc(db, 'bookings', bookingId);
            await setDoc(bookingRef, {
                status: 'cancelled',
                updatedAt: Timestamp.now()
            }, { merge: true });
        } catch (error) {
            console.error("Error cancelling booking:", error);
            throw error;
        }
    }
};
