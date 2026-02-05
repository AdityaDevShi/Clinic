'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, getDocs, orderBy, limit, where, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking, TimeSlot } from '@/types';
import { format, isSameDay, addDays } from 'date-fns';
import { BookingService } from '@/services/bookingService';
import {
    Calendar,
    Users,
    Clock,
    DollarSign,
    TrendingUp,
    Loader2,
    FileText,
    User,
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
            staggerChildren: 0.05
        }
    }
};

// Demo data for fallback
const demoStats = {
    appointmentsToday: 3,
    totalPatients: 12,
    hoursThisMonth: 45,
    earningsThisMonth: 112500,
};

const demoRecentBookings: Booking[] = [
    {
        id: 'tb1',
        clientId: 'c1',
        clientName: 'Rahul Sharma',
        clientEmail: 'rahul@example.com',
        therapistId: 't1',
        therapistName: 'Dr. You',
        sessionTime: new Date(Date.now() + 3600000 * 2), // 2 hours from now
        duration: 60,
        status: 'confirmed',
        paymentStatus: 'paid',
        amount: 2500,
        createdAt: new Date(),
    },
    {
        id: 'tb2',
        clientId: 'c2',
        clientName: 'Priya Gupta',
        clientEmail: 'priya@example.com',
        therapistId: 't1',
        therapistName: 'Dr. You',
        sessionTime: new Date(Date.now() + 86400000), // Tomorrow
        duration: 60,
        status: 'confirmed',
        paymentStatus: 'paid',
        amount: 2500,
        createdAt: new Date(),
    },
];

