'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, ChevronDown, Power } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, serverTimestamp, getDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';



const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/therapists', label: 'Our Therapists' },
    { href: '/services', label: 'Services' },
    { href: '/contact', label: 'Contact' },
];

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { user, logout, loading } = useAuth();

    const getDashboardLink = () => {
        if (!user) return '/login';
        switch (user.role) {
            case 'admin':
                return '/admin/dashboard';
            case 'therapist':
                return '/therapist/dashboard';
            default:
                return '/client/bookings';
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <Image
                                src="/logo.png"
                                alt="Arambh Logo"
                                width={40}
                                height={40}
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-serif text-xl font-semibold text-[var(--primary-700)]">
                                Arambh
                            </span>
                            <span className="text-xs text-[var(--muted-foreground)] -mt-1">
                                Mental Health Centre
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-[var(--neutral-600)] hover:text-[var(--primary-600)] transition-colors duration-300 text-sm font-medium"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Auth Buttons / User Menu */}
                    <div className="hidden md:flex items-center space-x-4">
                        {loading ? (
                            <div className="w-8 h-8 rounded-full bg-[var(--neutral-200)] animate-pulse" />
                        ) : user ? (
                            <div className="flex items-center gap-4">

                                <div className="relative">
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-[var(--warm-100)] transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-[var(--primary-100)] flex items-center justify-center">
                                            <User className="w-4 h-4 text-[var(--primary-600)]" />
                                        </div>
                                        <span className="text-sm font-medium text-[var(--neutral-700)]">
                                            {user.name || 'User'}
                                        </span>
                                        <ChevronDown className="w-4 h-4 text-[var(--neutral-500)]" />
                                    </button>

                                    <AnimatePresence>
                                        {isDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 8 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-[var(--border)] py-2"
                                            >
                                                <Link
                                                    href={getDashboardLink()}
                                                    className="block px-4 py-2 text-sm text-[var(--neutral-700)] hover:bg-[var(--warm-50)]"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                >
                                                    Dashboard
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        logout();
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-[var(--neutral-700)] hover:bg-[var(--warm-50)]"
                                                >
                                                    Sign Out
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="text-[var(--neutral-600)] hover:text-[var(--primary-600)] text-sm font-medium transition-colors"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/signup"
                                    className="btn btn-primary text-sm"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-[var(--warm-100)] transition-colors"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? (
                            <X className="w-6 h-6 text-[var(--neutral-700)]" />
                        ) : (
                            <Menu className="w-6 h-6 text-[var(--neutral-700)]" />
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="md:hidden overflow-hidden"
                        >
                            <div className="py-4 space-y-2 border-t border-[var(--border)]">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="block px-4 py-3 text-[var(--neutral-600)] hover:text-[var(--primary-600)] hover:bg-[var(--warm-50)] rounded-lg transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                <div className="pt-4 space-y-2 border-t border-[var(--border)] mt-4">
                                    {user ? (
                                        <>
                                            <Link
                                                href={getDashboardLink()}
                                                className="block px-4 py-3 text-[var(--neutral-600)] hover:bg-[var(--warm-50)] rounded-lg"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                Dashboard
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    setIsMenuOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-3 text-[var(--neutral-600)] hover:bg-[var(--warm-50)] rounded-lg"
                                            >
                                                Sign Out
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Link
                                                href="/login"
                                                className="block px-4 py-3 text-[var(--neutral-600)] hover:bg-[var(--warm-50)] rounded-lg"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                Sign In
                                            </Link>
                                            <Link
                                                href="/signup"
                                                className="block mx-4 text-center btn btn-primary"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                Get Started
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </header>
    );
}
