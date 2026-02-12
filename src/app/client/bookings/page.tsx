'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking, TimeSlot } from '@/types';
import { BookingService } from '@/services/bookingService';
import { format, isPast, isFuture, isToday, addDays } from 'date-fns';
import {
    Calendar,
    Clock,
    User,
    Loader2,
    Star,
    Video,
    MessageCircle,
    XCircle
} from 'lucide-react';

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

// Demo bookings
const demoBookings: Booking[] = [
    {
        id: 'demo1',
        clientId: 'demo',
        clientName: 'Demo User',
        clientEmail: 'demo@example.com',
        therapistId: '1',
        therapistName: 'Dr. Shiwani Kohli',
        sessionTime: new Date(Date.now() + 86400000 * 2), // 2 days from now
        duration: 60,
        status: 'confirmed',
        paymentStatus: 'paid',
        amount: 2500,
        createdAt: new Date(),
    },
    {
        id: 'demo2',
        clientId: 'demo',
        clientName: 'Demo User',
        clientEmail: 'demo@example.com',
        therapistId: '2',
        therapistName: 'Dr. Priya Sharma',
        sessionTime: new Date(Date.now() - 86400000 * 7), // 7 days ago
        duration: 60,
        status: 'completed',
        paymentStatus: 'paid',
        amount: 2000,
        createdAt: new Date(Date.now() - 86400000 * 14),
    },
];

