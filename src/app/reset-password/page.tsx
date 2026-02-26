'use client';

import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // No token in URL — invalid link
    if (!token) {
        return (
            <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="font-serif text-2xl text-[var(--primary-700)] mb-3">
                    Invalid Reset Link
                </h2>
                <p className="text-[var(--neutral-500)] mb-6">
                    This password reset link is invalid or missing. Please request a new one.
                </p>
                <Link
                    href="/forgot-password"
                    className="btn btn-primary py-3 px-6 inline-flex items-center font-semibold"
                >
                    Request New Link
                </Link>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to reset password');

            setSuccess(true);
            // Auto-redirect to login after 3 seconds
            setTimeout(() => router.push('/login'), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
            >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="font-serif text-2xl text-[var(--primary-700)] mb-3">
                    Password Reset!
                </h2>
                <p className="text-[var(--neutral-500)] mb-6">
                    Your password has been updated successfully. Redirecting to login...
                </p>
                <Link
                    href="/login"
                    className="btn btn-primary w-full py-3 flex items-center justify-center font-semibold"
                >
                    Go to Login
                </Link>
            </motion.div>
        );
    }

    return (
        <>
            <div className="text-center mb-8">
                <div className="w-14 h-14 bg-[var(--primary-100)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-7 h-7 text-[var(--primary-600)]" />
                </div>
                <h1 className="font-serif text-3xl text-[var(--primary-700)] mb-2">
                    Set New Password
                </h1>
                <p className="text-[var(--neutral-500)]">
                    Enter your new password below
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
                    <label htmlFor="newPassword" className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                        New Password
                    </label>
                    <div className="relative">
                        <input
                            id="newPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="input pr-10"
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                            minLength={6}
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--neutral-400)] hover:text-[var(--neutral-600)]"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                        Confirm New Password
                    </label>
                    <div className="relative">
                        <input
                            id="confirmPassword"
                            type={showConfirm ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="input pr-10"
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                            minLength={6}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--neutral-400)] hover:text-[var(--neutral-600)]"
                        >
                            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                    className="btn btn-primary w-full py-3 flex items-center justify-center font-semibold"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Resetting...
                        </>
                    ) : (
                        'Reset Password'
                    )}
                </button>
            </form>
        </>
    );
}

export default function ResetPasswordPage() {
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
                        <Suspense fallback={<div className="text-center"><Loader2 className="w-8 h-8 text-[var(--primary-500)] animate-spin mx-auto" /></div>}>
                            <ResetPasswordForm />
                        </Suspense>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
