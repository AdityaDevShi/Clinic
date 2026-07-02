import { useEffect, useState } from 'react';
import { BookingService } from '@/services/bookingService';
import { Booking } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

/** Live bookings for the signed-in therapist. */
export function useTherapistBookings() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = BookingService.subscribeToTherapistBookings(user.id, (list) => {
            setBookings(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    return { bookings, loading };
}
