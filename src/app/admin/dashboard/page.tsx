'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, getDocs, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking, Therapist, Feedback } from '@/types';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import {
    Calendar,
    Users,
    UserCheck,
    DollarSign,
    Star,
    TrendingUp,
    Clock,
    AlertCircle,
    Loader2,
    Settings,
    FileText,
    MessageCircle
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

// Demo data
const demoStats = {
    totalBookings: 156,
    thisWeekBookings: 24,
    totalClients: 89,
    totalTherapists: 5,
    totalRevenue: 345000,
    avgRating: 4.8,
};

const demoRecentBookings: Booking[] = [
    {
        id: 'ab1',
        clientId: 'c1',
        clientName: 'Rahul Sharma',
        clientEmail: 'rahul@example.com',
        therapistId: '1',
        therapistName: 'Dr. Shiwani Kohli',
        sessionTime: new Date(Date.now() + 3600000 * 2),
        duration: 60,
        status: 'confirmed',
        paymentStatus: 'paid',
        amount: 2500,
        createdAt: new Date(Date.now() - 86400000),
    },
    {
        id: 'ab2',
        clientId: 'c2',
        clientName: 'Priya Gupta',
        clientEmail: 'priya@example.com',
        therapistId: '2',
        therapistName: 'Dr. Priya Sharma',
        sessionTime: new Date(Date.now() + 86400000),
        duration: 60,
        status: 'confirmed',
        paymentStatus: 'paid',
        amount: 2000,
        createdAt: new Date(Date.now() - 86400000 * 2),
    },
    {
        id: 'ab3',
        clientId: 'c3',
        clientName: 'Amit Verma',
        clientEmail: 'amit@example.com',
        therapistId: '3',
        therapistName: 'Dr. Rahul Verma',
        sessionTime: new Date(Date.now() - 86400000),
        duration: 60,
        status: 'completed',
        paymentStatus: 'paid',
        amount: 3500,
        createdAt: new Date(Date.now() - 86400000 * 3),
    },
];

const demoRecentFeedback: Feedback[] = [
    {
        id: 'af1',
        bookingId: 'ab3',
        clientId: 'c3',
        clientName: 'Anonymous',
        therapistId: '1',
        rating: 5,
        comment: 'Excellent session! Dr. Kohli was very understanding and professional.',
        createdAt: new Date(Date.now() - 86400000),
        isPublic: true,
    },
    {
        id: 'af2',
        bookingId: 'ab4',
        clientId: 'c4',
        clientName: 'Anonymous',
        therapistId: '2',
        rating: 4,
        comment: 'Great experience with my child\'s therapy session.',
        createdAt: new Date(Date.now() - 86400000 * 2),
        isPublic: true,
    },
];

