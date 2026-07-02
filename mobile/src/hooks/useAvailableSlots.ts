import { useCallback, useEffect, useState } from 'react';
import { BookingService } from '@/services/bookingService';
import { TimeSlot } from '@/lib/types';

/** Slots for a therapist on a given date; recomputes when either changes. */
export function useAvailableSlots(therapistId: string | undefined, date: Date, excludeBookingId?: string) {
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        if (!therapistId) return;
        setLoading(true);
        try {
            setSlots(await BookingService.getAvailableSlots(therapistId, date, excludeBookingId));
        } catch (error) {
            console.error('Error loading slots:', error);
            setSlots([]);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [therapistId, date.getTime(), excludeBookingId]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { slots, loading, refresh };
}
