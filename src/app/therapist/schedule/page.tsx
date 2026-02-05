'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking } from '@/types';
import { format, isPast, isFuture } from 'date-fns';
import {
    Calendar,
    Clock,
    User,
    Loader2,
    CheckCircle,
    XCircle,
    Video
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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

// Demo bookings for therapist view
const demoBookings: Booking[] = [
    {
        id: 'demo1',
        clientId: 'c1',
        clientName: 'Rahul Sharma',
        clientEmail: 'rahul@example.com',
        therapistId: 't1',
        therapistName: 'Dr. You',
        sessionTime: new Date(Date.now() + 86400000 * 2), // 2 days from now
        duration: 60,
        status: 'confirmed',
        paymentStatus: 'paid',
        amount: 2500,
        createdAt: new Date(),
    },
    {
        id: 'demo2',
        clientId: 'c2',
        clientName: 'Priya Gupta',
        clientEmail: 'priya@example.com',
        therapistId: 't1',
        therapistName: 'Dr. You',
        sessionTime: new Date(Date.now() - 86400000 * 2), // 2 days ago
        duration: 60,
        status: 'completed',
        paymentStatus: 'paid',
        amount: 2500,
        createdAt: new Date(),
    },
];

export default function TherapistSchedulePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [processingId, setProcessingId] = useState<string | null>(null);

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

        // Try to fetch from Firebase
        // Note: Composite index "therapistId ASC, sessionTime DESC" might be needed.
        const q = query(
            collection(db, 'bookings'),
            where('therapistId', '==', user.uid),
            orderBy('sessionTime', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                if (snapshot.empty) {
                    setBookings(demoBookings);
                } else {
                    const fetchedBookings: Booking[] = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                        sessionTime: doc.data().sessionTime?.toDate() || new Date(),
                        createdAt: doc.data().createdAt?.toDate() || new Date(),
                    })) as Booking[];
                    setBookings(fetchedBookings);
                }
                setLoading(false);
            },
            (error) => {
                console.log('Using demo bookings (Schedule):', error.message);
                setBookings(demoBookings);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user, authLoading, router]);

    const handleMarkAsDone = async (bookingId: string) => {
        if (!confirm('Mark this session as completed?')) return;

        setProcessingId(bookingId);
        try {
            const bookingRef = doc(db, 'bookings', bookingId);
            await updateDoc(bookingRef, {
                status: 'completed'
            });
            // Toast or notification could go here
        } catch (error) {
            console.error('Error updating booking:', error);
            alert('Failed to update booking status. (Note: Demo data cannot be updated)');
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
            alert('Failed to cancel session. (Note: Demo data cannot be updated)');
        } finally {
            setProcessingId(null);
        }
    };

    const upcomingBookings = bookings.filter(
        (b) => isFuture(b.sessionTime) && b.status !== 'cancelled' && b.status !== 'completed'
    );

    // Past bookings include completed, cancelled, or time-passed bookings
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

    if (authLoading || (loading && user?.role === 'therapist')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--warm-50)]">
                <Loader2 className="w-8 h-8 text-[var(--primary-500)] animate-spin" />
            </div>
        );
    }

    if (!user || user.role !== 'therapist') return null;

    const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

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
                        <motion.h1
                            variants={fadeInUp}
                            className="font-serif text-3xl md:text-4xl text-[var(--primary-700)] mb-2"
                        >
                            My Schedule
                        </motion.h1>
                        <motion.p
                            variants={fadeInUp}
                            className="text-[var(--neutral-600)] mb-8"
                        >
                            Manage your therapy sessions and patient statuses
                        </motion.p>

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
                        <motion.div variants={staggerContainer} className="space-y-4">
                            {displayedBookings.length === 0 ? (
                                <motion.div
                                    variants={fadeInUp}
                                    className="bg-white rounded-xl p-8 text-center"
                                >
                                    <Calendar className="w-12 h-12 text-[var(--neutral-300)] mx-auto mb-4" />
                                    <p className="text-[var(--neutral-500)] mb-4">
                                        {activeTab === 'upcoming'
                                            ? "You don't have any upcoming sessions."
                                            : "No past sessions found."}
                                    </p>
                                </motion.div>
                            ) : (
                                displayedBookings.map((booking) => (
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
                                                {activeTab === 'upcoming' && booking.status === 'confirmed' && (
                                                    <>
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
                                                    </>
                                                )}
                                                {/* For past bookings, maybe view feedback? */}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
