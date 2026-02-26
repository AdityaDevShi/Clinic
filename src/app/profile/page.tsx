'use client';

// Dynamic import with no SSR to support useSearchParams in static export
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';


import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Therapist, Feedback } from '@/types';

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

// Extracted testimonial component for local state management (read more)
function TestimonialCard({ item }: { item: { content?: string, comment?: string, rating: number, author?: string, isSystem?: boolean, date?: string } }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const text = item.content || item.comment || "";
    const isLongText = text.length > 200; // Increased to 200 to better match screenshot

    return (
        <div className={`snap-center shrink-0 w-[90%] md:w-[60%] lg:w-[45%] p-8 rounded-3xl shadow-sm border border-[var(--neutral-200)] relative flex flex-col transition-all duration-300 ${item.isSystem ? 'bg-[var(--warm-50)]' : 'bg-white'}`}>
            {!item.isSystem && <Quote className="absolute top-6 right-6 w-8 h-8 text-[var(--primary-100)] opacity-50" />}

            <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, stars) => (
                    <Star key={stars} className={`w-5 h-5 ${stars < item.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                ))}
            </div>

            <div className="flex-1 mb-6 relative">
                <p className={`text-[var(--neutral-600)] leading-relaxed italic ${!isExpanded && isLongText ? 'line-clamp-4' : ''}`}>
                    "{text}"
                </p>
                {!isExpanded && isLongText && (
                    <div className="absolute -bottom-2 right-0 left-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none md:hidden"></div>
                )}
            </div>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--neutral-100)]">
                <div>
                    <div className="text-sm font-bold text-[var(--primary-700)]">
                        {item.isSystem ? '- Verified Patient' : `- ${item.author}`}
                    </div>
                    {item.date && (
                        <div className="text-xs text-[var(--neutral-400)] mt-1">{item.date}</div>
                    )}
                </div>

                {isLongText && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-sm font-semibold text-[var(--primary-600)] hover:text-[var(--primary-800)] transition-colors hover:underline"
                    >
                        {isExpanded ? 'See less' : 'See more...'}
                    </button>
                )}
            </div>
        </div>
    );
}

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
                    ...data
                } as Therapist);
            } else {
                setTherapist(null);
            }
            setLoading(false);
        }, (err) => {
            console.error("Error fetching therapist:", err);
            setTherapist(null);
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

    // Calculate combined rating from system reviews AND custom testimonials
    const allRatings: number[] = [];
    reviews.forEach(r => { if (r.rating) allRatings.push(r.rating); });
    therapist?.testimonials?.forEach(t => { if (t.rating) allRatings.push(t.rating); });

    let displayRating = 0;
    let displayCount = 0;

    if (therapist?.rating && therapist?.reviewCount) {
        // Prefer the exact backend calculated values if they exist natively and are non-zero
        displayRating = therapist.rating;
        displayCount = therapist.reviewCount;

        // However, if the backend reviewCount is 0 but we have custom testimonials, 
        // fallback to the custom testimonials.
        if (displayCount === 0 && allRatings.length > 0) {
            displayCount = allRatings.length;
            displayRating = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
        }
    } else {
        // Fallback to manual slice if the backend rating is missing
        displayCount = allRatings.length;
        displayRating = displayCount > 0 ? (allRatings.reduce((a, b) => a + b, 0) / displayCount) : 0;
    }

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

                <div className="pt-32 pb-20 text-center">
                    <h1 className="font-serif text-2xl text-[var(--primary-700)] mb-4">
                        Therapist Not Found
                    </h1>
                    <Link href="/therapists" className="text-[var(--secondary-600)]">
                        ← Back to Therapists
                    </Link>
                </div>

            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAF8]">


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
                                        {displayRating.toFixed(1)}
                                    </span>
                                    <span className="text-sm">
                                        ({displayCount} reviews)
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
                <div className="flex flex-col lg:flex-row gap-12 items-start relative">

                    {/* LEFT COLUMN: Details */}
                    <div className="w-full lg:w-2/3 space-y-12 min-w-0">

                        {/* 1. About Section (First as requested) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            id="about-section"
                            className="bg-white p-8 rounded-2xl shadow-sm border border-[var(--neutral-100)]"
                        >
                            <h2 className="font-serif text-2xl text-[var(--primary-800)] mb-4">About {therapist.name.split(' ')[0]}</h2>
                            <div
                                className="prose prose-stone max-w-none text-[var(--neutral-600)] leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: (therapist.about || therapist.bio || '').replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ') }}
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

                        {/* Media Mentions / News Articles */}
                        {therapist.mediaMentions && therapist.mediaMentions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="bg-white p-8 rounded-2xl shadow-sm border border-[var(--neutral-100)]"
                            >
                                <h2 className="font-serif text-2xl text-[var(--primary-800)] mb-6 flex items-center gap-2">
                                    <Globe className="w-6 h-6 text-[var(--secondary-500)]" />
                                    In the Media
                                </h2>
                                <div className="space-y-4">
                                    {therapist.mediaMentions.map((mention) => (
                                        <a
                                            key={mention.id}
                                            href={mention.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block p-4 rounded-xl border border-[var(--neutral-200)] hover:border-[var(--primary-300)] hover:bg-[var(--neutral-50)] transition-all group"
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <h3 className="font-medium text-[var(--neutral-800)] group-hover:text-[var(--primary-700)] transition-colors line-clamp-2 mb-1">
                                                        {mention.title}
                                                    </h3>
                                                    <div className="flex items-center text-sm text-[var(--neutral-500)] gap-2">
                                                        <span className="font-medium">{mention.publisher}</span>
                                                        {mention.date && (
                                                            <>
                                                                <span className="w-1 h-1 rounded-full bg-[var(--neutral-300)]"></span>
                                                                <span>{mention.date}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="p-2 rounded-full bg-[var(--primary-50)] text-[var(--primary-600)] shrink-0">
                                                    <ArrowLeft className="w-4 h-4 rotate-[135deg]" />
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </motion.div>
                        )}

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

                            <div className="relative">
                                <div
                                    className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 pt-4 custom-scrollbar"
                                >
                                    {/* Custom Testimonials */}
                                    {therapist.testimonials?.map((t, i) => (
                                        <TestimonialCard
                                            key={`custom-${i}`}
                                            item={{ ...t, rating: t.rating || 5 }}
                                        />
                                    ))}

                                    {/* System Reviews */}
                                    {reviews.map((review) => (
                                        <TestimonialCard
                                            key={`review-${review.id}`}
                                            item={{
                                                content: review.comment,
                                                rating: review.rating,
                                                isSystem: true,
                                                date: new Date(review.createdAt).toLocaleDateString()
                                            }}
                                        />
                                    ))}

                                    {/* Empty State Fallback */}
                                    {(!therapist.testimonials?.length && !reviews.length) && (
                                        <div className="w-full text-center py-12 text-[var(--neutral-400)] italic border border-dashed border-[var(--neutral-200)] rounded-3xl">
                                            No testimonials available yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                    </div>

                    {/* RIGHT COLUMN: Sticky Booking Card */}
                    <div className="w-full lg:w-1/3 min-w-0">
                        <div className="lg:sticky lg:top-24 space-y-6">
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
                                                <p className="text-sm">{therapist.sessionDuration || '50-60 Minutes'}</p>
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
