'use client';

import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Award, Heart, Shield, Users, BookOpen, Target } from 'lucide-react';

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

const values = [
    {
        icon: Heart,
        title: 'Compassion',
        description: 'We approach every individual with empathy, understanding, and genuine care.',
    },
    {
        icon: Shield,
        title: 'Confidentiality',
        description: 'Your privacy is paramount. All sessions and information remain strictly confidential.',
    },
    {
        icon: Target,
        title: 'Evidence-Based',
        description: 'We use proven therapeutic approaches backed by scientific research.',
    },
    {
        icon: Users,
        title: 'Inclusivity',
        description: 'We welcome individuals from all backgrounds without judgment.',
    },
    {
        icon: BookOpen,
        title: 'Continuous Learning',
        description: 'We stay updated with the latest developments in mental health care.',
    },
    {
        icon: Award,
        title: 'Excellence',
        description: 'We strive for the highest standards in therapeutic care and professionalism.',
    },
];

export default function AboutPage() {
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
                            About Us
                        </motion.h1>
                        <motion.div variants={fadeInUp} className="section-divider mb-6" />
                        <motion.p
                            variants={fadeInUp}
                            className="text-lg text-[var(--neutral-600)] max-w-2xl mx-auto"
                        >
                            Dedicated to helping you find clarity, balance, and emotional well-being.
                        </motion.p>
                    </motion.div>
                </div>
            </section>

            {/* Story Section */}
            <section className="py-16 md:py-24 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={staggerContainer}
                    >
                        <motion.h2
                            variants={fadeInUp}
                            className="font-serif text-3xl md:text-4xl text-[var(--primary-700)] mb-6 text-center"
                        >
                            Our Story
                        </motion.h2>
                        <motion.div variants={fadeInUp} className="section-divider mb-10" />

                        <motion.div variants={fadeInUp} className="prose prose-lg max-w-none text-[var(--neutral-600)]">
                            <p className="mb-6 leading-relaxed">
                                <strong className="text-[var(--primary-600)]">Arambh</strong> — meaning &quot;A New Beginning&quot; in Hindi —
                                was founded with a simple yet profound vision: to make quality mental health care accessible,
                                approachable, and transformative.
                            </p>

                            <p className="mb-6 leading-relaxed">
                                In a world where mental health is often stigmatized or overlooked, we believe that seeking
                                help is not a sign of weakness but an act of courage. Our centre provides a safe,
                                non-judgmental space where individuals can explore their thoughts, process their emotions,
                                and work towards lasting positive change.
                            </p>

                            <p className="leading-relaxed">
                                Led by <strong className="text-[var(--primary-600)]">Shiwani Kohli</strong>, an RCI Registered
                                Clinical Psychologist (RCI Reg. No. A12945), our team brings together expertise, compassion,
                                and a deep commitment to your well-being. We combine evidence-based therapeutic approaches
                                with a holistic understanding of mental health to provide personalized care that truly makes
                                a difference.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Values Section */}
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
                            Our Values
                        </motion.h2>
                        <motion.div variants={fadeInUp} className="section-divider" />
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                    >
                        {values.map((value) => (
                            <motion.div
                                key={value.title}
                                variants={fadeInUp}
                                className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="w-14 h-14 mx-auto mb-4 bg-[var(--primary-50)] rounded-full flex items-center justify-center">
                                    <value.icon className="w-7 h-7 text-[var(--primary-500)]" />
                                </div>
                                <h3 className="font-serif text-lg font-semibold text-[var(--primary-700)] mb-2">
                                    {value.title}
                                </h3>
                                <p className="text-[var(--neutral-500)] text-sm">
                                    {value.description}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Therapist Highlight */}
            <section className="py-16 md:py-24 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="text-center"
                    >
                        <motion.h2
                            variants={fadeInUp}
                            className="font-serif text-3xl md:text-4xl text-[var(--primary-700)] mb-4"
                        >
                            Meet Our Lead Therapist
                        </motion.h2>
                        <motion.div variants={fadeInUp} className="section-divider mb-10" />

                        <motion.div
                            variants={fadeInUp}
                            className="bg-[var(--warm-50)] rounded-2xl p-8 md:p-12"
                        >
                            <div className="w-32 h-32 mx-auto mb-6 bg-[var(--primary-100)] rounded-full flex items-center justify-center">
                                <span className="text-4xl font-serif text-[var(--primary-600)]">SK</span>
                            </div>

                            <h3 className="font-serif text-2xl text-[var(--primary-700)] mb-2">
                                Shiwani Kohli
                            </h3>
                            <p className="text-[var(--secondary-600)] font-medium mb-4">
                                RCI Registered Clinical Psychologist
                            </p>
                            <p className="text-sm text-[var(--neutral-500)] mb-6">
                                RCI Reg. No. A12945
                            </p>

                            <p className="text-[var(--neutral-600)] leading-relaxed max-w-2xl mx-auto">
                                With extensive training in clinical psychology and a passion for mental health advocacy,
                                Shiwani brings warmth, expertise, and dedication to every therapeutic relationship.
                                Her approach combines evidence-based techniques with genuine compassion to help clients
                                achieve meaningful and lasting change.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
