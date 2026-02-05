'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking, Feedback } from '@/types';
import { BookingService } from '@/services/bookingService';
import { format } from 'date-fns';
import {
    ArrowLeft,
    Star,
    Loader2,
    Send,
    CheckCircle
} from 'lucide-react';

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function FeedbackPage() {
    const router = useRouter();
    const params = useParams();
    const bookingId = params.bookingId as string;
    const { user, loading: authLoading } = useAuth();

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isPublic, setIsPublic] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        async function fetchBooking() {
            try {
                const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
                if (bookingDoc.exists()) {
                    setBooking({
                        id: bookingDoc.id,
                        ...bookingDoc.data(),
                        sessionTime: bookingDoc.data().sessionTime?.toDate() || new Date(),
                        createdAt: bookingDoc.data().createdAt?.toDate() || new Date(),
                    } as Booking);
                } else {
                    // Demo booking
                    setBooking({
                        id: bookingId,
                        clientId: 'demo',
                        clientName: 'Demo User',
                        clientEmail: 'demo@example.com',
                        therapistId: '1',
                        therapistName: 'Dr. Shiwani Kohli',
                        sessionTime: new Date(Date.now() - 86400000 * 7),
                        duration: 60,
                        status: 'completed',
                        paymentStatus: 'paid',
                        amount: 2500,
                        createdAt: new Date(),
                    });
                }
            } catch {
                // Demo booking
                setBooking({
                    id: bookingId,
                    clientId: 'demo',
                    clientName: 'Demo User',
                    clientEmail: 'demo@example.com',
                    therapistId: '1',
                    therapistName: 'Dr. Shiwani Kohli',
                    sessionTime: new Date(Date.now() - 86400000 * 7),
                    duration: 60,
                    status: 'completed',
                    paymentStatus: 'paid',
                    amount: 2500,
                    createdAt: new Date(),
                });
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchBooking();
        }
    }, [bookingId, user, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!booking || !user || rating === 0) return;

        setSubmitting(true);

        try {
            await BookingService.submitFeedback({
                bookingId: booking.id,
                clientId: user.id,
                clientName: isPublic ? 'Anonymous' : user.name,
                therapistId: booking.therapistId,
                rating,
                comment,
                isPublic,
            });
            setSubmitted(true);
        } catch (error) {
            console.log('Error submitting feedback:', error);
            // Still show success in demo mode if it was just a permissions error, 
            // but normally we should show error. 
            // For now, let's keep the user experience smooth.
            alert("Failed to submit feedback. Taking you back.");
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--warm-50)]">
                <Loader2 className="w-8 h-8 text-[var(--primary-500)] animate-spin" />
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center py-24 px-4 bg-gradient-to-b from-[var(--warm-100)] to-[var(--warm-50)]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md text-center"
                    >
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring' }}
                                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                            >
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </motion.div>

                            <h1 className="font-serif text-2xl text-[var(--primary-700)] mb-2">
                                Thank You!
                            </h1>
                            <p className="text-[var(--neutral-500)] mb-6">
                                Your feedback has been submitted successfully.
                            </p>

                            <Link
                                href="/client/bookings"
                                className="btn btn-primary py-3 px-6"
                            >
                                Return to Bookings
                            </Link>
                        </div>
                    </motion.div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 py-24 px-4 bg-gradient-to-b from-[var(--warm-100)] to-[var(--warm-50)]">
                <div className="max-w-xl mx-auto">
                    <Link
                        href="/client/bookings"
                        className="inline-flex items-center text-sm text-[var(--neutral-500)] hover:text-[var(--primary-600)] transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Bookings
                    </Link>

                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                    >
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div className="bg-[var(--primary-50)] p-6">
                                <h1 className="font-serif text-2xl text-[var(--primary-700)] mb-2">
                                    Share Your Feedback
                                </h1>
                                <p className="text-[var(--neutral-600)]">
                                    Session with {booking?.therapistName} on{' '}
                                    {booking && format(booking.sessionTime, 'MMM d, yyyy')}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Star Rating */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--neutral-700)] mb-3">
                                        How would you rate your session?
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="p-1 transition-transform hover:scale-110"
                                            >
                                                <Star
                                                    className={`w-10 h-10 transition-colors ${star <= (hoverRating || rating)
                                                        ? 'text-yellow-400 fill-yellow-400'
                                                        : 'text-[var(--neutral-300)]'
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    {rating > 0 && (
                                        <p className="text-sm text-[var(--neutral-500)] mt-2">
                                            {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                                        </p>
                                    )}
                                </div>

                                {/* Comment */}
                                <div>
                                    <label htmlFor="comment" className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                                        Tell us about your experience (optional)
                                    </label>
                                    <textarea
                                        id="comment"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="input min-h-[120px] resize-none"
                                        placeholder="Your feedback helps us improve our services..."
                                    />
                                </div>

                                {/* Public/Private */}
                                <label className="flex items-start cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isPublic}
                                        onChange={(e) => setIsPublic(e.target.checked)}
                                        className="w-4 h-4 mt-1 rounded border-[var(--border)] text-[var(--secondary-500)] focus:ring-[var(--secondary-500)]"
                                    />
                                    <span className="ml-3 text-sm text-[var(--neutral-600)]">
                                        Share my feedback publicly (displayed anonymously on the therapist&apos;s profile)
                                    </span>
                                </label>

                                <button
                                    type="submit"
                                    disabled={rating === 0 || submitting}
                                    className="w-full btn btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <span className="flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Submitting...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center">
                                            <Send className="w-5 h-5 mr-2" />
                                            Submit Feedback
                                        </span>
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