export default function TherapistDashboardPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [stats, setStats] = useState({
        appointmentsToday: 0,
        totalPatients: 0,
        hoursThisMonth: 0,
        earningsThisMonth: 0,
    });
    const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    // Action States
    const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Fetch slots for rescheduling
    useEffect(() => {
        if (rescheduleBooking) {
            const fetchSlots = async () => {
                setLoadingSlots(true);
                try {
                    const slots = await BookingService.getAvailableSlots(
                        rescheduleBooking.therapistId,
                        selectedDate,
                        rescheduleBooking.id
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

    const handleCancelBooking = async (bookingId: string) => {
        if (!confirm("Are you sure you want to cancel this session?")) return;
        setIsProcessing(true);
        try {
            await BookingService.cancelBooking(bookingId);
            // Refresh data (simple workaround: reload or re-fetch. Since we use useEffect with user dep, maybe just manual refresh or optimistic update?
            // For now, let's just alert. Ideally we'd trigger a reload of fetch.
            window.location.reload(); // Simple refresh for now to see updates
        } catch (error: any) {
            alert("Failed to cancel: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRescheduleClick = (booking: Booking) => {
        setRescheduleBooking(booking);
        setSelectedDate(booking.sessionTime);
    };

    const handleConfirmReschedule = async (time: string) => {
        if (!rescheduleBooking) return;
        setIsProcessing(true);
        try {
            const [hours, minutes] = time.split(':').map(Number);
            const newSessionTime = new Date(selectedDate);
            newSessionTime.setHours(hours, minutes, 0, 0);

            await BookingService.rescheduleBooking(rescheduleBooking.id, newSessionTime, rescheduleBooking.therapistId);

            setRescheduleBooking(null);
            alert("Session Rescheduled Successfully!");
            window.location.reload();
        } catch (error: any) {
            alert("Reschedule Failed: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        // Auth Check
        if (!authLoading) {
            if (!user) {
                router.push('/login?redirect=/therapist/dashboard');
                return;
            }
            if (user.role !== 'therapist') {
                router.push('/');
                return;
            }
        }

        async function fetchData() {
            if (!user) return;

            try {
                // 1. Ensure Therapist Profile Exists (Auto-create if missing)
                const therapistRef = doc(db, 'therapists', user.id);
                const therapistSnap = await getDoc(therapistRef);

                if (!therapistSnap.exists()) {
                    console.log('Creating missing therapist profile...');
                    await setDoc(therapistRef, {
                        name: user.name,
                        email: user.email,
                        specialization: 'General Psychologist', // Default
                        bio: 'Welcome to my practice.',
                        hourlyRate: 1500, // Default price
                        isOnline: true,
                        isEnabled: true,
                        lastOnline: new Date(),
                        rating: 5.0,
                        reviewCount: 1,
                        languages: ['English'],
                        qualifications: ['Licensed Psychologist']
                    });
                }

                // Fetch bookings for this therapist (Fetch ALL for accurate stats)
                const bookingsQuery = query(
                    collection(db, 'bookings'),
                    where('therapistId', '==', user.id)
                    // orderBy('sessionTime', 'desc') // Removed to avoid index requirement
                );

                const bookingsDocs = await getDocs(bookingsQuery);

                if (!bookingsDocs.empty) {
                    const bookings = bookingsDocs.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                        sessionTime: doc.data().sessionTime?.toDate() || new Date(),
                        createdAt: doc.data().createdAt?.toDate() || new Date(),
                    })) as Booking[];

                    // Sort client-side
                    bookings.sort((a, b) => b.sessionTime.getTime() - a.sessionTime.getTime());

                    // Set recent bookings (just take first 5 for the list)
                    setRecentBookings(bookings.slice(0, 5));

                    // Calculate stats
                    const now = new Date();
                    const appointmentsToday = bookings.filter(b => isSameDay(b.sessionTime, now)).length;

                    // Calculate Total Patients (Unique Client IDs)
                    const uniquePatients = new Set(bookings.map(b => b.clientId));

                    // Earnings (sum of all bookings)
                    const earnings = bookings.reduce((acc, curr) =>
                        // Only count paid/completed/confirmed for earnings (simplified)
                        ['paid', 'confirmed', 'completed'].includes(curr.status) ? acc + (curr.amount || 0) : acc
                        , 0);

                    setStats({
                        appointmentsToday,
                        totalPatients: uniquePatients.size,
                        hoursThisMonth: bookings.filter(b => b.status === 'completed').length, // Count completed sessions as hours
                        earningsThisMonth: earnings
                    });
                }
            } catch (error) {
                console.error('Error fetching therapist data:', error);
            } finally {
                setLoading(false);
            }
        }

        if (user && user.role === 'therapist') {
            fetchData();
        } else if (!authLoading && !user) {
            // Handled by first auth check block
        } else {
            // If role is wrong, handled by first block, but we set loading false to show nothing/redirect
            if (!authLoading) setLoading(false);
        }

    }, [user, authLoading, router]);

    const getStatusBadge = (status: Booking['status']) => {
        switch (status) {
            case 'confirmed':
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Confirmed</span>;
            case 'completed':
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Completed</span>;
            case 'cancelled':
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Cancelled</span>;
            default:
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Pending</span>;
        }
    };

    if (authLoading || (loading && user?.role === 'therapist')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--warm-50)]">
                <Loader2 className="w-8 h-8 text-[var(--primary-500)] animate-spin" />
            </div>
        );
    }

    if (!user || user.role !== 'therapist') return null; // Router will redirect

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 py-24 px-4 bg-gradient-to-b from-[var(--warm-100)] to-[var(--warm-50)]">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                    >
                        {/* Header */}
                        <motion.div variants={fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                            <div>
                                <h1 className="font-serif text-3xl md:text-4xl text-[var(--primary-700)] mb-2">
                                    Therapist Dashboard
                                </h1>
                                <p className="text-[var(--neutral-600)]">
                                    Welcome, {user.name}
                                </p>
                            </div>
                            <p className="text-sm text-[var(--neutral-500)] mt-2 md:mt-0">
                                {format(new Date(), 'EEEE, MMMM d, yyyy')}
                            </p>
                        </motion.div>

                        {/* Stats Grid */}
                        <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white rounded-xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 bg-[var(--primary-100)] rounded-full flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-[var(--primary-600)]" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-[var(--primary-700)]">{stats.appointmentsToday}</p>
                                <p className="text-sm text-[var(--neutral-500)]">Appointments Today</p>
                            </div>

                            <div className="bg-white rounded-xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Users className="w-5 h-5 text-blue-600" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-[var(--primary-700)]">{stats.totalPatients}</p>
                                <p className="text-sm text-[var(--neutral-500)]">Total Patients</p>
                            </div>

                            <div className="bg-white rounded-xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-purple-600" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-[var(--primary-700)]">{stats.hoursThisMonth}</p>
                                <p className="text-sm text-[var(--neutral-500)]">Hours (Month)</p>
                            </div>

                            <div className="bg-white rounded-xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <DollarSign className="w-5 h-5 text-green-600" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-[var(--primary-700)]">₹{(stats.earningsThisMonth / 1000).toFixed(1)}k</p>
                                <p className="text-sm text-[var(--neutral-500)]">Earnings (Month)</p>
                            </div>
                        </motion.div>

                        {/* Quick Actions */}
                        <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <Link href="/therapist/schedule" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-[var(--primary-600)]" />
                                <span className="text-[var(--neutral-700)] font-medium">My Schedule</span>
                            </Link>
                            <Link href="/therapist/patients" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
                                <Users className="w-5 h-5 text-[var(--primary-600)]" />
                                <span className="text-[var(--neutral-700)] font-medium">My Patients</span>
                            </Link>
                            <Link href="/therapist/profile" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
                                <User className="w-5 h-5 text-[var(--primary-600)]" />
                                <span className="text-[var(--neutral-700)] font-medium">Edit Profile</span>
                            </Link>
                            <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3 opacity-50 cursor-not-allowed">
                                <FileText className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-400 font-medium">Reports</span>
                            </div>
                        </motion.div>

                        {/* Recent Bookings */}
                        <motion.div variants={fadeInUp} className="bg-white rounded-xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-serif text-lg text-[var(--primary-700)] flex items-center">
                                    <Calendar className="w-5 h-5 mr-2 text-[var(--primary-500)]" />
                                    Upcoming Appointments
                                </h2>
                                <Link href="/therapist/schedule" className="text-sm text-[var(--secondary-600)] hover:text-[var(--secondary-700)]">
                                    View Schedule →
                                </Link>
                            </div>

                            <div className="space-y-4">
                                {recentBookings.length > 0 ? (
                                    recentBookings.map((booking) => (
                                        <div key={booking.id} className="flex items-center justify-between py-4 border-b border-[var(--border)] last:border-0 hover:bg-gray-50 transition-colors px-2 rounded-lg">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-[var(--neutral-700)] truncate">{booking.clientName}</p>
                                                <div className="flex items-center text-sm text-[var(--neutral-500)] mt-1">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {format(booking.sessionTime, 'MMMM d, h:mm a')}
                                                    <span className="mx-2">•</span>
                                                    {booking.duration} mins
                                                </div>
                                            </div>
                                            <div className="ml-4 flex items-center gap-2">
                                                {getStatusBadge(booking.status)}
                                                {booking.status === 'confirmed' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleRescheduleClick(booking)}
                                                            className="px-3 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                                        >
                                                            Reschedule
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancelBooking(booking.id)}
                                                            className="px-3 py-1 text-xs font-medium rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                                <Link
                                                    href={`/therapist/patients/${booking.clientId}`}
                                                    className="text-sm text-[var(--primary-600)] hover:text-[var(--primary-700)] hidden md:block ml-2"
                                                >
                                                    View Patient
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-[var(--neutral-500)]">
                                        No upcoming appointments found.
                                    </div>
                                )}
                            </div>
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
                                Select a new time for appointment with <strong>{rescheduleBooking.clientName}</strong>.
                            </p>

                            {/* Date Picker */}
                            <div className="flex items-center justify-between mb-6 bg-[var(--neutral-50)] p-3 rounded-xl">
                                <button
                                    onClick={() => setSelectedDate(d => addDays(d, -1))}
                                    className="p-1 hover:bg-white rounded-lg transition-colors"
                                >
                                    ←
                                </button>
                                <span className="font-medium text-[var(--neutral-900)]">
                                    {format(selectedDate, 'EEE, MMM d')}
                                </span>
                                <button
                                    onClick={() => setSelectedDate(d => addDays(d, 1))}
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
                                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                                    {availableSlots.map(slot => (
                                        <button
                                            key={slot.time}
                                            onClick={() => handleConfirmReschedule(slot.time)}
                                            disabled={!slot.isAvailable || isProcessing}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${slot.isAvailable
                                                ? 'bg-[var(--neutral-50)] hover:bg-[var(--primary-50)] hover:text-[var(--primary-700)] border border-transparent hover:border-[var(--primary-200)]'
                                                : 'opacity-50 cursor-not-allowed bg-gray-100'
                                                }`}
                                        >
                                            {isProcessing && slot.time === format(new Date(), 'HH:mm') ? '...' : slot.time}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}

            <Footer />
        </div>
    );
}
