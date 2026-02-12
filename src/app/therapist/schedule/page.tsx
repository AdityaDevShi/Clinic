'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc, deleteDoc, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking, BusySlot, TimeSlot, Availability } from '@/types';
import { format, isPast, isFuture, startOfDay, endOfDay, addMinutes, isSameDay } from 'date-fns';
import {
    Calendar,
    Clock,
    User,
    Loader2,
    CheckCircle,
    XCircle,
    Video,
    ArrowLeft,
    Shield,
    Trash2,
    Plus
} from 'lucide-react';
import TimeSlotPicker from '@/components/scheduling/TimeSlotPicker';
import { getDefaultAvailability } from '@/lib/scheduling/availability';

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

export default function TherapistSchedulePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Blocking Mode States
    const [isBlockingMode, setIsBlockingMode] = useState(false);
    const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [selectedSlotForBlock, setSelectedSlotForBlock] = useState<TimeSlot | null>(null);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login?redirect=/therapist/schedule');
                return;
            }
            if (user.role !== 'therapist') {
                router.push('/');
                return;
            }
        }

        if (!user) return;

        // 1. Fetch Bookings
        const qBookings = query(
            collection(db, 'bookings'),
            where('therapistId', '==', user.id)
        );

        const unsubscribeBookings = onSnapshot(
            qBookings,
            (snapshot) => {
                const fetchedBookings: Booking[] = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    sessionTime: doc.data().sessionTime?.toDate() || new Date(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                })) as Booking[];

                fetchedBookings.sort((a, b) => b.sessionTime.getTime() - a.sessionTime.getTime());
                setBookings(fetchedBookings);
                setLoading(false);
            },
            (error) => {
                console.log('Firebase error (Bookings):', error.message);
                setBookings([]);
                setLoading(false);
            }
        );

        // 2. Fetch Busy Slots
        const qBusy = query(
            collection(db, 'busy_slots'),
            where('therapistId', '==', user.id)
        );

        const unsubscribeBusy = onSnapshot(
            qBusy,
            (snapshot) => {
                const fetchedBusy: BusySlot[] = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    startTime: doc.data().startTime?.toDate() || new Date(),
                    endTime: doc.data().endTime?.toDate() || new Date(),
                })) as BusySlot[];
                setBusySlots(fetchedBusy);
            },
            (error) => {
                console.log('Firebase error (Busy):', error.message);
            }
        );

        // 3. Fetch Availability
        const fetchAvailability = async () => {
            const qAvail = query(
                collection(db, 'availability'),
                where('therapistId', '==', user.id)
            );
            const snapshot = await getDocs(qAvail);
            if (!snapshot.empty) {
                setAvailability(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Availability)));
            } else {
                setAvailability(getDefaultAvailability(user.id));
            }
        };
        fetchAvailability();

        return () => {
            unsubscribeBookings();
            unsubscribeBusy();
        };
    }, [user, authLoading, router]);

    const handleMarkAsDone = async (bookingId: string) => {
        if (!confirm('Mark this session as completed?')) return;

        setProcessingId(bookingId);
        try {
            const bookingRef = doc(db, 'bookings', bookingId);
            await updateDoc(bookingRef, {
                status: 'completed'
            });
        } catch (error) {
            console.error('Error updating booking:', error);
            alert('Failed to update booking status.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancelSession = async (bookingId: string) => {
        if (!confirm('Are you sure you want to cancel this session? This action cannot be undone.')) return;

        setProcessingId(bookingId);
        try {
            const bookingRef = doc(db, 'bookings', bookingId);
            await updateDoc(bookingRef, {
                status: 'cancelled'
            });
        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert('Failed to cancel session.');
        } finally {
            setProcessingId(null);
        }
    };

    // --- BLOCKING LOGIC START ---

    const handleBlockSlot = async (slot: TimeSlot) => {
        if (!user) return;

        // If it's already blocked (not available), we might want to unblock it?
        // But TimeSlotPicker returns the slot object. We need to find the specific busy slot doc to delete if unblocking.
        // For now, let's check if it overlaps with an existing busy slot to unblock.

        const existingBusySlot = busySlots.find(b =>
            b.startTime.getTime() === slot.date.getTime()
        );

        if (existingBusySlot) {
            // UNBLOCK
            if (!confirm(`Unblock this slot (${format(slot.date, 'h:mm a')})?`)) return;
            setProcessingId('block-action');
            try {
                await deleteDoc(doc(db, 'busy_slots', existingBusySlot.id));
            } catch (error) {
                console.error("Error unblocking:", error);
                alert("Failed to unblock slot.");
            } finally {
                setProcessingId(null);
                setSelectedSlotForBlock(null);
            }
        } else {
            // BLOCK
            if (!confirm(`Block this slot (${format(slot.date, 'h:mm a')})? Clients won't be able to book it.`)) return;
            setProcessingId('block-action');
            try {
                await addDoc(collection(db, 'busy_slots'), {
                    therapistId: user.id,
                    startTime: Timestamp.fromDate(slot.date),
                    endTime: Timestamp.fromDate(addMinutes(slot.date, 60)), // 60 min block
                    reason: 'Therapist Blocked',
                    createdAt: Timestamp.now()
                });
            } catch (error) {
                console.error("Error blocking:", error);
                alert("Failed to block slot.");
            } finally {
                setProcessingId(null);
                setSelectedSlotForBlock(null);
            }
        }
    };

    const handleBlockWholeDay = async () => {
        if (!selectedSlotForBlock || !user) return;
        const date = selectedSlotForBlock.date;

        if (!confirm(`Are you sure you want to block THE ENTIRE DAY (${format(date, 'MMM d')})?`)) return;

        setProcessingId('block-action');
        try {
            // Create a block for the whole day (00:00 to 23:59)
            // Or just covering working hours? Whole day is safer.
            const start = startOfDay(date);
            const end = endOfDay(date);

            await addDoc(collection(db, 'busy_slots'), {
                therapistId: user.id,
                startTime: Timestamp.fromDate(start),
                endTime: Timestamp.fromDate(end),
                reason: 'Whole Day Blocked',
                createdAt: Timestamp.now()
            });
            alert("Whole day blocked successfully.");
        } catch (error) {
            console.error("Error blocking day:", error);
            alert("Failed to block day.");
        } finally {
            setProcessingId(null);
            setSelectedSlotForBlock(null);
        }
    };

    // --- BLOCKING LOGIC END ---

    const upcomingBookings = bookings.filter(
        (b) => isFuture(b.sessionTime) && b.status !== 'cancelled' && b.status !== 'completed'
    );

    const pastBookings = bookings.filter(
        (b) => isPast(b.sessionTime) || b.status === 'completed' || b.status === 'cancelled'
    );

    const getStatusBadge = (booking: Booking) => {
        switch (booking.status) {
            case 'confirmed': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Confirmed</span>;
            case 'completed': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Completed</span>;
            case 'cancelled': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Cancelled</span>;
            default: return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Pending</span>;
        }
    };

    if (authLoading || (loading && user?.role === 'therapist')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--warm-50)]">
                <Loader2 className="w-8 h-8 text-[var(--primary-500)] animate-spin" />
            </div>
        );
    }

    if (!user || user.role !== 'therapist') return null;

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
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <motion.div variants={fadeInUp}>
                                <Link
                                    href="/therapist/dashboard"
                                    className="inline-flex items-center text-[var(--neutral-600)] hover:text-[var(--primary-600)] transition-colors mb-2"
                                >
                                    <ArrowLeft className="w-5 h-5 mr-2" />
                                    Back to Dashboard
                                </Link>
                                <h1 className="font-serif text-3xl md:text-4xl text-[var(--primary-700)]">
                                    {isBlockingMode ? 'Manage Availability' : 'My Schedule'}
                                </h1>
                            </motion.div>

                            <motion.div variants={fadeInUp}>
                                <button
                                    onClick={() => setIsBlockingMode(!isBlockingMode)}
                                    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${isBlockingMode
                                        ? 'bg-[var(--primary-100)] text-[var(--primary-700)] border border-[var(--primary-200)]'
                                        : 'bg-white text-[var(--neutral-700)] border border-[var(--neutral-300)] hover:bg-[var(--neutral-50)]'
                                        }`}
                                >
                                    {isBlockingMode ? (
                                        <>
                                            <Calendar className="w-4 h-4 mr-2" />
                                            View Bookings
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="w-4 h-4 mr-2" />
                                            Block Time / Manage Support
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        </div>

                        {isBlockingMode ? (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--primary-100)] animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-xl flex items-start gap-3">
                                    <Shield className="w-5 h-5 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Availability Manager</p>
                                        <p className="text-sm mt-1 opacity-90">
                                            Click on any slot to <strong>Block</strong> or <strong>Unblock</strong> it.
                                            Blocked slots will not be visible to clients.
                                        </p>
                                    </div>
                                </div>

                                <TimeSlotPicker
                                    availability={availability}
                                    busySlots={busySlots}
                                    existingBookings={bookings}
                                    selectedSlot={selectedSlotForBlock}
                                    onSelectSlot={(slot) => {
                                        if (!slot) return;
                                        // Save slot to state to potentially confirm actions?
                                        // Or just act immediately/confirm via dialog
                                        handleBlockSlot(slot);
                                    }}
                                    showAllSlots={true} // SHOW unavailable/blocked slots
                                    disabled={!!processingId}
                                />

                                {/* Action Bar for Block Mode - Optional Context Actions */}
                                {selectedSlotForBlock && (
                                    <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-[var(--neutral-100)]">
                                        {/* This section might be redundant if we handle click-to-block directly, 
                                            but kept if we want a "Block Whole Day" specific button triggered by selection */}
                                    </div>
                                )}

                                <div className="mt-8 pt-8 border-t border-[var(--neutral-200)]">
                                    <h3 className="font-medium text-[var(--neutral-700)] mb-4">Quick Actions</h3>
                                    <div className="flex flex-wrap gap-4">
                                        <button
                                            onClick={() => {
                                                // We need a date to block whole day. Let's ask user to pick a date first via the picker?
                                                // Or just use today/selected date from picker state if we lift it up?
                                                // For now, let's keep it simple: Click slot -> Confirm dialog has "Block Slot" or "Block Whole Day" options?
                                                // Let's modify handleBlockSlot to offer "Block Day" option in a custom UI instead of window.confirm if we wanted to get fancy.
                                                // For now, let's rely on the picker.
                                                alert("To block a whole day, please define a 'Busy Slot' covering 00:00 to 23:59 manually or contact admin. (Feature coming soon)");
                                            }}
                                            className="hidden px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium"
                                        >
                                            Block Custom Range
                                        </button>

                                        {/* To properly implement "Block Whole Day", we'd need access to the currently selected date in TimeSlotPicker.
                                            But that state is internal to TimeSlotPicker. 
                                            We might need to rely on the user clicking a slot, then we ask "Block just 10am or Whole Day?"
                                        */}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <motion.p variants={fadeInUp} className="text-[var(--neutral-600)] mb-8">
                                    Manage your therapy sessions and patient statuses
                                </motion.p>
                                {/* Existing Bookings Lists... */}
                                {/* SECTION 1: Upcoming Sessions */}
                                <motion.div variants={fadeInUp} className="mb-12">
                                    <h2 className="text-xl font-serif text-[var(--primary-800)] mb-4 flex items-center gap-2">
                                        <Calendar className="w-5 h-5" />
                                        Upcoming Sessions
                                    </h2>
                                    <div className="space-y-4">
                                        {upcomingBookings.length === 0 ? (
                                            <div className="bg-white rounded-xl p-8 text-center border border-dashed border-[var(--neutral-200)]">
                                                <p className="text-[var(--neutral-500)]">
                                                    You don't have any upcoming sessions.
                                                </p>
                                            </div>
                                        ) : (
                                            upcomingBookings.map((booking) => (
                                                <motion.div
                                                    key={booking.id}
                                                    variants={fadeInUp}
                                                    className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border-l-4 border-[var(--primary-500)]"
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-12 h-12 bg-[var(--primary-100)] rounded-full flex items-center justify-center flex-shrink-0">
                                                                <User className="w-6 h-6 text-[var(--primary-600)]" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-medium text-[var(--primary-700)] flex items-center gap-2">
                                                                    {booking.clientName}
                                                                    <span className="text-xs font-normal text-[var(--neutral-400)] bg-[var(--neutral-100)] px-2 py-0.5 rounded-full">
                                                                        Patient
                                                                    </span>
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
                                                            <button
                                                                onClick={() => handleMarkAsDone(booking.id)}
                                                                disabled={!!processingId}
                                                                className="btn btn-primary py-2 px-4 text-sm flex items-center disabled:opacity-50"
                                                            >
                                                                {processingId === booking.id ? (
                                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                ) : (
                                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                                )}
                                                                Mark as Done
                                                            </button>
                                                            <button
                                                                onClick={() => handleCancelSession(booking.id)}
                                                                disabled={!!processingId}
                                                                className="btn btn-secondary py-2 px-4 text-sm flex items-center text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50"
                                                            >
                                                                <XCircle className="w-4 h-4 mr-2" />
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>

                                {/* SECTION 2: Past Sessions */}
                                <motion.div variants={fadeInUp}>
                                    <h2 className="text-xl font-serif text-[var(--neutral-500)] mb-4 flex items-center gap-2 border-t pt-8">
                                        <Clock className="w-5 h-5" />
                                        Past Sessions
                                    </h2>
                                    <div className="space-y-4">
                                        {pastBookings.length === 0 ? (
                                            <div className="p-8 text-center">
                                                <p className="text-[var(--neutral-400)]">
                                                    No past sessions found.
                                                </p>
                                            </div>
                                        ) : (
                                            pastBookings.map((booking) => (
                                                <motion.div
                                                    key={booking.id}
                                                    variants={fadeInUp}
                                                    className="bg-gray-50 rounded-xl p-5 border border-gray-200 grayscale opacity-75"
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                                <User className="w-6 h-6 text-gray-500" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                                                                    {booking.clientName}
                                                                </h3>
                                                                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                                                                    <span className="flex items-center">
                                                                        <Calendar className="w-4 h-4 mr-1" />
                                                                        {format(booking.sessionTime, 'EEE, MMM d, yyyy')}
                                                                    </span>
                                                                    <span className="flex items-center">
                                                                        <Clock className="w-4 h-4 mr-1" />
                                                                        {format(booking.sessionTime, 'h:mm a')}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-2 text-gray-500">
                                                                    {getStatusBadge(booking)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            </>
                        )}

                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