export default function ClientBookingsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    // Reschedule State
    const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [meetLinks, setMeetLinks] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/client/bookings');
            return;
        }

        if (!user) return;

        // Redirect therapists to their own schedule page
        if (user.role === 'therapist') {
            router.push('/therapist/dashboard');
            return;
        }

        // Try to fetch from Firebase
        const q = query(
            collection(db, 'bookings'),
            where('clientId', '==', user.id)
            // orderBy('sessionTime', 'desc') // Removed to avoid index requirement, sorting client-side
        );

        const unsubscribe = onSnapshot(
            q,
            async (snapshot) => {
                if (snapshot.empty) {
                    setBookings([]); // Empty initially, don't show demo data if user has no bookings? 
                    // actually user said they booked things. If empty, maybe they have none?
                    // But if error, we show demo. 
                    // Let's stick to empty if truly empty, or demo if error.
                    // But for this specific fix, I'll just sort the results.
                } else {
                    const fetchedBookings: Booking[] = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                        sessionTime: doc.data().sessionTime?.toDate() || new Date(),
                        createdAt: doc.data().createdAt?.toDate() || new Date(),
                    })) as Booking[];

                    // Sort client-side
                    fetchedBookings.sort((a, b) => b.sessionTime.getTime() - a.sessionTime.getTime());

                    setBookings(fetchedBookings);

                    // Fetch meet links from session_links collection
                    const uniqueTherapistIds = [...new Set(fetchedBookings.map(b => b.therapistId))];
                    const linksMap: Record<string, string> = {};
                    await Promise.all(
                        uniqueTherapistIds.map(async (therapistId) => {
                            try {
                                const linkDocId = `${therapistId}_${user!.id}`;
                                const linkDoc = await getDoc(doc(db, 'session_links', linkDocId));
                                if (linkDoc.exists() && linkDoc.data().meetLink) {
                                    linksMap[therapistId] = linkDoc.data().meetLink;
                                }
                            } catch (e) {
                                console.error('Error fetching meet link for therapist:', therapistId, e);
                            }
                        })
                    );
                    setMeetLinks(linksMap);
                }
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching bookings:', error);
                // setBookings(demoBookings); // Don't show demo data on error
                setBookings([]);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user, authLoading, router]);

    // Fetch slots when date or modal opens
    useEffect(() => {
        if (rescheduleBooking) {
            const fetchSlots = async () => {
                setLoadingSlots(true);
                try {
                    const slots = await BookingService.getAvailableSlots(
                        rescheduleBooking.therapistId,
                        selectedDate,
                        rescheduleBooking.id // Exclude current booking from conflict check
                    );
                    setAvailableSlots(slots);
                } catch (error) {
                    console.error("Failed to fetch slots", error);
                } finally {
                    setLoadingSlots(false);
                }
            };
            fetchSlots();
        }
    }, [selectedDate, rescheduleBooking]);

    const upcomingBookings = bookings.filter(
        (b) => isFuture(b.sessionTime) && b.status !== 'cancelled'
    );
    const pastBookings = bookings.filter(
        (b) => isPast(b.sessionTime) || b.status === 'completed' || b.status === 'cancelled'
    );

    const getStatusBadge = (booking: Booking) => {
        switch (booking.status) {
            case 'confirmed':
                return (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        Confirmed
                    </span>
                );
            case 'completed':
                return (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        Completed
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                        Cancelled
                    </span>
                );
            default:
                return (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                        Pending
                    </span>
                );
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--warm-50)]">
                <Loader2 className="w-8 h-8 text-[var(--primary-500)] animate-spin" />
            </div>
        );
    }

    const handleRescheduleClick = (booking: Booking) => {
        setRescheduleBooking(booking);
        setSelectedDate(new Date(booking.sessionTime)); // Start at the booking's current date
        setSelectedSlot(null); // Reset selected slot
    };

    const handleCancelBooking = async (bookingId: string) => {
        if (!confirm("Are you sure you want to cancel this session?")) return;

        try {
            await BookingService.cancelBooking(bookingId);
            // Optional: Optimistic update or wait for snapshot
        } catch (error: any) {
            alert("Failed to cancel: " + error.message);
        }
    };

    const handleConfirmReschedule = async (time: string) => {
        if (!rescheduleBooking) return;
        setIsRescheduling(true);
        try {
            // Parse date + time
            const [hours, minutes] = time.split(':').map(Number);
            const newSessionTime = new Date(selectedDate);
            newSessionTime.setHours(hours, minutes, 0, 0);

            await BookingService.rescheduleBooking(rescheduleBooking.id, newSessionTime, rescheduleBooking.therapistId);

            setRescheduleBooking(null); // Close modal
            alert("Session Rescheduled Successfully!");
        } catch (error: any) {
            alert("Reschedule Failed: " + error.message);
        } finally {
            setIsRescheduling(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 py-24 px-4 bg-gradient-to-b from-[var(--warm-100)] to-[var(--warm-50)]">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                    >
                        <motion.div variants={fadeInUp} className="flex justify-between items-end mb-8">
                            <div>
                                <motion.h1 className="font-serif text-3xl md:text-4xl text-[var(--primary-700)] mb-2">
                                    My Bookings
                                </motion.h1>
                                <motion.p className="text-[var(--neutral-600)]">
                                    Manage your upcoming and past therapy sessions
                                </motion.p>
                            </div>
                        </motion.div>

                        {/* Tabs */}
                        <motion.div variants={fadeInUp} className="flex gap-2 mb-6">
                            <button
                                onClick={() => setActiveTab('upcoming')}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'upcoming'
                                    ? 'bg-[var(--secondary-500)] text-white'
                                    : 'bg-white text-[var(--neutral-600)] hover:bg-[var(--warm-100)]'
                                    }`}
                            >
                                Upcoming ({upcomingBookings.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('past')}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'past'
                                    ? 'bg-[var(--secondary-500)] text-white'
                                    : 'bg-white text-[var(--neutral-600)] hover:bg-[var(--warm-100)]'
                                    }`}
                            >
                                Past ({pastBookings.length})
                            </button>
                        </motion.div>

                        {/* Bookings List */}
                        <motion.div
                            key={activeTab}
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                            className="space-y-4"
                        >
                            {(activeTab === 'upcoming' ? upcomingBookings : pastBookings).length === 0 ? (
                                <motion.div
                                    variants={fadeInUp}
                                    className="bg-white rounded-xl p-8 text-center"
                                >
                                    <Calendar className="w-12 h-12 text-[var(--neutral-300)] mx-auto mb-4" />
                                    <p className="text-[var(--neutral-500)] mb-4">
                                        {activeTab === 'upcoming'
                                            ? "You don't have any upcoming sessions."
                                            : "You don't have any past sessions."}
                                    </p>
                                    {activeTab === 'upcoming' && (
                                        <Link href="/therapists" className="text-[var(--secondary-600)] font-medium">
                                            Book a Session →
                                        </Link>
                                    )}
                                </motion.div>
                            ) : (
                                (activeTab === 'upcoming' ? upcomingBookings : pastBookings).map((booking) => (
                                    <motion.div
                                        key={booking.id}
                                        variants={fadeInUp}
                                        className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-[var(--primary-100)] rounded-full flex items-center justify-center flex-shrink-0">
                                                    <User className="w-6 h-6 text-[var(--primary-600)]" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-[var(--primary-700)]">
                                                        {booking.therapistName}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-[var(--neutral-500)]">
                                                        <span className="flex items-center">
                                                            <Calendar className="w-4 h-4 mr-1" />
                                                            {format(booking.sessionTime, 'EEE, MMM d, yyyy')}
                                                        </span>
                                                        <span className="flex items-center">
                                                            <Clock className="w-4 h-4 mr-1" />
                                                            {format(booking.sessionTime, 'h:mm a')}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2">
                                                        {getStatusBadge(booking)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                                                {activeTab === 'upcoming' && booking.status === 'confirmed' && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                const link = meetLinks[booking.therapistId];
                                                                if (link) {
                                                                    window.open(link, '_blank');
                                                                } else {
                                                                    alert('Session link not available yet. Your therapist will add the link before the session.');
                                                                }
                                                            }}
                                                            className={`btn py-2 px-4 text-sm flex items-center w-full justify-center ${meetLinks[booking.therapistId]
                                                                ? 'btn-primary'
                                                                : 'bg-[var(--neutral-100)] text-[var(--neutral-500)] cursor-default'
                                                                }`}
                                                        >
                                                            <Video className="w-4 h-4 mr-2" />
                                                            {meetLinks[booking.therapistId] ? 'Join Session' : 'Link Pending'}
                                                        </button>
                                                        <div className="flex gap-2 w-full">
                                                            <button
                                                                onClick={() => handleRescheduleClick(booking)}
                                                                className="btn py-2 px-3 text-sm flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 flex-1 rounded-lg transition-colors"
                                                            >
                                                                Reschedule
                                                            </button>
                                                            <button
                                                                onClick={() => handleCancelBooking(booking.id)}
                                                                className="btn py-2 px-3 text-sm flex items-center justify-center text-red-600 border border-red-200 hover:bg-red-50 flex-1 rounded-lg transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                                {activeTab === 'past' && (booking.status === 'completed' || booking.status === 'confirmed') && (
                                                    booking.isRated ? (
                                                        <span className="px-3 py-1.5 rounded-lg bg-[var(--neutral-100)] text-[var(--neutral-500)] text-sm font-medium flex items-center">
                                                            <Star className="w-4 h-4 mr-1.5 fill-[var(--neutral-400)] text-[var(--neutral-400)]" />
                                                            Rated
                                                        </span>
                                                    ) : (
                                                        <Link
                                                            href={`/client/feedback/${booking.id}`}
                                                            className="btn btn-secondary py-2 px-4 text-sm flex items-center"
                                                        >
                                                            <Star className="w-4 h-4 mr-2" />
                                                            Rate Session
                                                        </Link>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    </motion.div>
                </div>
            </main>

            {/* Reschedule Modal */}
            {rescheduleBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
                    >
                        <div className="p-6 border-b border-[var(--neutral-100)] flex justify-between items-center">
                            <h3 className="text-xl font-serif text-[var(--primary-800)]">Reschedule Session</h3>
                            <button onClick={() => setRescheduleBooking(null)} className="text-[var(--neutral-400)] hover:text-[var(--neutral-600)]">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-[var(--neutral-600)] mb-6">
                                Select a new time for your session with <strong>{rescheduleBooking.therapistName}</strong>.
                            </p>

                            {/* Date Picker (Simplified) */}
                            <div className="flex items-center justify-between mb-6 bg-[var(--neutral-50)] p-3 rounded-xl">
                                <button
                                    onClick={() => { setSelectedDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() - 1); return nd; }); setSelectedSlot(null); }}
                                    className="p-1 hover:bg-white rounded-lg transition-colors"
                                >
                                    ←
                                </button>
                                <span className="font-medium text-[var(--neutral-900)]">
                                    {format(selectedDate, 'EEE, MMM d')}
                                </span>
                                <button
                                    onClick={() => { setSelectedDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() + 1); return nd; }); setSelectedSlot(null); }}
                                    className="p-1 hover:bg-white rounded-lg transition-colors"
                                >
                                    →
                                </button>
                            </div>

                            {/* Slots Grid */}
                            {loadingSlots ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-8 h-8 text-[var(--primary-500)] animate-spin" />
                                </div>
                            ) : availableSlots.length === 0 ? (
                                <div className="text-center py-8 text-[var(--neutral-500)]">
                                    No slots available on this date.
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                                        {availableSlots.map(slot => (
                                            <button
                                                key={slot.time}
                                                onClick={() => setSelectedSlot(slot.time)}
                                                disabled={!slot.isAvailable || isRescheduling}
                                                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${!slot.isAvailable
                                                    ? 'opacity-50 cursor-not-allowed bg-gray-100'
                                                    : selectedSlot === slot.time
                                                        ? 'bg-[var(--primary-600)] text-white ring-2 ring-[var(--primary-200)] shadow-md'
                                                        : 'bg-[var(--neutral-50)] hover:bg-[var(--primary-50)] hover:text-[var(--primary-700)] border border-transparent hover:border-[var(--primary-200)]'
                                                    }`}
                                            >
                                                {slot.time}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Confirm Reschedule Button */}
                                    <div className="mt-4 flex gap-3">
                                        <button
                                            onClick={() => setRescheduleBooking(null)}
                                            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-[var(--neutral-100)] text-[var(--neutral-600)] hover:bg-[var(--neutral-200)] transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => selectedSlot && handleConfirmReschedule(selectedSlot)}
                                            disabled={!selectedSlot || isRescheduling}
                                            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-[var(--primary-600)] text-white hover:bg-[var(--primary-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isRescheduling ? 'Saving...' : 'Confirm Reschedule'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}

            <Footer />
        </div>
    );
}
