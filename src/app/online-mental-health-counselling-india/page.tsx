'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Shield, Brain, Heart, Users, CheckCircle2, MapPin, Globe } from 'lucide-react';

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

export default function OnlineCounsellingIndiaPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* SEO-Optimized Hero */}
            <section className="pt-32 pb-16 md:pt-40 md:pb-24 bg-gradient-to-b from-[var(--warm-50)] to-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--primary-100)] rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                    >
                        <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary-50)] text-[var(--primary-700)] text-sm font-medium mb-6">
                            <Globe className="w-4 h-4" />
                            <span>Available Across India</span>
                        </motion.div>

                        <motion.h1
                            variants={fadeInUp}
                            className="font-serif text-4xl md:text-5xl lg:text-6xl text-[var(--primary-800)] mb-6 leading-tight"
                        >
                            Online Mental Health Counselling in India
                        </motion.h1>

                        <motion.p
                            variants={fadeInUp}
                            className="text-lg md:text-xl text-[var(--neutral-600)] mb-10 leading-relaxed max-w-3xl mx-auto"
                        >
                            Connect with a <strong className="text-[var(--primary-700)]">Licensed Clinical Psychologist</strong> from the comfort of your home. Arambh offers professional, confidential, and evidence-based online therapy for anxiety, depression, relationship issues, and stress management for individuals across India.
                        </motion.p>

                        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link
                                href="/therapists"
                                className="btn btn-primary px-8 py-4 text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                            >
                                Book an Online Session
                            </Link>
                            <Link
                                href="/services"
                                className="btn btn-secondary px-8 py-4 text-lg"
                            >
                                Explore Our Services
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Main Content - Structured for SEO */}
            <section className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="prose prose-lg prose-stone max-w-none">

                    <h2 className="font-serif text-3xl text-[var(--primary-800)] flex items-center gap-3">
                        <Heart className="w-8 h-8 text-[var(--secondary-500)]" />
                        Why Choose Online Therapy in India?
                    </h2>
                    <p className="text-[var(--neutral-600)] leading-relaxed">
                        In today's fast-paced world, prioritizing mental health is more important than ever. However, geographic limitations, traffic, and busy schedules often make it difficult to find a qualified clinical psychologist near you. <strong className="text-[var(--primary-700)]">Online mental health counselling</strong> bridges this gap, providing accessible, high-quality emotional support to anyone with an internet connection in India.
                    </p>
                    <p className="text-[var(--neutral-600)] leading-relaxed">
                        At Arambh Mental Health Centre, we specialize in delivering secure, video-based teletherapy that is just as effective as traditional in-person sessions. Whether you are dealing with chronic anxiety, navigating a depressive episode, or seeking couples counselling to improve relationship dynamics, our licensed professionals are here to help.
                    </p>

                    <div className="my-12 grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
                        <div className="bg-[var(--warm-50)] p-6 rounded-2xl border border-[var(--warm-100)]">
                            <Shield className="w-8 h-8 text-[var(--primary-600)] mb-4" />
                            <h3 className="font-serif text-xl font-bold text-[var(--primary-800)] mb-2">100% Confidential & Secure</h3>
                            <p className="text-[var(--neutral-600)]">Our platform ensures complete privacy, adhering to professional psychological ethics and data security standards.</p>
                        </div>
                        <div className="bg-[var(--warm-50)] p-6 rounded-2xl border border-[var(--warm-100)]">
                            <Brain className="w-8 h-8 text-[var(--primary-600)] mb-4" />
                            <h3 className="font-serif text-xl font-bold text-[var(--primary-800)] mb-2">Evidence-Based Treatment</h3>
                            <p className="text-[var(--neutral-600)]">We utilize scientifically backed therapeutic approaches tailored to your specific mental health needs.</p>
                        </div>
                    </div>

                    <h2 className="font-serif text-3xl text-[var(--primary-800)]">
                        Conditions Treated by Our Clinical Psychologists
                    </h2>
                    <p className="text-[var(--neutral-600)] leading-relaxed">
                        Our <Link href="/services" className="text-[var(--primary-600)] hover:underline font-medium">online therapy services</Link> cater to a wide range of psychological and emotional difficulties. You do not need a severe diagnosis to seek therapy; preventive mental healthcare is highly encouraged. We provide professional counselling for:
                    </p>

                    <ul className="space-y-4 my-8 not-prose">
                        {[
                            { title: 'Anxiety & Panic Disorders', desc: 'Overcoming excessive worry, social anxiety, and panic attacks through cognitive restructuring.' },
                            { title: 'Depression & Mood Disorders', desc: 'Managing persistent sadness, lack of motivation, and emotional exhaustion.' },
                            { title: 'Stress & Burnout', desc: 'Navigating workplace stress, academic pressure, and work-life balance challenges.' },
                            { title: 'Relationship & Couples Issues', desc: 'Improving communication, resolving conflicts, and rebuilding trust in relationships.' },
                            { title: 'Child & Adolescent Psychology', desc: 'Addressing behavioral issues, academic stress, and emotional regulation in youth.' }
                        ].map((item, i) => (
                            <li key={i} className="flex items-start bg-white p-4 rounded-xl border border-[var(--neutral-200)] shadow-sm">
                                <CheckCircle2 className="w-6 h-6 text-[var(--secondary-500)] mt-1 mr-4 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-[var(--primary-800)] text-lg">{item.title}</h4>
                                    <p className="text-[var(--neutral-600)] mt-1">{item.desc}</p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="bg-[var(--primary-50)] p-8 rounded-3xl mt-12 not-prose text-center border border-[var(--primary-100)]">
                        <h2 className="font-serif text-2xl md:text-3xl text-[var(--primary-800)] mb-4">
                            Start Your Journey to Mental Wellness Today
                        </h2>
                        <p className="text-[var(--neutral-700)] mb-8 max-w-2xl mx-auto">
                            Taking the first step can be daunting, but you don't have to navigate it alone. Speak with a licensed clinical psychologist online from anywhere in India.
                        </p>
                        <Link
                            href="/therapists"
                            className="inline-flex items-center justify-center px-8 py-3 bg-[var(--primary-600)] text-white rounded-lg font-medium hover:bg-[var(--primary-700)] transition-colors shadow-md"
                        >
                            Consult a Psychologist
                        </Link>
                    </div>

                </div>
            </section>
        </div>
    );
}
