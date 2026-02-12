'use client';

// Dynamic import with no SSR to support useSearchParams in static export
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Therapist, Feedback } from '@/types';
import { demoTherapists } from '@/lib/demoData';

import {
    ArrowLeft,
    Star,
    Clock,
    Globe,
    Award,
    Calendar,
    MessageCircle,
    Loader2,
    Video,
    MapPin,
    CheckCircle2,
    BookOpen,
    Users,
    Heart,
    Quote,
    X
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

function ProfileContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const therapistId = searchParams.get('id');

    const [therapist, setTherapist] = useState<Therapist | null>(null);
    const [reviews, setReviews] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCert, setSelectedCert] = useState<{ url: string; title: string } | null>(null);

    useEffect(() => {
        if (!therapistId) {
            setLoading(false);
            return;
        }

        let unsubscribeTherapist: () => void;

        // Fetch auxiliary data (reviews)
        // We keep reviews fetch separate (non-realtime for now to save reads, or can be realtime if needed)
        async function fetchAuxData() {
            try {
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
            }
        }

        // Live Listener for Therapist
        unsubscribeTherapist = onSnapshot(doc(db, 'therapists', therapistId), (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                setTherapist({
                    id: docSnapshot.id,
                    ...data,
                    lastOnline: data.lastOnline?.toDate() || new Date(),
                } as Therapist);
            } else {
                // Demo fallback
                const demo = demoTherapists[therapistId];
                if (demo) {
                    setTherapist(demo);
                }
            }
            setLoading(false);
        }, (err) => {
            console.error("Error fetching therapist:", err);
            // Fallback on error too
            const demo = demoTherapists[therapistId];
            if (demo) {
                setTherapist(demo);
            }
            setLoading(false);
        });

        fetchAuxData();

        return () => {
            if (unsubscribeTherapist) unsubscribeTherapist();
        };
    }, [therapistId]);

    // Handle Escape key for Lightbox
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedCert(null);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

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

    if (!therapist || !therapistId) {
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
        <div className="min-h-screen bg-[#FAFAF8]">
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

            {/* Hero Section */}
            <section className="bg-[var(--warm-50)] pb-12 rounded-b-[3rem] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary-100)] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-0 left-0 w-64 h-64 bg-[var(--secondary-100)] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="grid md:grid-cols-3 gap-8 items-center">
                        {/* Photo */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="md:col-span-1 flex justify-center md:justify-start"
                        >
                            <div className="relative">
                                <div className="w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-white shadow-lg overflow-hidden relative bg-[var(--primary-100)]">
                                    {therapist.photoUrl ? (
                                        <img
                                            src={therapist.photoUrl}
                                            alt={therapist.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl font-serif text-[var(--primary-600)]">
                                            {therapist.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                    )}
                                </div>
                                {/* Online Badge */}
                                <div className={`absolute bottom-4 right-4 md:bottom-6 md:right-6 px-3 py-1 rounded-full text-xs font-bold text-white shadow-md border-2 border-white ${therapist.isOnline ? 'bg-green-500' : 'bg-gray-400'
                                    }`}>
                                    {therapist.isOnline ? 'ONLINE' : 'OFFLINE'}
                                </div>
                            </div>
                        </motion.div>

                        {/* Basic Info */}
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="md:col-span-2 text-center md:text-left"
                        >
                            <h1 className="font-serif text-4xl md:text-5xl text-[var(--primary-800)] mb-3 leading-tight">
                                {therapist.name}
                            </h1>
                            <p className="text-xl text-[var(--primary-600)] font-medium mb-6">
                                {therapist.specialization}
                            </p>

                            {/* Quick Stats */}
                            <div className="flex flex-wrap justify-center md:justify-start gap-6 mb-8 text-[var(--neutral-600)]">
                                <div className="flex items-center gap-2">
                                    <Award className="w-5 h-5 text-[var(--secondary-500)]" />
                                    <span>{therapist.qualifications?.[0] || 'Certified Therapist'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                    <span className="font-bold text-[var(--neutral-800)]">
                                        {(therapist.rating || avgRating).toFixed(1)}
                                    </span>
                                    <span className="text-sm">
                                        ({therapist.reviewCount || reviews.length} reviews)
                                    </span>
                                </div>
                                {therapist.patientsHelped && (
                                    <div className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-[var(--primary-500)]" />
                                        <span>{therapist.patientsHelped}+ Lives Impacted</span>
                                    </div>
                                )}
                            </div>

                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                <button
                                    onClick={() => document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="px-6 py-3 rounded-full border border-[var(--primary-600)] text-[var(--primary-700)] font-medium hover:bg-[var(--primary-50)] transition-colors"
                                >
                                    Read Full Profile
                                </button>
                                <Link
                                    href={`/book?therapistId=${therapist.id}`}
                                    className="px-8 py-3 rounded-full bg-[var(--primary-600)] text-white font-medium hover:bg-[var(--primary-700)] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    Book Session <ArrowLeft className="w-4 h-4 rotate-180" />
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid lg:grid-cols-3 gap-12">

                    {/* LEFT COLUMN: Details */}
                    <div className="lg:col-span-2 space-y-12">

                        {/* 1. About Section (First as requested) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            id="about-section"
                        >
                            <h2 className="font-serif text-2xl text-[var(--primary-800)] mb-4">About {therapist.name.split(' ')[0]}</h2>
                            <div
                                className="prose prose-stone max-w-none text-[var(--neutral-600)] leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: therapist.about || therapist.bio }}
                            />
                        </motion.div>

                        {/* 2. Research & Publications */}
                        {therapist.research && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -5 }}
                                viewport={{ once: true }}
                                className="bg-[var(--warm-50)] p-8 rounded-2xl border border-[var(--warm-100)] transition-all hover:shadow-md"
                            >
                                <h2 className="font-serif text-xl text-[var(--primary-800)] mb-4 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-[var(--primary-600)]" />
                                    Research & Publications
                                </h2>
                                <div
                                    className="text-[var(--neutral-700)] italic prose prose-stone max-w-none"
                                    dangerouslySetInnerHTML={{ __html: therapist.research }}
                                />
                            </motion.div>
                        )}

                        {/* 3. Recommended For / "I Can Help With" */}
                        {(therapist.recommendedFor?.length || 0) > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="bg-white p-8 rounded-2xl shadow-sm border border-[var(--neutral-100)]"
                            >
                                <h2 className="font-serif text-2xl text-[var(--primary-800)] mb-6 flex items-center gap-3">
                                    <Heart className="w-6 h-6 text-[var(--secondary-500)]" />
                                    I Can Help You With
                                </h2>
                                <div className="flex flex-wrap gap-3">
                                    {therapist.recommendedFor?.map((topic, i) => (
                                        <span key={i} className="px-4 py-2 bg-[var(--primary-50)] text-[var(--primary-700)] rounded-full text-sm font-medium border border-[var(--primary-100)]">
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* 4. Certificates & Qualifications */}
                        <div className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="grid md:grid-cols-2 gap-6"
                            >
                                {/* Qualifications */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--neutral-100)]">
                                    <h3 className="font-serif text-lg text-[var(--primary-700)] mb-4 flex items-center gap-2">
                                        <Award className="w-5 h-5 text-[var(--secondary-500)]" />
                                        Qualifications
                                    </h3>
                                    <ul className="space-y-3">
                                        {therapist.qualifications?.map((qual, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-[var(--neutral-600)]">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>{qual}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Languages */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--neutral-100)]">
                                    <h3 className="font-serif text-lg text-[var(--primary-700)] mb-4 flex items-center gap-2">
                                        <Globe className="w-5 h-5 text-[var(--secondary-500)]" />
                                        Languages Spoken
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {therapist.languages?.map((lang, i) => (
                                            <span key={i} className="px-3 py-1 bg-[var(--neutral-100)] text-[var(--neutral-700)] rounded-lg text-sm">
                                                {lang}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Certificates Gallery (Aesthetic + Lightbox) */}
                            {therapist.certificates && therapist.certificates.length > 0 && (
                                <>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        className="bg-[var(--warm-50)] p-8 rounded-2xl border border-[var(--warm-100)]"
                                    >
                                        <h3 className="font-serif text-xl text-[var(--primary-800)] mb-6 flex items-center gap-2">
                                            <Award className="w-5 h-5 text-[var(--secondary-500)]" />
                                            Certificates & Credentials
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {therapist.certificates.map((cert) => (
                                                <motion.button
                                                    key={cert.id}
                                                    whileHover={{ y: -5 }}
                                                    onClick={() => setSelectedCert(cert)}
                                                    className="group flex flex-col items-center text-left"
                                                >
                                                    {/* Framed Image */}
                                                    <div className="relative w-full aspect-[4/3] bg-white rounded-xl shadow-sm border border-[var(--neutral-200)] p-2 overflow-hidden mb-3 transition-shadow group-hover:shadow-md group-hover:border-[var(--primary-200)]">
                                                        <div className="w-full h-full relative rounded-lg overflow-hidden bg-[var(--neutral-50)]">
                                                            <img
                                                                src={cert.url}
                                                                alt={cert.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            {/* Overlay */}
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                                <div className="bg-white/90 p-2 rounded-full opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all shadow-sm">
                                                                    <BookOpen className="w-4 h-4 text-[var(--primary-700)]" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-medium text-[var(--neutral-700)] group-hover:text-[var(--primary-700)] transition-colors line-clamp-2 text-center">
                                                        {cert.title}
                                                    </span>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </motion.div>

                                    {/* Lightbox Modal */}
                                    <AnimatePresence>
                                        {selectedCert && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                onClick={() => setSelectedCert(null)}
                                                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                                            >
                                                <motion.div
                                                    initial={{ scale: 0.9, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0.9, opacity: 0 }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl p-2 shadow-2xl overflow-hidden"
                                                >
                                                    <button
                                                        onClick={() => setSelectedCert(null)}
                                                        className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                    <img
                                                        src={selectedCert.url}
                                                        alt={selectedCert.title}
                                                        className="max-w-full max-h-[85vh] rounded-xl object-contain"
                                                    />
                                                    <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                                                        <p className="font-medium text-lg text-center">{selectedCert.title}</p>
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </>
                            )}
                        </div>

                        {/* 5. Testimonials (Custom + System) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="font-serif text-2xl text-[var(--primary-800)] mb-6 flex items-center gap-2">
                                <MessageCircle className="w-6 h-6 text-[var(--primary-500)]" />
                                What Clients Say
                            </h2>

                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Custom Testimonials */}
                                {therapist.testimonials?.map((t, i) => (
                                    <div key={`custom-${i}`} className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--neutral-100)] relative">
                                        <Quote className="absolute top-4 right-4 w-8 h-8 text-[var(--primary-100)]" />
                                        <div className="flex items-center gap-1 mb-3">
                                            {[...Array(5)].map((_, stars) => (
                                                <Star key={stars} className={`w-4 h-4 ${stars < t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                            ))}
                                        </div>
                                        <p className="text-[var(--neutral-600)] mb-4 italic">"{t.content}"</p>
                                        <div className="text-sm font-bold text-[var(--primary-700)]">- {t.author}</div>
                                    </div>
                                ))}

                                {/* System Reviews (Fallback or Addition) */}
                                {reviews.slice(0, 3).map((review) => (
                                    <div key={`review-${review.id}`} className="bg-[var(--warm-50)] p-6 rounded-2xl border border-[var(--warm-100)]">
                                        <div className="flex items-center gap-1 mb-3">
                                            {[...Array(5)].map((_, stars) => (
                                                <Star key={stars} className={`w-4 h-4 ${stars < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                            ))}
                                        </div>
                                        {review.comment && <p className="text-[var(--neutral-600)] mb-4">"{review.comment}"</p>}
                                        <div className="text-sm text-[var(--neutral-500)]">Verified Patient • {new Date(review.createdAt).toLocaleDateString()}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                    </div>

                    {/* RIGHT COLUMN: Sticky Booking Card */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-white rounded-2xl shadow-lg border border-[var(--primary-100)] overflow-hidden">
                                <div className="bg-[var(--primary-600)] p-4 text-center text-white">
                                    <p className="text-sm opacity-90">Session Fee</p>
                                    <p className="text-3xl font-serif">₹{therapist.hourlyRate}</p>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-[var(--neutral-600)]">
                                            <div className="w-10 h-10 rounded-full bg-[var(--warm-50)] flex items-center justify-center text-[var(--primary-600)]">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--primary-800)]">Duration</p>
                                                <p className="text-sm">50-60 Minutes</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-[var(--neutral-600)]">
                                            <div className="w-10 h-10 rounded-full bg-[var(--warm-50)] flex items-center justify-center text-[var(--primary-600)]">
                                                <Video className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--primary-800)]">Modes</p>
                                                <p className="text-sm">{therapist.therapyModes?.join(', ') || 'Video, Audio'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-[var(--neutral-600)]">
                                            <div className="w-10 h-10 rounded-full bg-[var(--warm-50)] flex items-center justify-center text-[var(--primary-600)]">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--primary-800)]">Availability</p>
                                                <p className="text-sm">{therapist.availabilitySummary || 'Mon - Sat'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/book?therapistId=${therapist.id}`}
                                        className="block w-full py-4 text-center bg-[var(--secondary-500)] text-white rounded-xl font-bold hover:bg-[var(--secondary-600)] shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1"
                                    >
                                        Book Appointment Now
                                    </Link>

                                    <p className="text-xs text-center text-[var(--neutral-400)]">
                                        Secure payment • Instant confirmation
                                    </p>
                                </div>
                            </div>

                            {/* Referral Links / Socials */}
                            {therapist.referralLinks && therapist.referralLinks.length > 0 && (
                                <div className="bg-white p-6 rounded-2xl border border-[var(--neutral-200)]">
                                    <h3 className="font-serif text-lg text-[var(--primary-800)] mb-4">Connect & Learn</h3>
                                    <div className="space-y-3">
                                        {therapist.referralLinks.map((link, i) => (
                                            <a
                                                key={i}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block px-4 py-3 rounded-xl bg-[var(--neutral-50)] hover:bg-[var(--primary-50)] text-[var(--primary-700)] font-medium transition-colors flex items-center justify-between"
                                            >
                                                {link.name}
                                                <ArrowLeft className="w-4 h-4 rotate-[135deg]" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </section>

            <Footer />
        </div>
    );
}

export default function TherapistProfilePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[var(--warm-50)]">
                <Loader2 className="w-8 h-8 text-[var(--primary-500)] animate-spin" />
            </div>
        }>
            <ProfileContent />
        </Suspense>
    );
}
