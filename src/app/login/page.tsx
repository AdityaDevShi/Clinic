'use client';

import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Sign in directly
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            const userRef = doc(db, 'users', userCredential.user.uid);
            let userDoc = await getDoc(userRef);

            // DEMO OVERRIDE: Persist therapist role in Firestore
            if (email.toLowerCase() === 'therapist@demo.com') {
                const userData = userDoc.data();
                if (userData?.role !== 'therapist') {
                    // Update Firestore so AuthContext picks it up on next load
                    await setDoc(userRef, {
                        role: 'therapist',
                        email: email, // Ensure email is set
                        name: 'Dr. Shiwani Kohli' // Set a nice name for the demo
                    }, { merge: true });

                    // Fetch updated doc
                    userDoc = await getDoc(userRef);
                }
            }

            const userData = userDoc.data();
            const role = userData?.role || 'client';

            // Redirect based on role using window.location for guaranteed navigation
            let destination = '/';
            if (redirectTo) {
                destination = redirectTo;
            } else if (role === 'admin') {
                destination = '/admin/dashboard';
            } else if (role === 'therapist') {
                destination = '/therapist/dashboard';
            }

            window.location.href = destination;
        } catch (err: unknown) {
            if (err instanceof Error) {
                if (err.message.includes('user-not-found')) {
                    setError('No account found with this email.');
                } else if (err.message.includes('wrong-password')) {
                    setError('Incorrect password. Please try again.');
                } else if (err.message.includes('invalid-email')) {
                    setError('Please enter a valid email address.');
                } else if (err.message.includes('invalid-credential')) {
                    setError('Invalid email or password.');
                } else {
                    setError('Unable to sign in. Please try again.');
                }
            } else {
                setError('An unexpected error occurred.');
            }
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
                        Welcome Back
                    </h1>
                    <p className="text-[var(--neutral-500)]">
                        Sign in to continue your journey
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
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--neutral-400)] hover:text-[var(--neutral-600)]"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        <div className="flex justify-end mt-1">
                            <Link
                                href="/forgot-password"
                                className="text-sm text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium"
                            >
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-primary w-full py-3 flex items-center justify-center font-semibold"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-[var(--neutral-500)] text-sm">
                        Don&apos;t have an account?{' '}
                        <Link
                            href="/signup"
                            className="text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium"
                        >
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 flex items-center justify-center px-4 py-12 bg-gradient-to-b from-[var(--warm-100)] to-[var(--warm-50)]">
                <Suspense fallback={<div className="text-center">Loading...</div>}>
                    <LoginForm />
                </Suspense>
            </main>

            <Footer />
        </div>
    );
}
