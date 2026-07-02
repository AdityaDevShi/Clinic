import { useEffect, useState } from 'react';
import { BookingService } from '@/services/bookingService';
import { Booking } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

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
        });
        return () => unsubscribe();
    }, [user]);

    return { bookings, loading };
}
