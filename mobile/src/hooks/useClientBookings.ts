import { useEffect, useState } from 'react';
import { BookingService } from '@/services/bookingService';
import { Booking } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { syncBookingReminders } from '@/lib/notifications';

/** Live bookings for the signed-in client, newest session first. */
export function useClientBookings() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = BookingService.subscribeToClientBookings(user.id, (list) => {
            list.sort((a, b) => b.sessionTime.getTime() - a.sessionTime.getTime());
            setBookings(list);
            setLoading(false);
            // Keep local session reminders in sync with the latest bookings.
            syncBookingReminders(list);
        });
        return () => unsubscribe();
    }, [user]);

    return { bookings, loading };
}
