import {
    format,
    addDays,
    startOfDay,
    setHours,
    setMinutes,
    isBefore,
    isAfter,
    addMinutes,
    parseISO,
    isWithinInterval,
    addHours,
} from 'date-fns';
import { Availability, BusySlot, Booking, TimeSlot } from '@/types';

// Session duration in minutes
const SESSION_DURATION = 60;
// Minimum hours before booking
const MIN_BOOKING_HOURS = 2;
// Days to show in calendar
const CALENDAR_DAYS = 14;

/**
 * Parse time string "HH:mm" to hours and minutes
 */
function parseTime(timeString: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
}

/**
 * Generate time slots for a specific date based on availability
 */
export function generateTimeSlotsForDate(
    date: Date,
    availability: Availability[],
    busySlots: BusySlot[],
    existingBookings: Booking[]
): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const dayOfWeek = date.getDay();
    const now = new Date();
    const minBookingTime = addHours(now, MIN_BOOKING_HOURS);

    // Get availability rules for this day
    const dayAvailability = availability.filter(
        (a) => a.dayOfWeek === dayOfWeek && !a.isBreak
    );

    // Get breaks for this day
    const dayBreaks = availability.filter(
        (a) => a.dayOfWeek === dayOfWeek && a.isBreak
    );

    if (dayAvailability.length === 0) {
        return slots;
    }

    // Generate slots for each availability window
    dayAvailability.forEach((avail) => {
        const startTime = parseTime(avail.startTime);
        const endTime = parseTime(avail.endTime);

        let currentSlot = setMinutes(setHours(date, startTime.hours), startTime.minutes);
        const endSlot = setMinutes(setHours(date, endTime.hours), endTime.minutes);

        while (isBefore(addMinutes(currentSlot, SESSION_DURATION), endSlot) ||
            currentSlot.getTime() + SESSION_DURATION * 60000 <= endSlot.getTime()) {
            const slotEnd = addMinutes(currentSlot, SESSION_DURATION);

            // Check if slot is in the past or too soon
            const isInPast = isBefore(currentSlot, minBookingTime);

            // Check if slot overlaps with a break
            const isInBreak = dayBreaks.some((breakSlot) => {
                const breakStart = parseTime(breakSlot.startTime);
                const breakEnd = parseTime(breakSlot.endTime);
                const breakStartTime = setMinutes(setHours(date, breakStart.hours), breakStart.minutes);
                const breakEndTime = setMinutes(setHours(date, breakEnd.hours), breakEnd.minutes);

                // Overlap check: StartA < EndB && EndA > StartB
                return isBefore(currentSlot, breakEndTime) && isAfter(slotEnd, breakStartTime);
            });

            // Check if slot overlaps with a busy slot
            const isBusy = busySlots.some((busy) => {
                const busyStart = busy.startTime instanceof Date ? busy.startTime : new Date(busy.startTime);
                const busyEnd = busy.endTime instanceof Date ? busy.endTime : new Date(busy.endTime);

                return isBefore(currentSlot, busyEnd) && isAfter(slotEnd, busyStart);
            });

            // Check if slot overlaps with existing booking
            const isBooked = existingBookings.some((booking) => {
                if (booking.status === 'cancelled') return false;

                const bookingStart = booking.sessionTime instanceof Date
                    ? booking.sessionTime
                    : new Date(booking.sessionTime);
                const bookingEnd = addMinutes(bookingStart, booking.duration);

                const overlap = isBefore(currentSlot, bookingEnd) && isAfter(slotEnd, bookingStart);
                if (overlap) {
                    console.log(`Slot ${format(currentSlot, 'HH:mm')} blocked by booking ${booking.id} (${format(bookingStart, 'HH:mm')})`);
                }
                return overlap;
            });

            slots.push({
                time: format(currentSlot, 'HH:mm'),
                date: currentSlot,
                isAvailable: !isInPast && !isInBreak && !isBusy && !isBooked,
            });

            currentSlot = addMinutes(currentSlot, SESSION_DURATION);
        }
    });

    return slots.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Get available dates for the next N days
 */
export function getAvailableDates(
    availability: Availability[],
    daysToShow: number = CALENDAR_DAYS
): Date[] {
    const dates: Date[] = [];
    const today = startOfDay(new Date());

    for (let i = 0; i < daysToShow; i++) {
        const date = addDays(today, i);
        const dayOfWeek = date.getDay();

        // Check if there's any availability for this day
        const hasAvailability = availability.some(
            (a) => a.dayOfWeek === dayOfWeek && !a.isBreak
        );

        if (hasAvailability) {
            dates.push(date);
        }
    }

    return dates;
}

/**
 * Check if a therapist is currently working (within working hours)
 */
export function isTherapistWorking(availability: Availability[]): boolean {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = format(now, 'HH:mm');

    return availability.some((avail) => {
        if (avail.dayOfWeek !== dayOfWeek || avail.isBreak) return false;
        return currentTime >= avail.startTime && currentTime < avail.endTime;
    });
}

/**
 * Default availability template (Mon-Fri, 9-5 with lunch break)
 */
export function getDefaultAvailability(therapistId: string): Availability[] {
    const defaultSchedule: Availability[] = [];

    // Monday to Saturday (1-6)
    for (let day = 1; day <= 6; day++) {
        // Morning session
        defaultSchedule.push({
            id: `${therapistId}-${day}-morning`,
            therapistId,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '13:00',
            isBreak: false,
        });

        // Lunch break
        defaultSchedule.push({
            id: `${therapistId}-${day}-lunch`,
            therapistId,
            dayOfWeek: day,
            startTime: '13:00',
            endTime: '15:00',
            isBreak: true,
        });

        // Afternoon session
        defaultSchedule.push({
            id: `${therapistId}-${day}-afternoon`,
            therapistId,
            dayOfWeek: day,
            startTime: '15:00',
            endTime: '18:00',
            isBreak: false,
        });
    }

    return defaultSchedule;
}

/**
 * Format time slot for display
 */
export function formatTimeSlot(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get day name from day of week number
 */
export function getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
}
