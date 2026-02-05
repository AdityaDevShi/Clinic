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
                const fetchedTherapists: Therapist[] = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    lastOnline: doc.data().lastOnline?.toDate() || new Date(),
                })) as Therapist[];

                // Sort client-side to avoid index issues with 'where' clause
                fetchedTherapists.sort((a, b) => a.name.localeCompare(b.name));

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
                                    className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    {/* Avatar */}
                                    <div className="relative w-24 h-24 mx-auto mb-4">
                                        <div className="w-full h-full bg-[var(--primary-100)] rounded-full flex items-center justify-center">
                                            <span className="text-2xl font-serif text-[var(--primary-600)]">
                                                {therapist.name.split(' ').map(n => n[0]).join('')}
                                            </span>
                                        </div>
                                        {/* Online Status */}
                                        <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white ${therapist.isOnline ? 'bg-green-500' : 'bg-[var(--neutral-300)]'
                                            }`} />
                                    </div>

                                    {/* Info */}
                                    <div className="text-center mb-4">
                                        <h3 className="font-serif text-xl text-[var(--primary-700)] mb-1">
                                            {therapist.name}
                                        </h3>
                                        <p className="text-sm text-[var(--secondary-600)] font-medium mb-2">
                                            {therapist.specialization}
                                        </p>
                                        <div className="flex items-center justify-center gap-1 text-sm text-[var(--neutral-500)]">
                                            <span className={therapist.isOnline ? 'text-green-600' : ''}>
                                                {therapist.isOnline ? 'Available Now' : 'Currently Offline'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    <p className="text-sm text-[var(--neutral-600)] text-center mb-4 line-clamp-3">
                                        {therapist.bio}
                                    </p>

                                    {/* Languages */}
                                    {therapist.languages && (
                                        <div className="flex flex-wrap justify-center gap-2 mb-4">
                                            {therapist.languages.map((lang) => (
                                                <span
                                                    key={lang}
                                                    className="text-xs px-2 py-1 bg-[var(--warm-100)] text-[var(--neutral-600)] rounded-full"
                                                >
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Price & CTA */}
                                    <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                                        <div className="text-sm">
                                            <span className="text-[var(--neutral-500)]">From </span>
                                            <span className="font-semibold text-[var(--primary-700)]">
                                                ₹{therapist.hourlyRate}
                                            </span>
                                            <span className="text-[var(--neutral-500)]">/session</span>
                                        </div>
                                        <Link
                                            href={`/therapists/${therapist.id}`}
                                            className="inline-flex items-center text-sm text-[var(--secondary-600)] hover:text-[var(--secondary-700)] font-medium group"
                                        >
                                            View Profile
                                            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>

                                    <Link
                                        href={`/therapists/${therapist.id}/book`}
                                        className="mt-4 block w-full py-2 bg-[var(--primary-600)] text-white text-center rounded-lg font-medium hover:bg-[var(--primary-700)] transition-colors shadow-sm"
                                    >
                                        Book Appointment
                                    </Link>
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
