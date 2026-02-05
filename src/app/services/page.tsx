'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
    User,
    Users,
    Heart,
    ClipboardList,
    Clock,
    DollarSign,
    ArrowRight
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

const services = [
    {
        id: 'individual',
        icon: User,
        title: 'Individual Therapy',
        description: 'One-on-one sessions tailored to your unique needs. We address anxiety, depression, stress, trauma, grief, relationship issues, and personal growth.',
        duration: '50 minutes',
        price: '₹2,500',
        features: [
            'Personalized treatment plans',
            'Evidence-based approaches (CBT, DBT, EMDR)',
            'Safe and confidential space',
            'Online or in-person sessions',
        ],
    },
    {
        id: 'child',
        icon: Heart,
        title: 'Child & Adolescent Therapy',
        description: 'Specialized support for young minds. We help children and teenagers navigate emotional challenges, behavioral issues, academic stress, and developmental transitions.',
        duration: '45 minutes',
        price: '₹2,000',
        features: [
            'Play therapy techniques',
            'Parent guidance sessions',
            'School-related support',
            'Age-appropriate interventions',
        ],
    },
    {
        id: 'couples',
        icon: Users,
        title: 'Couples Counseling',
        description: 'Strengthen your relationship through improved communication, conflict resolution, and deeper emotional connection. We help couples at any stage of their relationship.',
        duration: '60 minutes',
        price: '₹3,500',
        features: [
            'Communication skill building',
            'Conflict resolution strategies',
            'Intimacy enhancement',
            'Pre-marital counseling available',
        ],
    },
    {
        id: 'training',
        icon: ClipboardList,
        title: 'Training & Supervision',
        description: 'Professional training programs and supervision for psychology students and interns. We offer hands-on experience and guidance for aspiring mental health professionals.',
        duration: 'Varies',
        price: 'Contact Us',
        features: [
            'Clinical internship programs',
            'Case conceptualization supervision',
            'Skill building workshops',
            'Research guidance',
        ],
    },
];

const packages = [
    {
        name: 'Single Session',
        description: 'Perfect for a first consultation or one-time guidance.',
        sessions: 1,
        discount: 0,
    },
    {
        name: '1 Month Care',
        description: 'Consistent weekly support to start your healing journey.',
        sessions: 4,
        discount: 10,
        popular: false,
    },
    {
        name: '2 Months Care',
        description: 'Dedicated weekly support for deeper progress and growth.',
        sessions: 8,
        discount: 15,
        popular: true,
    },
    {
        name: '3 Months Care',
        description: 'Comprehensive long-term support for sustainable change.',
        sessions: 12,
        discount: 20,
        popular: false,
    },
];

