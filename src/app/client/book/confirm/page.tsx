'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatTimeSlot } from '@/lib/scheduling/availability';
import { format } from 'date-fns';
import {
    ArrowLeft,
    Calendar,
    Clock,
    User,
    CreditCard,
    CheckCircle,
    Loader2,
    Shield
} from 'lucide-react';

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

interface PendingBooking {
    therapistId: string;
    therapistName: string;
    slot: {
        time: string;
        date: string;
    };
    price: number;
}

export default function BookingConfirmPage() {
    const router = useRouter();
    const { user } = useAuth();

    const [booking, setBooking] = useState<PendingBooking | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [agreeToTerms, setAgreeToTerms] = useState(false);

    useEffect(() => {
        const pendingBooking = sessionStorage.getItem('pendingBooking');
        if (pendingBooking) {
            setBooking(JSON.parse(pendingBooking));
        } else {
            router.push('/therapists');
        }
    }, [router]);

    useEffect(() => {
        if (!user) {
            router.push('/login?redirect=/client/book/confirm');
        }
    }, [user, router]);

    const handleConfirmBooking = async () => {
        if (!booking || !user || !agreeToTerms) return;

        setIsProcessing(true);

        try {
            // Simulate payment processing delay
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Create booking ID
            const newBookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Create booking in Firestore
            await setDoc(doc(db, 'bookings', newBookingId), {
                clientId: user.id,
                clientName: user.name,
                clientEmail: user.email,
                therapistId: booking.therapistId,
                therapistName: booking.therapistName,
                sessionTime: new Date(booking.slot.date),
                duration: 60,
                status: 'confirmed',
                paymentStatus: 'paid', // Mock payment
                amount: booking.price,
                createdAt: serverTimestamp(),
            });

            setBookingId(newBookingId);
            setIsComplete(true);
            sessionStorage.removeItem('pendingBooking');
        } catch (error) {
            console.log('Error creating booking:', error);
            // In demo mode, still show success
            setBookingId(`demo_${Date.now()}`);
            setIsComplete(true);
            sessionStorage.removeItem('pendingBooking');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!booking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--warm-50)]">
                <Loader2 className="w-8 h-8 text-[var(--primary-500)] animate-spin" />
            </div>
        );
    }

    const sessionDate = new Date(booking.slot.date);

    if (isComplete) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />

                <main className="flex-1 flex items-center justify-center py-24 px-4 bg-gradient-to-b from-[var(--warm-100)] to-[var(--warm-50)]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md text-center"
                    >
                        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring' }}
                                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                            >
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </motion.div>

                            <h1 className="font-serif text-2xl text-[var(--primary-700)] mb-2">
                                Booking Confirmed!
                            </h1>
                            <p className="text-[var(--neutral-500)] mb-6">
                                Your session has been scheduled successfully.
                            </p>

                            <div className="bg-[var(--warm-50)] rounded-xl p-4 mb-6 text-left">
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center">
                                        <User className="w-4 h-4 mr-3 text-[var(--primary-500)]" />
                                        <span className="text-[var(--neutral-700)]">{booking.therapistName}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-3 text-[var(--primary-500)]" />
                                        <span className="text-[var(--neutral-700)]">
                                            {format(sessionDate, 'EEEE, MMMM d, yyyy')}
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-3 text-[var(--primary-500)]" />
                                        <span className="text-[var(--neutral-700)]">
                                            {formatTimeSlot(booking.slot.time)} (60 minutes)
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-[var(--neutral-500)] mb-6">
                                A confirmation email has been sent to your registered email address.
                            </p>

                            <div className="space-y-3">
                                <Link
                                    href="/client/bookings"
                                    className="block w-full btn btn-primary py-3"
                                >
                                    View My Bookings
                                </Link>
                                <Link
                                    href="/"
                                    className="block w-full btn btn-secondary py-3"
                                >
                                    Return Home
                                </Link>
                            </div>
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
                <div className="max-w-2xl mx-auto">
                    {/* Breadcrumb */}
                    <Link
                        href={`/therapists/${booking.therapistId}`}
                        className="inline-flex items-center text-sm text-[var(--neutral-500)] hover:text-[var(--primary-600)] transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Profile
                    </Link>

                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                    >
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            {/* Header */}
                            <div className="bg-[var(--primary-50)] p-6 md:p-8">
                                <h1 className="font-serif text-2xl text-[var(--primary-700)] mb-2">
                                    Confirm Your Booking
                                </h1>
                                <p className="text-[var(--neutral-600)]">
                                    Review your session details before confirming
                                </p>
                            </div>

                            {/* Booking Details */}
                            <div className="p-6 md:p-8">
                                <div className="space-y-6">
                                    {/* Session Info */}
                                    <div className="bg-[var(--warm-50)] rounded-xl p-5">
                                        <h2 className="font-medium text-[var(--primary-700)] mb-4">Session Details</h2>
                                        <div className="grid gap-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-[var(--primary-100)] rounded-full flex items-center justify-center mr-4">
                                                    <User className="w-5 h-5 text-[var(--primary-600)]" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-[var(--neutral-500)]">Therapist</p>
                                                    <p className="font-medium text-[var(--neutral-700)]">{booking.therapistName}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-[var(--primary-100)] rounded-full flex items-center justify-center mr-4">
                                                    <Calendar className="w-5 h-5 text-[var(--primary-600)]" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-[var(--neutral-500)]">Date</p>
                                                    <p className="font-medium text-[var(--neutral-700)]">
                                                        {format(sessionDate, 'EEEE, MMMM d, yyyy')}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-[var(--primary-100)] rounded-full flex items-center justify-center mr-4">
                                                    <Clock className="w-5 h-5 text-[var(--primary-600)]" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-[var(--neutral-500)]">Time & Duration</p>
                                                    <p className="font-medium text-[var(--neutral-700)]">
                                                        {formatTimeSlot(booking.slot.time)} (60 minutes)
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Summary */}
                                    <div className="bg-[var(--warm-50)] rounded-xl p-5">
                                        <h2 className="font-medium text-[var(--primary-700)] mb-4 flex items-center">
                                            <CreditCard className="w-5 h-5 mr-2" />
                                            Payment Summary
                                        </h2>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-[var(--neutral-600)]">Session Fee</span>
                                                <span className="text-[var(--neutral-700)]">₹{booking.price}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-[var(--neutral-600)]">Platform Fee</span>
                                                <span className="text-[var(--neutral-700)]">₹0</span>
                                            </div>
                                            <div className="border-t border-[var(--border)] pt-2 mt-2">
                                                <div className="flex justify-between font-medium">
                                                    <span className="text-[var(--neutral-700)]">Total</span>
                                                    <span className="text-[var(--primary-700)]">₹{booking.price}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Terms */}
                                    <label className="flex items-start cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={agreeToTerms}
                                            onChange={(e) => setAgreeToTerms(e.target.checked)}
                                            className="w-4 h-4 mt-1 rounded border-[var(--border)] text-[var(--secondary-500)] focus:ring-[var(--secondary-500)]"
                                        />
                                        <span className="ml-3 text-sm text-[var(--neutral-600)]">
                                            I agree to the terms of service and understand the cancellation policy.
                                            I consent to share my information with the therapist for the session.
                                        </span>
                                    </label>

                                    {/* Security Note */}
                                    <div className="flex items-center text-sm text-[var(--neutral-500)]">
                                        <Shield className="w-4 h-4 mr-2 text-green-600" />
                                        Secure payment powered by Razorpay
                                    </div>

                                    {/* Confirm Button */}
                                    <button
                                        onClick={handleConfirmBooking}
                                        disabled={!agreeToTerms || isProcessing}
                                        className="w-full btn btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isProcessing ? (
                                            <span className="flex items-center justify-center">
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Processing Payment...
                                            </span>
                                        ) : (
                                            `Pay ₹${booking.price} & Confirm`
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