export default function AdminDashboardPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [stats, setStats] = useState(demoStats);
    const [recentBookings, setRecentBookings] = useState<Booking[]>(demoRecentBookings);
    const [recentFeedback, setRecentFeedback] = useState<Feedback[]>(demoRecentFeedback);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/admin/dashboard');
            return;
        }

        if (!authLoading && user && user.role !== 'admin') {
            router.push('/');
            return;
        }

        async function fetchData() {
            if (!user) return;

            try {
                // Fetch bookings
                const bookingsQuery = query(
                    collection(db, 'bookings'),
                    orderBy('createdAt', 'desc'),
                    limit(10)
                );
                const bookingsDocs = await getDocs(bookingsQuery);

                if (!bookingsDocs.empty) {
                    const bookings = bookingsDocs.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                        sessionTime: doc.data().sessionTime?.toDate() || new Date(),
                        createdAt: doc.data().createdAt?.toDate() || new Date(),
                    })) as Booking[];
                    setRecentBookings(bookings.slice(0, 5));

                    // Calculate stats
                    const now = new Date();
                    const weekAgo = subDays(now, 7);
                    const thisWeekBookings = bookings.filter((b) =>
                        isWithinInterval(b.createdAt, { start: startOfDay(weekAgo), end: endOfDay(now) })
                    );

                    const uniqueClients = new Set(bookings.map((b) => b.clientId));
                    const totalRevenue = bookings
                        .filter((b) => b.paymentStatus === 'paid')
                        .reduce((acc, b) => acc + (b.amount || 0), 0);

                    setStats((prev) => ({
                        ...prev,
                        totalBookings: bookings.length,
                        thisWeekBookings: thisWeekBookings.length,
                        totalClients: uniqueClients.size,
                        totalRevenue,
                    }));
                }

                // Fetch feedback
                const feedbackQuery = query(
                    collection(db, 'feedback'),
                    orderBy('createdAt', 'desc'),
                    limit(5)
                );
                const feedbackDocs = await getDocs(feedbackQuery);

                if (!feedbackDocs.empty) {
                    const feedback = feedbackDocs.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                        createdAt: doc.data().createdAt?.toDate() || new Date(),
                    })) as Feedback[];
                    setRecentFeedback(feedback);

                    // Calculate average rating
                    const avgRating = feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length;
                    setStats((prev) => ({ ...prev, avgRating }));
                }

                // Fetch therapist count
                const therapistsQuery = query(
                    collection(db, 'therapists'),
                    where('isEnabled', '==', true)
                );
                const therapistsDocs = await getDocs(therapistsQuery);
                setStats((prev) => ({ ...prev, totalTherapists: therapistsDocs.size || 5 }));

            } catch (error) {
                console.log('Using demo data:', error);
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchData();
        }
    }, [user, authLoading, router]);

    const getStatusBadge = (booking: Booking) => {
        switch (booking.status) {
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

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--warm-50)]">
                <Loader2 className="w-8 h-8 text-[var(--primary-500)] animate-spin" />
            </div>
        );
    }

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
                                    Admin Dashboard
                                </h1>
                                <p className="text-[var(--neutral-600)]">
                                    Welcome back, Administrator
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
                                    <span className="text-xs text-green-600 font-medium flex items-center">
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                        +{stats.thisWeekBookings} this week
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-[var(--primary-700)]">{stats.totalBookings}</p>
                                <p className="text-sm text-[var(--neutral-500)]">Total Bookings</p>
                            </div>

                            <div className="bg-white rounded-xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Users className="w-5 h-5 text-blue-600" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-[var(--primary-700)]">{stats.totalClients}</p>
                                <p className="text-sm text-[var(--neutral-500)]">Total Clients</p>
                            </div>

                            <div className="bg-white rounded-xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <DollarSign className="w-5 h-5 text-green-600" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-[var(--primary-700)]">₹{(stats.totalRevenue / 1000).toFixed(0)}k</p>
                                <p className="text-sm text-[var(--neutral-500)]">Total Revenue</p>
                            </div>

                            <div className="bg-white rounded-xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <Star className="w-5 h-5 text-yellow-600" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-[var(--primary-700)]">{stats.avgRating.toFixed(1)}</p>
                                <p className="text-sm text-[var(--neutral-500)]">Average Rating</p>
                            </div>
                        </motion.div>

                        {/* Quick Actions */}
                        <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <Link href="/admin/therapists" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
                                <UserCheck className="w-5 h-5 text-[var(--primary-600)]" />
                                <span className="text-[var(--neutral-700)] font-medium">Therapists</span>
                            </Link>
                            <Link href="/admin/bookings" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-[var(--primary-600)]" />
                                <span className="text-[var(--neutral-700)] font-medium">Bookings</span>
                            </Link>
                            <Link href="/admin/feedback" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
                                <MessageCircle className="w-5 h-5 text-[var(--primary-600)]" />
                                <span className="text-[var(--neutral-700)] font-medium">Feedback</span>
                            </Link>
                            <Link href="/admin/settings" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
                                <Settings className="w-5 h-5 text-[var(--primary-600)]" />
                                <span className="text-[var(--neutral-700)] font-medium">Settings</span>
                            </Link>
                        </motion.div>

                        {/* Recent Activity */}
                        <div className="grid lg:grid-cols-2 gap-8">
                            {/* Recent Bookings */}
                            <motion.div variants={fadeInUp} className="bg-white rounded-xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="font-serif text-lg text-[var(--primary-700)] flex items-center">
                                        <Calendar className="w-5 h-5 mr-2 text-[var(--primary-500)]" />
                                        Recent Bookings
                                    </h2>
                                    <Link href="/admin/bookings" className="text-sm text-[var(--secondary-600)] hover:text-[var(--secondary-700)]">
                                        View All →
                                    </Link>
                                </div>

                                <div className="space-y-4">
                                    {recentBookings.slice(0, 4).map((booking) => (
                                        <div key={booking.id} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-[var(--neutral-700)] truncate">{booking.clientName}</p>
                                                <p className="text-sm text-[var(--neutral-500)]">
                                                    {booking.therapistName} • {format(booking.sessionTime, 'MMM d, h:mm a')}
                                                </p>
                                            </div>
                                            <div className="ml-4">
                                                {getStatusBadge(booking)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Recent Feedback */}
                            <motion.div variants={fadeInUp} className="bg-white rounded-xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="font-serif text-lg text-[var(--primary-700)] flex items-center">
                                        <Star className="w-5 h-5 mr-2 text-[var(--primary-500)]" />
                                        Recent Feedback
                                    </h2>
                                    <Link href="/admin/feedback" className="text-sm text-[var(--secondary-600)] hover:text-[var(--secondary-700)]">
                                        View All →
                                    </Link>
                                </div>

                                <div className="space-y-4">
                                    {recentFeedback.slice(0, 3).map((feedback) => (
                                        <div key={feedback.id} className="p-4 bg-[var(--warm-50)] rounded-xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`w-4 h-4 ${star <= feedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-[var(--neutral-300)]'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-xs text-[var(--neutral-500)]">
                                                    {format(feedback.createdAt, 'MMM d')}
                                                </span>
                                            </div>
                                            {feedback.comment && (
                                                <p className="text-sm text-[var(--neutral-600)] line-clamp-2">
                                                    &ldquo;{feedback.comment}&rdquo;
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
