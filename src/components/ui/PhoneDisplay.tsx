'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Phone } from 'lucide-react';
import Link from 'next/link';

const FULL_NUMBER = '+91 7075829856';
const MASKED_NUMBER = '+91 70••••••56';

interface PhoneDisplayProps {
    /** Visual style variant */
    variant?: 'inline' | 'card' | 'footer';
    /** Additional CSS classes for the container */
    className?: string;
    /** Show the Phone icon? */
    showIcon?: boolean;
    /** Icon size class e.g. "w-5 h-5" */
    iconClassName?: string;
}

export default function PhoneDisplay({
    variant = 'inline',
    className = '',
    showIcon = true,
    iconClassName = 'w-5 h-5',
}: PhoneDisplayProps) {
    const { user, loading } = useAuth();
    const isAuthenticated = !!user;

    // While auth is loading, show masked to avoid flash
    const displayNumber = isAuthenticated ? FULL_NUMBER : MASKED_NUMBER;

    if (variant === 'footer') {
        return isAuthenticated ? (
            <a
                href={`tel:${FULL_NUMBER.replace(/\s/g, '')}`}
                className={`flex items-center space-x-2 text-[var(--primary-200)] hover:text-white transition-colors text-sm ${className}`}
            >
                {showIcon && <Phone className={iconClassName} />}
                <span>{displayNumber}</span>
            </a>
        ) : (
            <div className={`flex items-center space-x-2 text-[var(--primary-200)] text-sm ${className}`}>
                {showIcon && <Phone className={iconClassName} />}
                <span className="flex items-center gap-2">
                    {MASKED_NUMBER}
                    <Link
                        href="/login"
                        className="text-xs underline text-[var(--primary-300)] hover:text-white transition-colors"
                    >
                        Sign in to view
                    </Link>
                </span>
            </div>
        );
    }

    if (variant === 'card') {
        return isAuthenticated ? (
            <a
                href={`tel:${FULL_NUMBER.replace(/\s/g, '')}`}
                className={`flex items-start space-x-4 group ${className}`}
            >
                {showIcon && (
                    <div className="w-12 h-12 bg-[var(--primary-5)] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--primary-100)] transition-colors">
                        <Phone className="w-5 h-5 text-[var(--primary-600)]" />
                    </div>
                )}
                <div>
                    <h3 className="font-medium text-[var(--neutral-700)] mb-1">Phone</h3>
                    <p className="text-[var(--neutral-600)]">{displayNumber}</p>
                </div>
            </a>
        ) : (
            <div className={`flex items-start space-x-4 ${className}`}>
                {showIcon && (
                    <div className="w-12 h-12 bg-[var(--primary-5)] rounded-xl flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-[var(--primary-600)]" />
                    </div>
                )}
                <div>
                    <h3 className="font-medium text-[var(--neutral-700)] mb-1">Phone</h3>
                    <p className="text-[var(--neutral-600)]">{MASKED_NUMBER}</p>
                    <Link
                        href="/login"
                        className="text-xs text-[var(--primary-500)] hover:text-[var(--primary-700)] underline mt-1 inline-block"
                    >
                        Sign in to see full number
                    </Link>
                </div>
            </div>
        );
    }

    // Default: inline variant (used on home page)
    return isAuthenticated ? (
        <a
            href={`tel:${FULL_NUMBER.replace(/\s/g, '')}`}
            className={`flex items-center space-x-2 text-[var(--neutral-600)] hover:text-[var(--primary-600)] transition-colors ${className}`}
        >
            {showIcon && <Phone className={`${iconClassName} text-[var(--primary-500)]`} />}
            <span>{displayNumber}</span>
        </a>
    ) : (
        <div className={`flex items-center space-x-2 text-[var(--neutral-600)] ${className}`}>
            {showIcon && <Phone className={`${iconClassName} text-[var(--primary-500)]`} />}
            <span>{MASKED_NUMBER}</span>
            <Link
                href="/login"
                className="text-xs text-[var(--primary-500)] hover:text-[var(--primary-700)] underline ml-1"
            >
                Sign in
            </Link>
        </div>
    );
}

/**
 * Returns the masked phone number for use in static metadata (SSR context where auth isn't available).
 */
export function getMaskedPhone(): string {
    return MASKED_NUMBER;
}
