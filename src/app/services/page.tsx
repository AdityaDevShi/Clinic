'use client';

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
        id: 'assessments',
        icon: ClipboardList,
        title: 'Psychodiagnostics Assessments',
        description: 'Comprehensive psychological testing to understand cognitive, emotional, and behavioral functioning. We provide detailed reports for clinical and developmental insights.',
        duration: 'Varies',
        price: 'Contact Us',
        features: [
            'IQ & Developmental Testing',
            'Neuropsychological Testing',
            'Personality Profiling',
            'Behavioral Checklists',
            'IVF Donor Assessment'
        ],
    },
    {
        id: 'therapy',
        icon: Heart,
        title: 'Psychotherapy & Counseling',
        description: 'Evidence-based therapeutic interventions for individuals, couples, and families. We treat a wide range of concerns using proven modalities.',
        duration: '45-50 mins',
        price: 'Varies',
        features: [
            'CBT, DBT, ACT & Trauma Counseling',
            'Child, Adolescent & Play Therapy',
            'Family & Couples Counseling',
            'Dementia Care & Stroke Rehab',
            'ADHD & Autism Interventions'
        ],
    },
    {
        id: 'internship',
        icon: Users,
        title: 'Psychology Internship Program',
        description: 'Structured training for aspiring mental health professionals. Gain hands-on clinical exposure under expert supervision.',
        duration: '1-6 Months',
        price: 'Contact Us',
        features: [
            'Supervised Clinical Exposure',
            'Hands-on Assessment Training',
            'Case Documentation & Reporting',
            'Therapy Observations',
            'Certification Provided'
        ],
    },
];

export default function ServicesPage() {
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
                    </motion.div>

                    {/* Frequency Selector -- REMOVED -- */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        className="flex flex-col items-center justify-center mb-12"
                    >
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
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
