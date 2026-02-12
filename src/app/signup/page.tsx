'use client';

import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};


function SignupForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // OTP States
    const [step, setStep] = useState(1); // 1: Details, 2: OTP
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const { signup } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/';

    const passwordRequirements = [
        { met: password.length >= 8, text: 'At least 8 characters' },
        { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
        { met: /[0-9]/.test(password), text: 'One number' },
    ];

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (!passwordRequirements.every((req) => req.met)) {
            setError('Please meet all password requirements.');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send OTP');
            }

            setOtpSent(true);
            setStep(2);
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyAndSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Verify OTP
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Invalid OTP');
            }

            // If verified, proceed to Create Account
            await signup(email, password, name);
            router.push(redirectTo);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="w-full max-w-md"
        >
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
                <div className="text-center mb-8">
                    <h1 className="font-serif text-3xl text-[var(--primary-700)] mb-2">
                        {step === 1 ? 'Begin Your Journey' : 'Verify Email'}
                    </h1>
                    <p className="text-[var(--neutral-500)]">
                        {step === 1 ? 'Create an account to book appointments' : `Enter the code sent to ${email}`}
                    </p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                    >
                        {error}
                    </motion.div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleSendOtp} className="space-y-5">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input"
                                placeholder="Your full name"
                                required
                                disabled={isLoading}
                            />
                        </div>

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
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input pr-10"
                                    placeholder="••••••••"
                                    required
                                    disabled={isLoading}
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--neutral-400)] hover:text-[var(--neutral-600)]"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            {password.length > 0 && (
                                <div className="mt-3 space-y-1">
                                    {passwordRequirements.map((req, i) => (
                                        <div key={i} className="flex items-center text-xs">
                                            <div className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center ${req.met ? 'bg-green-100 text-green-600' : 'bg-[var(--neutral-100)] text-[var(--neutral-400)]'
                                                }`}>
                                                <Check className="w-3 h-3" />
                                            </div>
                                            <span className={req.met ? 'text-green-600' : 'text-[var(--neutral-500)]'}>
                                                {req.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input"
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn btn-primary py-3 text-base disabled:opacity-50"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Sending OTP...
                                </span>
                            ) : (
                                'Continue'
                            )}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyAndSignup} className="space-y-5">
                        <div>
                            <label htmlFor="otp" className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                                Verification Code
                            </label>
                            <input
                                id="otp"
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                                className="input text-center text-2xl tracking-widest"
                                placeholder="000000"
                                required
                                disabled={isLoading}
                                maxLength={6}
                            />
                            <p className="mt-2 text-xs text-center text-[var(--neutral-500)]">
                                Did not receive code? <button type="button" onClick={() => setStep(1)} className="text-[var(--primary-600)] hover:underline">Resend</button>
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn btn-primary py-3 text-base disabled:opacity-50"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Verifying...
                                </span>
                            ) : (
                                'Verify & Create Account'
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            disabled={isLoading}
                            className="w-full text-sm text-[var(--neutral-500)] hover:text-[var(--neutral-700)]"
                        >
                            Back
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <p className="text-[var(--neutral-500)]">
                        Already have an account?{' '}
                        <Link
                            href={`/login${redirectTo !== '/' ? `?redirect=${redirectTo}` : ''}`}
                            className="text-[var(--secondary-600)] hover:text-[var(--secondary-700)] font-medium"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>

            <p className="text-center text-sm text-[var(--neutral-500)] mt-6">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
        </motion.div>
    );
}


function SignupFormFallback() {
    return (
        <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 flex items-center justify-center min-h-[500px]">
                <Loader2 className="w-8 h-8 text-[var(--primary-500)] animate-spin" />
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 flex items-center justify-center py-24 px-4 bg-gradient-to-b from-[var(--warm-100)] to-[var(--warm-50)]">
                <Suspense fallback={<SignupFormFallback />}>
                    <SignupForm />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}
