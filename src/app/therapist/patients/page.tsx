'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking } from '@/types';
import { format } from 'date-fns';
import {
    ArrowLeft,
    User,
    Calendar,
    Clock,
    FileText,
    Search,
    Loader2,
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

interface Patient {
    id: string;
    name: string;
    email: string;
    totalSessions: number;
    lastSession: Date | null;
    upcomingSessions: number;
}

// Demo patients - REMOVED
const demoPatients: Patient[] = [];

export default function TherapistPatientsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (!authLoading && user && user.role !== 'therapist' && user.role !== 'admin') {
            router.push('/');
            return;
        }

        async function fetchPatients() {
            if (!user) return;

            try {
                const bookingsQuery = query(
                    collection(db, 'bookings'),
                    where('therapistId', '==', user.id)
                );
                const bookingsDocs = await getDocs(bookingsQuery);

                if (bookingsDocs.empty) {
                    setPatients([]);
                } else {
                    // Group bookings by client to build patient list
                    const patientMap = new Map<string, Patient>();

                    bookingsDocs.docs.forEach((bookingDoc) => {
                        const booking = bookingDoc.data() as Booking;
                        const existing = patientMap.get(booking.clientId);

                        const sessionTime = booking.sessionTime instanceof Date
                            ? booking.sessionTime
                            : new Date((booking.sessionTime as { seconds: number }).seconds * 1000);

                        if (existing) {
                            existing.totalSessions++;
                            if (booking.status === 'completed' && (!existing.lastSession || sessionTime > existing.lastSession)) {
                                existing.lastSession = sessionTime;
                            }
                            if (sessionTime > new Date() && booking.status !== 'cancelled') {
                                existing.upcomingSessions++;
                            }
                        } else {
                            patientMap.set(booking.clientId, {
                                id: booking.clientId,
                                name: booking.clientName,
                                email: booking.clientEmail,
                                totalSessions: 1,
                                lastSession: booking.status === 'completed' ? sessionTime : null,
                                upcomingSessions: sessionTime > new Date() && booking.status !== 'cancelled' ? 1 : 0,
                            });
                        }
                    });

                    setPatients(Array.from(patientMap.values()));
                }
            } catch (error) {
                console.log('Error fetching patients:', error);
                setPatients([]); // No demo fallback
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchPatients();
        }
    }, [user, authLoading, router]);

    const filteredPatients = patients.filter((patient) => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return true;

        const name = patient.name || '';
        const email = patient.email || '';

        return (
            name.toLowerCase().includes(term) ||
            email.toLowerCase().includes(term)
        );
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
                <div className="max-w-4xl mx-auto">
                    <Link
                        href="/therapist/dashboard"
                        className="inline-flex items-center text-sm text-[var(--neutral-500)] hover:text-[var(--primary-600)] transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>

                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                    >
                        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
                            <h1 className="font-serif text-3xl text-[var(--primary-700)] mb-4 sm:mb-0">
                                My Patients
                            </h1>

                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--neutral-400)]" />
                                <input
                                    type="text"
                                    placeholder="Search patients..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="input !pl-14 py-2 text-sm w-full sm:w-64"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--neutral-400)] hover:text-[var(--neutral-600)]"
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </motion.div>

                        {/* Patients List */}
                        <div className="space-y-4">
                            {filteredPatients.length === 0 ? (
                                <div
                                    className="bg-white rounded-xl p-8 text-center"
                                >
                                    <div className="flex justify-center mb-4">
                                        <div className="w-12 h-12 bg-[var(--neutral-100)] rounded-full flex items-center justify-center">
                                            <Search className="w-6 h-6 text-[var(--neutral-400)]" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-medium text-[var(--primary-700)] mb-2">No patients found</h3>
                                    <p className="text-[var(--neutral-500)] mb-6">
                                        We couldn't find any patients matching "{searchTerm}"
                                    </p>
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="btn btn-secondary px-6"
                                    >
                                        Clear Search
                                    </button>
                                </div>
                            ) : (
                                filteredPatients.map((patient) => (
                                    <div
                                        key={patient.id}
                                        className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-[var(--primary-100)] rounded-full flex items-center justify-center flex-shrink-0">
                                                    <User className="w-6 h-6 text-[var(--primary-600)]" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-[var(--primary-700)]">
                                                        {patient.name}
                                                    </h3>
                                                    <p className="text-sm text-[var(--neutral-500)]">{patient.email}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                                <div className="flex items-center text-[var(--neutral-500)]">
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    <span>{patient.totalSessions} sessions</span>
                                                </div>
                                                {patient.lastSession && (
                                                    <div className="flex items-center text-[var(--neutral-500)]">
                                                        <Clock className="w-4 h-4 mr-1" />
                                                        <span>Last: {format(patient.lastSession, 'MMM d')}</span>
                                                    </div>
                                                )}
                                                {patient.upcomingSessions > 0 && (
                                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                                        {patient.upcomingSessions} upcoming
                                                    </span>
                                                )}
                                            </div>

                                            <Link
                                                href={`/therapist/patients/${patient.id}`}
                                                className="btn btn-secondary py-2 px-4 text-sm flex items-center"
                                            >
                                                <FileText className="w-4 h-4 mr-2" />
                                                View Notes
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
