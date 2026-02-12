'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking } from '@/types';
import { format } from 'date-fns';
import {
    ArrowLeft,
    Search,
    Calendar,
    User,
    Clock,
    DollarSign,
    Filter,
    Loader2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function AdminBookingsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (!authLoading && user && user.role !== 'admin') {
            router.push('/');
            return;
        }

        async function fetchBookings() {
            try {
                // Fetch last 50 bookings
                const q = query(
                    collection(db, 'bookings'),
                    orderBy('createdAt', 'desc'),
                    limit(50)
                );
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    const fetchedBookings = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                        sessionTime: doc.data().sessionTime?.toDate() || new Date(),
                        createdAt: doc.data().createdAt?.toDate() || new Date(),
                    })) as Booking[];
                    setBookings(fetchedBookings);
                }
            } catch (error) {
                console.error('Error fetching bookings:', error);
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchBookings();
        }
    }, [user, authLoading, router]);

    const getStatusBadge = (status: string) => {
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

    const filteredBookings = bookings.filter((booking) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
            booking.clientName?.toLowerCase().includes(term) ||
            booking.therapistName?.toLowerCase().includes(term) ||
            booking.id.toLowerCase().includes(term);

        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

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
                    <Link
                        href="/admin/dashboard"
                        className="inline-flex items-center text-sm text-[var(--neutral-500)] hover:text-[var(--primary-600)] transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>

                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                            <h1 className="font-serif text-3xl text-[var(--primary-700)]">
                                All Bookings
                            </h1>

                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--neutral-400)]" />
                                    <input
                                        type="text"
                                        placeholder="Search bookings..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="input pl-10 py-2 text-sm w-full sm:w-64"
                                    />
                                </div>
                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--neutral-400)]" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="input pl-10 py-2 text-sm w-full sm:w-40 appearance-none"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="pending">Pending</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[var(--warm-50)] border-b border-[var(--border)]">
                                        <tr>
                                            <th className="text-left py-4 px-6 text-sm font-medium text-[var(--neutral-600)]">Booking ID</th>
                                            <th className="text-left py-4 px-6 text-sm font-medium text-[var(--neutral-600)]">Client</th>
                                            <th className="text-left py-4 px-6 text-sm font-medium text-[var(--neutral-600)]">Therapist</th>
                                            <th className="text-left py-4 px-6 text-sm font-medium text-[var(--neutral-600)]">Session Time</th>
                                            <th className="text-left py-4 px-6 text-sm font-medium text-[var(--neutral-600)]">Amount</th>
                                            <th className="text-left py-4 px-6 text-sm font-medium text-[var(--neutral-600)]">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBookings.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-12 text-center text-[var(--neutral-500)]">
                                                    No bookings found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredBookings.map((booking, index) => (
                                                <tr key={booking.id} className={index !== filteredBookings.length - 1 ? 'border-b border-[var(--border)]' : ''}>
                                                    <td className="py-4 px-6 text-sm text-[var(--neutral-500)] font-mono">
                                                        #{booking.id.slice(-6)}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                                <User className="w-4 h-4 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-[var(--neutral-700)]">{booking.clientName}</p>
                                                                <p className="text-xs text-[var(--neutral-500)]">{booking.clientEmail}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                                <User className="w-4 h-4 text-green-600" />
                                                            </div>
                                                            <p className="text-sm font-medium text-[var(--neutral-700)]">{booking.therapistName}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-sm text-[var(--neutral-600)]">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-[var(--neutral-400)]" />
                                                            {format(booking.sessionTime, 'MMM d, yyyy')}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-[var(--neutral-500)]">
                                                            <Clock className="w-3 h-3" />
                                                            {format(booking.sessionTime, 'h:mm a')} ({booking.duration} min)
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-sm font-medium text-[var(--neutral-900)]">
                                                        ₹{booking.amount}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        {getStatusBadge(booking.status)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
