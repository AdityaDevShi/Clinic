'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

import { Timestamp } from 'firebase/firestore';

interface WorkshopSettings {
    isEnabled: boolean;
    message: string;
    link?: string;
    updatedAt?: Timestamp;
}

export default function WorkshopBanner() {
    const [settings, setSettings] = useState<WorkshopSettings | null>(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Real-time listener for workshop settings
        const unsubscribe = onSnapshot(doc(db, 'settings', 'workshop'), (doc) => {
            if (doc.exists()) {
                const data = doc.data() as WorkshopSettings;
                setSettings(data);

                // Version check logic
                const dismissedVersion = sessionStorage.getItem('workshop_dismissed_version');

                // Use updatedAt seconds as version, or fallback to message string (hash-like)
                const currentVersion = data.updatedAt
                    ? data.updatedAt.seconds.toString()
                    : data.message;

                if (dismissedVersion === currentVersion && currentVersion) {
                    setIsVisible(false);
                } else {
                    setIsVisible(true);
                }
            } else {
                setSettings(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        if (settings) {
            const version = settings.updatedAt
                ? settings.updatedAt.seconds.toString()
                : settings.message;
            sessionStorage.setItem('workshop_dismissed_version', version);
        }
    };

    if (!settings?.isEnabled || !isVisible || !settings.message) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="relative bg-[var(--secondary-600)] text-white overflow-hidden z-[60]"
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-3 flex items-center justify-between">
                        <div className="flex-1 overflow-hidden mr-8 relative h-6 md:h-7">
                            <motion.div
                                animate={{ x: ["100%", "-100%"] }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 20,
                                    ease: "linear"
                                }}
                                className="whitespace-nowrap absolute"
                            >
                                <span className="text-sm md:text-base font-medium inline-flex items-center">
                                    {settings.message}
                                    {settings.link && (
                                        <Link
                                            href={settings.link}
                                            className="ml-2 underline hover:text-[var(--secondary-100)] inline-flex items-center"
                                        >
                                            Learn More <ArrowRight className="w-4 h-4 ml-1" />
                                        </Link>
                                    )}
                                </span>
                            </motion.div>
                        </div>

                        <button
                            onClick={handleClose}
                            className="p-1 hover:bg-[var(--secondary-500)] rounded-full transition-colors flex-shrink-0"
                            aria-label="Close banner"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
