'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Check, CreditCard, Video, ChevronLeft, ChevronRight, Loader2, MapPin } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { format, addDays, subDays, startOfToday, isBefore, isToday, parse, isAfter } from 'date-fns';
import { BookingService } from '@/services/bookingService';
import { TimeSlot } from '@/types';

import { useAuth } from '@/contexts/AuthContext';

export default function BookingPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());

    // New State for Frequency and Multiple Slots
    const [sessionsPerWeek, setSessionsPerWeek] = useState(1);
    const [selectedSlots, setSelectedSlots] = useState<{ date: string, time: string }[]>([]);

    // Data State
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    const [step, setStep] = useState(1); // 1: Select Slot, 2: Payment/Confirm

    // Hydration fix helper
    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true) }, []);

    // Auth guard: redirect to login if not signed in
    useEffect(() => {
        if (!authLoading && !user) {
            const currentPath = `/therapists/${params.id}/book`;
            router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        }
    }, [authLoading, user, params.id, router]);

    // Block render entirely if not authenticated
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--warm-50)]">
                <Loader2 className="w-8 h-8 text-[var(--primary-500)] animate-spin" />
            </div>
        );
    }
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--warm-50)]">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-[var(--primary-500)] animate-spin mx-auto mb-4" />
                    <p className="text-[var(--neutral-600)]">Redirecting to login...</p>
                </div>
            </div>
        );
    }
    // Fetch Slots on date change
    useEffect(() => {
        const fetchSlots = async () => {
            setLoadingSlots(true);
            try {
                const slots = await BookingService.getAvailableSlots(params.id as string, selectedDate);
                setAvailableSlots(slots);
            } catch (error) {
                console.error("Failed to fetch slots", error);
            } finally {
                setLoadingSlots(false);
            }
        };

        if (params.id) {
            fetchSlots();
        }
    }, [selectedDate, params.id]);

    // Mock Therapist Data (would fetch by ID)
    const therapist = {
        id: params.id,
        name: 'Dr. Shiwani Kohli',
        specialization: 'Clinical Psychology',
        price: 2500,
        image: null // placeholder
    };

    const handlePreviousDate = () => {
        const newDate = subDays(selectedDate, 1);
        if (!isBefore(newDate, startOfToday())) {
            setSelectedDate(newDate);
        }
    };

    const handleNextDate = () => {
        setSelectedDate(addDays(selectedDate, 1));
    };

    const handleSlotClick = (slot: TimeSlot) => {
        if (!slot.isAvailable) return;

        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const time = slot.time;

        // Check if this specific slot is already selected
        const exists = selectedSlots.find(s => s.date === dateStr && s.time === time);

        if (exists) {
            // Deselect
            setSelectedSlots(prev => prev.filter(s => s !== exists));
        } else {
            // Check if user already has a session selected for THIS date
            const hasSessionForDate = selectedSlots.some(s => s.date === dateStr);
            if (hasSessionForDate) {
                alert("You can only book one session per day.");
                return;
            }

            // Select if under limit
            if (selectedSlots.length < sessionsPerWeek) {
                setSelectedSlots(prev => [...prev, { date: dateStr, time }]);
            } else {
                alert(`You have selected ${sessionsPerWeek} session(s). Deselect one to choose another.`);
            }
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirmBooking = async () => {
        if (!user) {
            router.push(`/login?redirect=${encodeURIComponent(`/therapists/${params.id}/book`)}`);
            return;
        }
        setIsSubmitting(true);
        try {
            // Create a booking for each selected slot
            const bookingPromises = selectedSlots.map(slot => {
                // Parse date and time to Date object
                const [hours, minutes] = slot.time.split(':').map(Number);
                const sessionTime = new Date(slot.date);
                sessionTime.setHours(hours, minutes, 0, 0);

                return BookingService.createBooking({
                    therapistId: therapist.id as string,
                    therapistName: therapist.name,
                    clientId: user.id,
                    clientName: user.name || 'User',
                    clientEmail: user.email || '',
                    sessionTime: sessionTime,
                    duration: 60, // Default duration
                    amount: therapist.price,
                });
            });

            await Promise.all(bookingPromises);

            alert(`Booking confirmed for ${selectedSlots.length} sessions!`);
            router.push('/therapists');
        } catch (error: any) {
            alert("Booking Failed: " + (error.message || "Unknown error"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalCost = therapist.price * selectedSlots.length; // Per week cost

    if (!isClient) return null; // Hydration fix

    return (
        <div className="min-h-screen bg-[var(--neutral-50)]">
            <Header />

            <div className="pt-24 md:pt-32 pb-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Link */}
                <Link href={`/therapists/${params.id}`} className="inline-flex items-center text-[var(--neutral-500)] hover:text-[var(--primary-600)] mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Profile
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Booking Flow */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Step 1: Schedule */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-white rounded-2xl p-6 shadow-sm border ${step === 1 ? 'border-[var(--primary-200)] ring-1 ring-[var(--primary-100)]' : 'border-[var(--neutral-200)]'}`}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-serif text-[var(--primary-800)] flex items-center gap-2">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--primary-100)] text-[var(--primary-700)] text-sm font-sans font-bold">1</span>
                                    Select Sessions
                                </h2>
                                {step > 1 && <Check className="w-5 h-5 text-green-500" />}
                            </div>

                            {step === 1 && (
                                <div className="space-y-8">
                                    {/* Frequency Selector */}
                                    <div className="flex flex-col items-center justify-center p-4 bg-[var(--neutral-50)] rounded-xl border border-[var(--neutral-100)]">
                                        <p className="text-[var(--neutral-700)] mb-3 font-medium">How many sessions per week?</p>
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map((num) => (
                                                <button
                                                    key={num}
                                                    onClick={() => {
                                                        setSessionsPerWeek(num);
                                                        setSelectedSlots([]); // Reset slots on frequency change
                                                    }}
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${sessionsPerWeek === num
                                                        ? 'bg-[var(--primary-600)] text-white shadow-md transform scale-105'
                                                        : 'bg-white text-[var(--neutral-500)] border border-[var(--neutral-200)] hover:border-[var(--primary-500)] hover:text-[var(--primary-600)]'
                                                        }`}
                                                >
                                                    {num}x
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-[var(--neutral-500)] mt-2">
                                            Please select <strong>{sessionsPerWeek}</strong> time slot{sessionsPerWeek > 1 ? 's' : ''} below.
                                        </p>
                                    </div>

                                    {/* Date Picker with Arrows */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--neutral-700)] mb-3">Select Date</label>
                                        <div className="flex items-center justify-between bg-[var(--neutral-50)] p-2 rounded-xl border border-[var(--neutral-200)]">
                                            <button
                                                onClick={handlePreviousDate}
                                                disabled={isBefore(subDays(selectedDate, 1), startOfToday())}
                                                className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-[var(--neutral-600)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>

                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-5 h-5 text-[var(--primary-600)]" />
                                                <span className="font-medium text-[var(--neutral-900)] text-lg">
                                                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                                                </span>
                                            </div>

                                            <button
                                                onClick={handleNextDate}
                                                className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-[var(--neutral-600)] transition-all"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Time Slots */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2 flex justify-between">
                                            <span>Available Slots</span>
                                            <span className="text-[var(--primary-600)] text-xs font-normal">
                                                Selected: {selectedSlots.length} / {sessionsPerWeek}
                                            </span>
                                        </label>

                                        {loadingSlots ? (
                                            <div className="flex justify-center py-8">
                                                <Loader2 className="w-8 h-8 text-[var(--primary-600)] animate-spin" />
                                            </div>
                                        ) : availableSlots.length === 0 ? (
                                            <div className="text-center py-8 text-[var(--neutral-500)] bg-[var(--neutral-50)] rounded-lg">
                                                No slots available for this date.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                {availableSlots.map((slot) => {
                                                    const dateStr = format(selectedDate, 'yyyy-MM-dd');
                                                    const isSelected = selectedSlots.some(s => s.date === dateStr && s.time === slot.time);
                                                    const isDisabled = !slot.isAvailable;

                                                    return (
                                                        <button
                                                            key={slot.time}
                                                            onClick={() => handleSlotClick(slot)}
                                                            disabled={isDisabled}
                                                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${isDisabled
                                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-transparent opacity-70'
                                                                : isSelected
                                                                    ? 'bg-[var(--primary-600)] text-white shadow-md ring-2 ring-[var(--primary-200)]'
                                                                    : 'bg-[var(--neutral-50)] text-[var(--neutral-600)] hover:bg-[var(--primary-50)] hover:text-[var(--primary-700)] border border-transparent hover:border-[var(--primary-200)]'
                                                                }`}
                                                        >
                                                            {slot.time}
                                                            {isSelected && <Check className="w-3 h-3 inline ml-1" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected Summary */}
                                    {selectedSlots.length > 0 && (
                                        <div className="p-4 bg-[var(--primary-50)] rounded-xl border border-[var(--primary-100)]">
                                            <h4 className="text-sm font-semibold text-[var(--primary-800)] mb-2">Your Weekly Schedule</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedSlots.map((slot, idx) => (
                                                    <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md bg-white border border-[var(--primary-200)] text-xs font-medium text-[var(--primary-700)] shadow-sm">
                                                        {format(new Date(slot.date), 'EEE, MMM d')} • {slot.time}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 flex justify-end">
                                        <button
                                            onClick={() => setStep(2)}
                                            disabled={selectedSlots.length !== sessionsPerWeek}
                                            className="px-6 py-2 bg-[var(--primary-600)] text-white rounded-lg hover:bg-[var(--primary-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Continue
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step > 1 && (
                                <div className="space-y-3 bg-[var(--neutral-50)] p-4 rounded-xl">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-[var(--neutral-900)]">Weekly Frequency: {sessionsPerWeek}x</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {selectedSlots.map((slot, idx) => (
                                                    <span key={idx} className="text-sm text-[var(--neutral-600)] bg-white px-2 py-1 rounded border border-[var(--neutral-200)]">
                                                        {format(new Date(slot.date), 'MMM d')} @ {slot.time}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <button onClick={() => setStep(1)} className="text-sm text-[var(--primary-600)] underline hover:text-[var(--primary-800)]">Edit</button>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Step 2: Payment (Mock) */}
                        <motion.div
                            initial={{ opacity: 0.5 }}
                            animate={{ opacity: step === 2 ? 1 : 0.5 }}
                            className={`bg-white rounded-2xl p-6 shadow-sm border ${step === 2 ? 'border-[var(--primary-200)] ring-1 ring-[var(--primary-100)]' : 'border-[var(--neutral-200)]'}`}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-serif text-[var(--primary-800)] flex items-center gap-2">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--primary-100)] text-[var(--primary-700)] text-sm font-sans font-bold">2</span>
                                    Confirm & Pay
                                </h2>
                            </div>

                            {step === 2 && (
                                <div className="space-y-6">
                                    <div className="p-4 bg-[var(--warm-50)] rounded-xl border border-[var(--warm-100)]">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[var(--neutral-600)]">Fee per session</span>
                                            <span className="font-medium text-[var(--neutral-900)]">₹{therapist.price}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[var(--neutral-600)]">Sessions per week</span>
                                            <span className="font-medium text-[var(--neutral-900)]">x {sessionsPerWeek}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm text-[var(--neutral-500)] pt-2 border-t border-[var(--warm-200)]">
                                            <span>Weekly Total (before tax)</span>
                                            <span>₹{totalCost}</span>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-[var(--warm-200)] flex justify-between items-center">
                                            <span className="font-bold text-lg text-[var(--primary-800)]">Total Due</span>
                                            <span className="font-bold text-lg text-[var(--primary-800)]">₹{(totalCost * 1.18).toFixed(0)}</span>
                                        </div>
                                        <p className="text-xs text-[var(--neutral-500)] mt-2 italic">* Includes 18% GST. This starts your recurring weekly plan.</p>
                                    </div>

                                    <button
                                        onClick={handleConfirmBooking}
                                        disabled={isSubmitting}
                                        className="w-full py-3 bg-[var(--secondary-500)] text-white rounded-xl hover:bg-[var(--secondary-600)] font-medium text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard className="w-5 h-5" />
                                                Pay & Start Plan
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Right Column: Therapist Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--neutral-200)] sticky top-32">
                            <h3 className="text-sm font-semibold text-[var(--neutral-500)] uppercase tracking-wider mb-4">You are booking</h3>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 bg-[var(--primary-100)] rounded-full flex items-center justify-center text-xl font-serif text-[var(--primary-700)]">
                                    {therapist.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <h4 className="font-serif text-lg text-[var(--primary-800)] leading-tight">{therapist.name}</h4>
                                    <p className="text-sm text-[var(--neutral-500)]">{therapist.specialization}</p>
                                </div>
                            </div>
                            <div className="space-y-3 pt-4 border-t border-[var(--neutral-100)]">
                                <div className="flex items-center gap-3 text-sm text-[var(--neutral-600)]">
                                    <div className="w-8 h-8 rounded-full bg-[var(--neutral-50)] flex items-center justify-center">
                                        <MapPin className="w-4 h-4 text-[var(--primary-500)]" />
                                    </div>
                                    In-Person Consultation
                                </div>
                                <div className="flex items-center gap-3 text-sm text-[var(--neutral-600)]">
                                    <div className="w-8 h-8 rounded-full bg-[var(--neutral-50)] flex items-center justify-center">
                                        <Clock className="w-4 h-4 text-[var(--primary-500)]" />
                                    </div>
                                    50 Minutes
                                </div>
                                <div className="flex items-center gap-3 text-sm text-[var(--neutral-600)] border-t border-[var(--neutral-100)] pt-3 mt-3">
                                    <span className="font-medium text-[var(--primary-700)]">
                                        Selected: {selectedSlots.length} / {sessionsPerWeek} slots
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
