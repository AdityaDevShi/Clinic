'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Calendar } from 'lucide-react';
import { TimeSlot, Availability, BusySlot, Booking } from '@/types';
import {
    generateTimeSlotsForDate,
    getAvailableDates,
    formatTimeSlot
} from '@/lib/scheduling/availability';

interface TimeSlotPickerProps {
    availability: Availability[];
    busySlots: BusySlot[];
    existingBookings: Booking[];
    selectedSlot: TimeSlot | null;
    onSelectSlot: (slot: TimeSlot | null) => void;
    disabled?: boolean;
}

export default function TimeSlotPicker({
    availability,
    busySlots,
    existingBookings,
    selectedSlot,
    onSelectSlot,
    disabled = false,
}: TimeSlotPickerProps) {
    const [availableDates, setAvailableDates] = useState<Date[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [dateStartIndex, setDateStartIndex] = useState(0);
    const datesToShow = 5;

    // Generate available dates on mount
    useEffect(() => {
        const dates = getAvailableDates(availability, 14);
        setAvailableDates(dates);
        if (dates.length > 0) {
            setSelectedDate(dates[0]);
        }
    }, [availability]);

    // Generate time slots when date changes
    useEffect(() => {
        if (selectedDate) {
            const slots = generateTimeSlotsForDate(
                selectedDate,
                availability,
                busySlots,
                existingBookings
            );
            setTimeSlots(slots);
        }
    }, [selectedDate, availability, busySlots, existingBookings]);

    const handlePrevDates = () => {
        setDateStartIndex(Math.max(0, dateStartIndex - datesToShow));
    };

    const handleNextDates = () => {
        setDateStartIndex(Math.min(availableDates.length - datesToShow, dateStartIndex + datesToShow));
    };

    const visibleDates = availableDates.slice(dateStartIndex, dateStartIndex + datesToShow);
    const availableSlots = timeSlots.filter((slot) => slot.isAvailable);

    return (
        <div className="space-y-6">
            {/* Date Selection */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-[var(--neutral-700)] flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-[var(--primary-500)]" />
                        Select a Date
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevDates}
                            disabled={dateStartIndex === 0}
                            className="p-1 rounded-lg hover:bg-[var(--warm-100)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-[var(--neutral-600)]" />
                        </button>
                        <button
                            onClick={handleNextDates}
                            disabled={dateStartIndex + datesToShow >= availableDates.length}
                            className="p-1 rounded-lg hover:bg-[var(--warm-100)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-[var(--neutral-600)]" />
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    {visibleDates.map((date) => {
                        const isSelected = selectedDate && isSameDay(date, selectedDate);
                        return (
                            <button
                                key={date.toISOString()}
                                onClick={() => {
                                    setSelectedDate(date);
                                    onSelectSlot(null);
                                }}
                                disabled={disabled}
                                className={`flex-1 p-3 rounded-xl text-center transition-all duration-200 ${isSelected
                                        ? 'bg-[var(--secondary-500)] text-white shadow-md'
                                        : 'bg-[var(--warm-50)] hover:bg-[var(--warm-100)] text-[var(--neutral-700)]'
                                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className="text-xs font-medium uppercase tracking-wide mb-1">
                                    {format(date, 'EEE')}
                                </div>
                                <div className={`text-lg font-semibold ${isSelected ? 'text-white' : 'text-[var(--primary-700)]'}`}>
                                    {format(date, 'd')}
                                </div>
                                <div className="text-xs">
                                    {format(date, 'MMM')}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Time Slots */}
            <div>
                <h3 className="font-medium text-[var(--neutral-700)] flex items-center mb-4">
                    <Clock className="w-4 h-4 mr-2 text-[var(--primary-500)]" />
                    Available Times
                </h3>

                {availableSlots.length === 0 ? (
                    <div className="text-center py-8 bg-[var(--warm-50)] rounded-xl">
                        <p className="text-[var(--neutral-500)]">
                            No available slots for this date.
                        </p>
                        <p className="text-sm text-[var(--neutral-400)] mt-1">
                            Please try another date.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        <AnimatePresence mode="popLayout">
                            {timeSlots.map((slot) => {
                                if (!slot.isAvailable) return null;

                                const isSelected = selectedSlot &&
                                    slot.time === selectedSlot.time &&
                                    isSameDay(slot.date, selectedSlot.date);

                                return (
                                    <motion.button
                                        key={`${slot.date.toISOString()}-${slot.time}`}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        onClick={() => onSelectSlot(isSelected ? null : slot)}
                                        disabled={disabled}
                                        className={`py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${isSelected
                                                ? 'bg-[var(--secondary-500)] text-white shadow-md ring-2 ring-[var(--secondary-300)]'
                                                : 'bg-white border border-[var(--border)] hover:border-[var(--secondary-400)] hover:bg-[var(--warm-50)] text-[var(--neutral-700)]'
                                            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {formatTimeSlot(slot.time)}
                                    </motion.button>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Selected Summary */}
            {selectedSlot && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-[var(--primary-50)] rounded-xl border border-[var(--primary-200)]"
                >
                    <p className="text-sm text-[var(--primary-700)]">
                        <span className="font-medium">Selected:</span>{' '}
                        {format(selectedSlot.date, 'EEEE, MMMM d, yyyy')} at {formatTimeSlot(selectedSlot.time)}
                    </p>
                </motion.div>
            )}
        </div>
    );
}
