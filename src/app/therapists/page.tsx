'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Search, Filter, MapPin, Star, ArrowRight, Video, Calendar } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Therapist } from '@/types';


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

// Demo therapists - empty to force real data
const demoTherapists: Therapist[] = [];

const specializations = [
    'All Specializations',
    'Clinical Psychology',
    'Child & Adolescent Psychology',
    'Couples & Family Therapy',
    'Trauma Therapy',
];

export default function TherapistsPage() {
    // Base therapist data - never mutated by filters
    const [allTherapists, setAllTherapists] = useState<Therapist[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All Specializations');
    const [showOnlineOnly, setShowOnlineOnly] = useState(false);

    useEffect(() => {
        // Try to fetch from Firebase
        const q = query(
            collection(db, 'therapists'),
            where('isEnabled', '==', true)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedTherapists: Therapist[] = snapshot.docs
                    .map((doc) => {
                        try {
                            const data = doc.data();
                            console.log(`Therapist ${doc.id} photoUrl:`, data.photoUrl);
                            return {
                                id: doc.id,
                                ...data,
                                // Safe date handling to prevent crashes
                                lastOnline: data.lastOnline?.toDate ? data.lastOnline.toDate() : new Date(),
                            };
                        } catch (err) {
                            console.error(`Error processing therapist doc ${doc.id}:`, err);
                            return null;
                        }
                    })
                    // Filter out nulls and invalid/ghost accounts using strict checks
                    .filter((t: any) =>
                        t !== null &&
                        typeof t.name === 'string' &&
                        t.name.trim() !== '' &&
                        typeof t.email === 'string' &&
                        t.email.trim() !== ''
                    ) as Therapist[];

                // Sort client-side safely
                fetchedTherapists.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

                setAllTherapists(fetchedTherapists);
                setLoading(false);
            },
            (error) => {
                console.log('Firebase error:', error.message);
                setAllTherapists([]);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    // Compute visible therapists from base list - NEVER mutate allTherapists
    const visibleTherapists = allTherapists.filter((therapist) => {
        // Online filter
        if (showOnlineOnly && !therapist.isOnline) {
            return false;
        }
        // Specialization filter
        if (filter !== 'All Specializations' && therapist.specialization !== filter) {
            return false;
        }
        return true;
    });

    return (
        <div className="min-h-screen">
            <Header />

            {/* Hero Section */}
            <section className="pt-24 md:pt-32 pb-12 md:pb-16 bg-gradient-to-b from-[var(--warm-100)] to-[var(--warm-50)]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                    >
                        <h1 className="font-serif text-4xl md:text-5xl text-[var(--primary-700)] mb-6">
                            Find Your Safe Space
                        </h1>
                        <p className="text-xl text-[var(--neutral-600)] mb-8 max-w-2xl mx-auto">
                            Connect with licensed therapists who understand your journey.
                            Start with a free consultation today.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Filters */}
            <section className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[var(--border)] py-4">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Filter className="w-5 h-5 text-[var(--neutral-400)]" />
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="input py-2 pl-3 pr-8 text-sm w-full md:w-64"
                            >
                                {specializations.map((spec) => (
                                    <option key={spec} value={spec}>
                                        {spec}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={showOnlineOnly}
                                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--border)] text-[var(--secondary-500)] focus:ring-[var(--secondary-500)]"
                            />
                            <span className="text-sm text-[var(--neutral-600)]">
                                Show online therapists only
                            </span>
                        </label>
                    </div>
                </div>
            </section>

            {/* Therapists Grid */}
            <section className="py-12 md:py-20 bg-[var(--warm-50)]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                                    <div className="w-24 h-24 mx-auto mb-4 bg-[var(--neutral-200)] rounded-full" />
                                    <div className="h-6 bg-[var(--neutral-200)] rounded w-3/4 mx-auto mb-2" />
                                    <div className="h-4 bg-[var(--neutral-200)] rounded w-1/2 mx-auto mb-4" />
                                    <div className="h-16 bg-[var(--neutral-200)] rounded mb-4" />
                                    <div className="h-10 bg-[var(--neutral-200)] rounded" />
                                </div>
                            ))}
                        </div>
                    ) : visibleTherapists.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-[var(--neutral-500)] text-lg">
                                No therapists found matching your criteria.
                            </p>
                            <button
                                onClick={() => {
                                    setFilter('All Specializations');
                                    setShowOnlineOnly(false);
                                }}
                                className="mt-4 text-[var(--secondary-600)] hover:text-[var(--secondary-700)] font-medium"
                            >
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        <motion.div
                            key={`${filter}-${showOnlineOnly}`}
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {visibleTherapists.map((therapist) => (
                                <motion.div
                                    key={therapist.id}
                                    variants={fadeInUp}
                                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-[var(--border)] flex flex-col items-center text-center h-full"
                                >
                                    {/* Avatar */}
                                    <div className="relative w-24 h-24 mb-4">
                                        <div className="w-full h-full bg-[var(--primary-100)] rounded-full flex items-center justify-center overflow-hidden">
                                            {therapist.photoUrl ? (
                                                <img src={therapist.photoUrl} alt={therapist.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-2xl font-serif text-[var(--primary-600)]">
                                                    {(therapist.name || 'T').split(' ').map(n => n[0]).join('')}
                                                </span>
                                            )}
                                        </div>
                                        {/* Online Status Dot */}
                                        <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white ${therapist.isOnline ? 'bg-green-500' : 'bg-gray-300'
                                            }`} />
                                    </div>

                                    {/* Name & Specialization */}
                                    <h3 className="font-serif text-xl text-[var(--primary-800)] mb-1">
                                        {therapist.name}
                                    </h3>
                                    <p className="text-sm text-[var(--primary-600)] font-medium mb-1">
                                        {therapist.specialization}
                                    </p>

                                    {/* Rating */}
                                    {therapist.rating && therapist.rating > 0 ? (
                                        <div className="flex items-center justify-center gap-1 mb-3">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            <span className="font-medium text-[var(--neutral-900)]">
                                                {therapist.rating.toFixed(1)}
                                            </span>
                                            <span className="text-xs text-[var(--neutral-500)]">
                                                ({therapist.reviewCount} reviews)
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="h-7 mb-3"></div>
                                    )}

                                    {/* Status Text */}
                                    <p className={`text-xs font-medium mb-4 ${therapist.isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                                        {therapist.isOnline ? 'Available Now' : 'Currently Offline'}
                                    </p>

                                    {/* Bio Snippet */}
                                    <p className="text-sm text-[var(--neutral-600)] mb-4 line-clamp-2 px-2">
                                        {therapist.bio || "Welcome to my practice."}
                                    </p>

                                    {/* Languages */}
                                    {therapist.languages && (
                                        <div className="flex flex-wrap justify-center gap-2 mb-6 mt-auto">
                                            {therapist.languages.slice(0, 3).map((lang) => (
                                                <span
                                                    key={lang}
                                                    className="text-xs px-3 py-1 bg-[var(--warm-100)] text-[var(--neutral-700)] rounded-full border border-[var(--warm-200)]"
                                                >
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Footer Section */}
                                    <div className="w-full pt-4 border-t border-[var(--border)] mt-auto">
                                        <div className="flex items-center justify-between mb-4 text-sm">
                                            <span className="text-[var(--neutral-500)] font-medium">
                                                From <span className="text-[var(--neutral-900)]">₹{therapist.hourlyRate}</span>/session
                                            </span>
                                            <Link
                                                href={`/profile?id=${therapist.id}`}
                                                className="text-[var(--primary-700)] hover:text-[var(--primary-800)] font-medium inline-flex items-center gap-1 hover:underline"
                                            >
                                                View Profile <ArrowRight className="w-3 h-3" />
                                            </Link>
                                        </div>

                                        <Link
                                            href={`/book?therapistId=${therapist.id}`}
                                            className="block w-full py-3 bg-[#4A5D4F] text-white text-center rounded-lg font-medium hover:bg-[#3A4D39] transition-colors shadow-sm"
                                        >
                                            Book Appointment
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
