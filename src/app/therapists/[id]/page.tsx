'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import TimeSlotPicker from '@/components/scheduling/TimeSlotPicker';
import { getDefaultAvailability, formatTimeSlot, getDayName } from '@/lib/scheduling/availability';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Therapist, Availability, BusySlot, Booking, TimeSlot, Feedback } from '@/types';
import {
    ArrowLeft,
    Star,
    Clock,
    Globe,
    Award,
    Calendar,
    MessageCircle,
    Loader2,
    Video
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

// Demo therapist data
const demoTherapists: Record<string, Therapist> = {
    '1': {
        id: '1',
        name: 'Dr. Shiwani Kohli',
        email: 'shiwani@arambhmentalhealth.com',
        specialization: 'Clinical Psychology',
        bio: 'Clinical Psychologist with over 10 years of experience in treating anxiety disorders, depression, trauma, and stress-related conditions. Dr. Kohli uses an integrative approach combining Cognitive Behavioral Therapy (CBT), mindfulness techniques, and person-centered therapy to help clients achieve lasting positive change.\n\nHer warm and empathetic approach creates a safe space for clients to explore their challenges and develop effective coping strategies. She is passionate about mental health awareness and believes in empowering individuals to take charge of their emotional well-being.',
        photoUrl: undefined,
        isOnline: true,
        isEnabled: true,
        hourlyRate: 2500,
        lastOnline: new Date(),
        qualifications: ['M.Phil Clinical Psychology', 'CBT Certified', 'Trauma-Informed Care'],
        languages: ['English', 'Hindi'],
    },
    '2': {
        id: '2',
        name: 'Dr. Priya Sharma',
        email: 'priya@arambhmentalhealth.com',
        specialization: 'Child & Adolescent Psychology',
        bio: 'Specialized in working with children and teenagers facing emotional, behavioral, and developmental challenges. Dr. Sharma uses play therapy, art therapy, and CBT approaches tailored for young minds.\n\nWith a gentle and patient approach, she helps young clients express themselves and develop healthy coping mechanisms. She works closely with parents to create supportive home environments.',
        photoUrl: undefined,
        isOnline: true,
        isEnabled: true,
        hourlyRate: 2000,
        lastOnline: new Date(),
        qualifications: ['Ph.D. Child Psychology', 'Play Therapy Certified', 'Child Development Specialist'],
        languages: ['English', 'Hindi', 'Punjabi'],
    },
    '3': {
        id: '3',
        name: 'Dr. Rahul Verma',
        email: 'rahul@arambhmentalhealth.com',
        specialization: 'Couples & Family Therapy',
        bio: 'Expert in relationship counseling and family dynamics with over 8 years of experience. Dr. Verma helps couples improve communication, resolve conflicts, and strengthen their emotional bond.\n\nHe specializes in premarital counseling, marriage therapy, and family mediation. His approach is collaborative and solution-focused, helping families navigate transitions and challenges together.',
        photoUrl: undefined,
        isOnline: false,
        isEnabled: true,
        hourlyRate: 3500,
        lastOnline: new Date(Date.now() - 3600000),
        qualifications: ['M.A. Clinical Psychology', 'Certified Couples Therapist', 'Family Systems Training'],
        languages: ['English', 'Hindi'],
    },
};

// Demo reviews
const demoReviews: Feedback[] = [
    {
        id: 'r1',
        bookingId: 'b1',
        clientId: 'c1',
        clientName: 'Anonymous',
        therapistId: '1',
        rating: 5,
        comment: 'Dr. Kohli is incredibly understanding and professional. She helped me navigate through a very difficult time with patience and care.',
        createdAt: new Date(Date.now() - 86400000 * 30),
        isPublic: true,
    },
    {
        id: 'r2',
        bookingId: 'b2',
        clientId: 'c2',
        clientName: 'Anonymous',
        therapistId: '1',
        rating: 5,
        comment: 'The sessions have been transformative. I feel more equipped to handle my anxiety now.',
        createdAt: new Date(Date.now() - 86400000 * 15),
        isPublic: true,
    },
];

export default function TherapistProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const therapistId = params.id as string;

    const [therapist, setTherapist] = useState<Therapist | null>(null);
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
    const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
    const [reviews, setReviews] = useState<Feedback[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeTherapist: () => void;

        // Fetch auxiliary data (availability, bookings, reviews)
        async function fetchAuxData() {
            try {
                // Fetch availability
                const availabilityQuery = query(
                    collection(db, 'availability'),
                    where('therapistId', '==', therapistId)
                );
                const availabilityDocs = await getDocs(availabilityQuery);

                if (availabilityDocs.empty) {
                    setAvailability(getDefaultAvailability(therapistId));
                } else {
                    setAvailability(availabilityDocs.docs.map(d => ({ id: d.id, ...d.data() })) as Availability[]);
                }

                // Fetch bookings for this therapist
                const bookingsQuery = query(
                    collection(db, 'bookings'),
                    where('therapistId', '==', therapistId)
                );
                const bookingsDocs = await getDocs(bookingsQuery);
                setExistingBookings(bookingsDocs.docs.map(d => ({
                    id: d.id,
                    ...d.data(),
                    sessionTime: d.data().sessionTime?.toDate() || new Date(),
                    createdAt: d.data().createdAt?.toDate() || new Date(),
                })) as Booking[]);

                // Fetch reviews
                const reviewsQuery = query(
                    collection(db, 'feedback'),
                    where('therapistId', '==', therapistId),
                    where('isPublic', '==', true)
                );
                const reviewsDocs = await getDocs(reviewsQuery);
                setReviews(reviewsDocs.docs.map(d => ({
                    id: d.id,
                    ...d.data(),
                    createdAt: d.data().createdAt?.toDate() || new Date(),
                })) as Feedback[]);

            } catch (error) {
                console.error("Error fetching aux data:", error);
                // Fallback for reviews/availability if needed
                setAvailability(getDefaultAvailability(therapistId));
            }
        }

        // 1. Set up real-time listener for Therapist Document
        // This ensures rating/reviewCount updates instantly
        unsubscribeTherapist = onSnapshot(doc(db, 'therapists', therapistId), (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                console.log("Real-time Therapist Data Update:", data.rating, data.reviewCount);
                setTherapist({
                    id: docSnapshot.id,
                    ...data,
                    lastOnline: data.lastOnline?.toDate() || new Date(),
                } as Therapist);
                setLoading(false);
            } else {
                // Demo data fallback
                const demo = demoTherapists[therapistId];
                if (demo) {
                    console.log("Using Demo Data fallback");
                    setTherapist(demo);
                    setReviews(demoReviews.filter(r => r.therapistId === therapistId)); // Load demo reviews too
                }
                setLoading(false);
            }
        }, (error) => {
            console.error("Error fetching therapist:", error);
            const demo = demoTherapists[therapistId];
            if (demo) {
                setTherapist(demo);
            }
            setLoading(false);
        });

        // 2. Fetch other data
        fetchAuxData();

        return () => {
            if (unsubscribeTherapist) unsubscribeTherapist();
        };
    }, [therapistId]);

    const handleBookNow = () => {
        if (!user) {
            // Redirect to login with return URL
            router.push(`/login?redirect=/therapists/${therapistId}`);
            return;
        }

        if (selectedSlot) {
            // Store selected slot in session storage and go to booking confirmation
            sessionStorage.setItem('pendingBooking', JSON.stringify({
                therapistId,
                therapistName: therapist?.name,
                slot: {
                    time: selectedSlot.time,
                    date: selectedSlot.date.toISOString(),
                },
                price: therapist?.hourlyRate,
            }));
            router.push('/client/book/confirm');
        }
    };

    // Calculate average rating
    const avgRating = reviews.length > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        : 0;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--warm-50)]">
                <Loader2 className="w-8 h-8 text-[var(--primary-500)] animate-spin" />
            </div>
        );
    }

    if (!therapist) {
        return (
            <div className="min-h-screen">
                <Header />
                <div className="pt-32 pb-20 text-center">
                    <h1 className="font-serif text-2xl text-[var(--primary-700)] mb-4">
                        Therapist Not Found
                    </h1>
                    <Link href="/therapists" className="text-[var(--secondary-600)]">
                        ← Back to Therapists
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Header />

            {/* Breadcrumb */}
            <div className="pt-24 pb-4 bg-[var(--warm-50)]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link
                        href="/therapists"
                        className="inline-flex items-center text-sm text-[var(--neutral-500)] hover:text-[var(--primary-600)] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Therapists
                    </Link>
                </div>
            </div>

            {/* Profile Content */}
            <section className="pb-16 md:pb-20 bg-[var(--warm-50)]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Left Column - Profile Info */}
                        <div className="lg:col-span-2">
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                variants={staggerContainer}
                                className="bg-white rounded-2xl p-6 md:p-8 shadow-sm mb-8"
                            >
                                {/* Header */}
                                <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-start gap-6 mb-6">
                                    <div className="relative">
                                        <div className="w-24 h-24 bg-[var(--primary-100)] rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-3xl font-serif text-[var(--primary-600)]">
                                                {therapist.name.split(' ').map(n => n[0]).join('')}
                                            </span>
                                        </div>
                                        <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white ${therapist.isOnline ? 'bg-green-500' : 'bg-[var(--neutral-300)]'
                                            }`} />
                                    </div>

                                    <div className="flex-1">
                                        <h1 className="font-serif text-2xl md:text-3xl text-[var(--primary-700)] mb-1">
                                            {therapist.name}
                                        </h1>
                                        <p className="text-[var(--secondary-600)] font-medium mb-3">
                                            {therapist.specialization}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--neutral-500)]">
                                            {(therapist.reviewCount || reviews.length) > 0 && (
                                                <div className="flex items-center">
                                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                                                    <span className="font-medium text-[var(--neutral-700)]">
                                                        {(therapist.rating || avgRating).toFixed(1)}
                                                    </span>
                                                    <span className="ml-1">
                                                        ({therapist.reviewCount || reviews.length} reviews)
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center">
                                                <Clock className="w-4 h-4 mr-1" />
                                                <span className={therapist.isOnline ? 'text-green-600' : ''}>
                                                    {therapist.isOnline ? 'Available Now' : 'Currently Offline'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Bio */}
                                <motion.div variants={fadeInUp} className="mb-6">
                                    <h2 className="font-serif text-lg text-[var(--primary-700)] mb-3">About</h2>
                                    <div className="text-[var(--neutral-600)] whitespace-pre-line leading-relaxed">
                                        {therapist.bio}
                                    </div>
                                </motion.div>

                                {/* Qualifications */}
                                {therapist.qualifications && (
                                    <motion.div variants={fadeInUp} className="mb-6">
                                        <h2 className="font-serif text-lg text-[var(--primary-700)] mb-3 flex items-center">
                                            <Award className="w-5 h-5 mr-2 text-[var(--primary-500)]" />
                                            Qualifications
                                        </h2>
                                        <div className="flex flex-wrap gap-2">
                                            {therapist.qualifications.map((qual, i) => (
                                                <span
                                                    key={i}
                                                    className="px-3 py-1 bg-[var(--primary-50)] text-[var(--primary-700)] rounded-full text-sm"
                                                >
                                                    {qual}
                                                </span>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Languages */}
                                {therapist.languages && (
                                    <motion.div variants={fadeInUp}>
                                        <h2 className="font-serif text-lg text-[var(--primary-700)] mb-3 flex items-center">
                                            <Globe className="w-5 h-5 mr-2 text-[var(--primary-500)]" />
                                            Languages
                                        </h2>
                                        <div className="flex flex-wrap gap-2">
                                            {therapist.languages.map((lang, i) => (
                                                <span
                                                    key={i}
                                                    className="px-3 py-1 bg-[var(--warm-100)] text-[var(--neutral-700)] rounded-full text-sm"
                                                >
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>

                            {/* Reviews */}
                            {reviews.length > 0 && (
                                <motion.div
                                    initial="hidden"
                                    animate="visible"
                                    variants={fadeInUp}
                                    className="bg-white rounded-2xl p-6 md:p-8 shadow-sm"
                                >
                                    <h2 className="font-serif text-lg text-[var(--primary-700)] mb-6 flex items-center">
                                        <MessageCircle className="w-5 h-5 mr-2 text-[var(--primary-500)]" />
                                        Client Reviews
                                    </h2>

                                    <div className="space-y-4">
                                        {reviews.slice(0, 5).map((review) => (
                                            <div key={review.id} className="p-4 bg-[var(--warm-50)] rounded-xl">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-[var(--neutral-300)]'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-[var(--neutral-500)]">
                                                        {new Date(review.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {review.comment && (
                                                    <p className="text-sm text-[var(--neutral-600)]">
                                                        &ldquo;{review.comment}&rdquo;
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Right Column - Booking */}
                        <div className="lg:col-span-1">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl p-6 shadow-sm sticky top-24"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <span className="text-sm text-[var(--neutral-500)]">Session Fee</span>
                                        <div className="text-2xl font-bold text-[var(--primary-700)]">
                                            ₹{therapist.hourlyRate}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm text-[var(--neutral-500)]">Duration</span>
                                        <div className="text-lg font-medium text-[var(--neutral-700)]">
                                            60 mins
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-[var(--border)] pt-6 mb-6">
                                    <div className="flex items-center gap-3 text-sm text-[var(--neutral-600)] mb-3">
                                        <div className="w-8 h-8 rounded-full bg-[var(--neutral-50)] flex items-center justify-center">
                                            <Video className="w-4 h-4 text-[var(--primary-500)]" />
                                        </div>
                                        <span>Video Consultation</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-[var(--neutral-600)]">
                                        <div className="w-8 h-8 rounded-full bg-[var(--neutral-50)] flex items-center justify-center">
                                            <Calendar className="w-4 h-4 text-[var(--primary-500)]" />
                                        </div>
                                        <span>Available {therapist.isOnline ? 'Now' : 'by Appointment'}</span>
                                    </div>
                                </div>

                                <Link
                                    href={`/therapists/${therapist.id}/book`}
                                    className="w-full btn btn-primary py-3 block text-center"
                                >
                                    Book Session
                                </Link>

                                {!therapist.isOnline && (
                                    <p className="text-sm text-center text-[var(--neutral-500)] mt-3">
                                        Next available slot: Tomorrow, 10:00 AM
                                    </p>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