export default function ServicesPage() {
    const [sessionsPerWeek, setSessionsPerWeek] = useState(1);

    return (
        <div className="min-h-screen">
            <Header />

            {/* Hero Section */}
            <section className="pt-24 md:pt-32 pb-16 md:pb-20 bg-gradient-to-b from-[var(--warm-100)] to-[var(--warm-50)]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                    >
                        <motion.h1
                            variants={fadeInUp}
                            className="font-serif text-4xl md:text-5xl text-[var(--primary-700)] mb-4"
                        >
                            Our Services
                        </motion.h1>
                        <motion.div variants={fadeInUp} className="section-divider mb-6" />
                        <motion.p
                            variants={fadeInUp}
                            className="text-lg text-[var(--neutral-600)] max-w-2xl mx-auto"
                        >
                            Professional mental health services tailored to your unique needs.
                            Every journey begins with a single step towards healing.
                        </motion.p>
                    </motion.div>
                </div>
            </section>

            {/* Services List */}
            <section className="py-16 md:py-24 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="space-y-12 md:space-y-16">
                        {services.map((service, index) => (
                            <motion.div
                                key={service.id}
                                id={service.id}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-50px" }}
                                variants={fadeInUp}
                                className={`grid md:grid-cols-2 gap-8 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''
                                    }`}
                            >
                                <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                                    <div className="flex items-center mb-4">
                                        <div className="w-12 h-12 bg-[var(--primary-100)] rounded-full flex items-center justify-center mr-4">
                                            <service.icon className="w-6 h-6 text-[var(--primary-600)]" />
                                        </div>
                                        <h2 className="font-serif text-2xl md:text-3xl text-[var(--primary-700)]">
                                            {service.title}
                                        </h2>
                                    </div>

                                    <p className="text-[var(--neutral-600)] mb-6 leading-relaxed">
                                        {service.description}
                                    </p>

                                    <div className="flex flex-wrap gap-4 mb-6">
                                        <div className="flex items-center text-sm text-[var(--neutral-500)]">
                                            <Clock className="w-4 h-4 mr-2 text-[var(--primary-400)]" />
                                            {service.duration}
                                        </div>
                                        <div className="flex items-center text-sm font-medium text-[var(--primary-600)]">
                                            <DollarSign className="w-4 h-4 mr-1" />
                                            {service.price}
                                        </div>
                                    </div>

                                    <Link
                                        href={service.id === 'training' ? '/contact' : '/therapists'}
                                        className="inline-flex items-center text-[var(--secondary-600)] hover:text-[var(--secondary-700)] font-medium group"
                                    >
                                        Book Now
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>

                                <div className={`${index % 2 === 1 ? 'md:order-1' : ''}`}>
                                    <div className="bg-[var(--warm-50)] rounded-2xl p-6 md:p-8">
                                        <h3 className="font-medium text-[var(--primary-700)] mb-4">
                                            What&apos;s included:
                                        </h3>
                                        <ul className="space-y-3">
                                            {service.features.map((feature, i) => (
                                                <li key={i} className="flex items-start text-[var(--neutral-600)]">
                                                    <span className="w-2 h-2 bg-[var(--primary-400)] rounded-full mt-2 mr-3 flex-shrink-0" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Packages Section */}
            <section className="py-16 md:py-24 gradient-section">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="text-center mb-12"
                    >
                        <motion.h2
                            variants={fadeInUp}
                            className="font-serif text-3xl md:text-4xl text-[var(--primary-700)] mb-4"
                        >
                            Therapy Packages
                        </motion.h2>
                        <motion.div variants={fadeInUp} className="section-divider mb-6" />
                        <motion.p
                            variants={fadeInUp}
                            className="text-[var(--neutral-600)] max-w-2xl mx-auto"
                        >
                            Save with our therapy packages designed to support your journey towards mental wellness.
                        </motion.p>
                    </motion.div>

                    {/* Frequency Selector */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        className="flex flex-col items-center justify-center mb-12"
                    >
                        <p className="text-[var(--neutral-600)] mb-4 font-medium">How many sessions per week?</p>
                        <div className="flex items-center gap-2 bg-[var(--neutral-100)] p-1 rounded-full">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => setSessionsPerWeek(num)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${sessionsPerWeek === num
                                            ? 'bg-[var(--primary-600)] text-white shadow-md transform scale-105'
                                            : 'text-[var(--neutral-500)] hover:bg-white hover:text-[var(--primary-600)]'
                                        }`}
                                >
                                    {num}x
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        {packages.map((pkg) => {
                            // Calculate total sessions:
                            // Single Session always 1.
                            // Others: base weeks (4, 8, 12) * sessionsPerWeek.
                            // Base sessions defs in 'packages' array were 4, 8, 12.
                            // So we can assume pkg.sessions is the "1x per week" count (which equals weeks).
                            const isSingle = pkg.name === 'Single Session';
                            const totalSessions = isSingle ? 1 : pkg.sessions * sessionsPerWeek;

                            return (
                                <motion.div
                                    key={pkg.name}
                                    variants={fadeInUp}
                                    className={`bg-white rounded-xl p-6 text-center relative flex flex-col ${pkg.popular ? 'ring-2 ring-[var(--secondary-500)] shadow-lg' : 'shadow-sm'
                                        }`}
                                >
                                    {pkg.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--secondary-500)] text-white text-xs font-medium px-3 py-1 rounded-full">
                                            Most Popular
                                        </div>
                                    )}
                                    <h3 className="font-serif text-lg font-semibold text-[var(--primary-700)] mb-2">
                                        {pkg.name}
                                    </h3>
                                    <p className="text-sm text-[var(--neutral-500)] mb-4 flex-grow">
                                        {pkg.description}
                                    </p>
                                    <div className="text-3xl font-bold text-[var(--primary-600)] mb-1">
                                        {totalSessions}
                                    </div>
                                    <div className="text-sm text-[var(--neutral-500)] mb-6">
                                        sessions
                                        {!isSingle && <span className="text-xs ml-1 text-[var(--neutral-400)]">({sessionsPerWeek}/week)</span>}
                                    </div>

                                    {pkg.discount > 0 && (
                                        <div className="text-sm font-medium text-[var(--secondary-600)] mb-4">
                                            Save {pkg.discount}%
                                        </div>
                                    )}

                                    <Link
                                        href="/therapists"
                                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${pkg.popular
                                                ? 'bg-[var(--primary-600)] text-white hover:bg-[var(--primary-700)]'
                                                : 'bg-[var(--neutral-100)] text-[var(--neutral-700)] hover:bg-[var(--neutral-200)]'
                                            }`}
                                    >
                                        Book Now
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 md:py-20 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                    >
                        <motion.h2
                            variants={fadeInUp}
                            className="font-serif text-2xl md:text-3xl text-[var(--primary-700)] mb-4"
                        >
                            Ready to Begin Your Healing Journey?
                        </motion.h2>
                        <motion.p
                            variants={fadeInUp}
                            className="text-[var(--neutral-600)] mb-8"
                        >
                            Take the first step towards mental wellness. Our therapists are here to support you.
                        </motion.p>
                        <motion.div variants={fadeInUp}>
                            <Link
                                href="/therapists"
                                className="inline-flex items-center justify-center px-8 py-4 bg-[var(--secondary-500)] text-white rounded-lg hover:bg-[var(--secondary-600)] transition-all duration-300 text-lg font-medium shadow-lg hover:shadow-xl hover:-translate-y-1"
                            >
                                Book Your Session
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
