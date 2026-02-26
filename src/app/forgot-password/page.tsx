'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase() })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Something went wrong');

            setSent(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset link. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1 flex items-center justify-center px-4 py-12 bg-gradient-to-b from-[var(--warm-100)] to-[var(--warm-50)]">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeInUp}
                    className="w-full max-w-md"
                >
                    <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
                        {sent ? (
                            // Success state
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                            >
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h2 className="font-serif text-2xl text-[var(--primary-700)] mb-3">
                                    Check Your Email
                                </h2>
                                <p className="text-[var(--neutral-500)] mb-2">
                                    If an account exists for <strong className="text-[var(--neutral-700)]">{email}</strong>, we&apos;ve sent a password reset link.
                                </p>
                                <p className="text-sm text-[var(--neutral-400)] mb-6">
                                    The link expires in 1 hour. Check your spam folder if you don&apos;t see it.
                                </p>
                                <Link
                                    href="/login"
                                    className="btn btn-primary w-full py-3 flex items-center justify-center font-semibold"
                                >
                                    Back to Login
                                </Link>
                            </motion.div>
                        ) : (
                            // Form state
                            <>
                                <div className="text-center mb-8">
                                    <div className="w-14 h-14 bg-[var(--primary-100)] rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Mail className="w-7 h-7 text-[var(--primary-600)]" />
                                    </div>
                                    <h1 className="font-serif text-3xl text-[var(--primary-700)] mb-2">
                                        Forgot Password?
                                    </h1>
                                    <p className="text-[var(--neutral-500)]">
                                        Enter your email and we&apos;ll send you a reset link
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                                        >
                                            {error}
                                        </motion.div>
                                    )}

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="input"
                                            placeholder="you@example.com"
                                            required
                                            disabled={isLoading}
                                            autoFocus
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="btn btn-primary w-full py-3 flex items-center justify-center font-semibold"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            'Send Reset Link'
                                        )}
                                    </button>
                                </form>

                                <div className="mt-6 text-center">
                                    <Link
                                        href="/login"
                                        className="text-sm text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium inline-flex items-center gap-1"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back to Login
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
