'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Phone, Mail, MapPin, Clock, Send, Loader2 } from 'lucide-react';

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

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate form submission
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setSubmitted(true);
        setIsSubmitting(false);
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    };

    return (
        <div className="min-h-screen">
            <Header />

            {/* Hero Section */}
            <section className="pt-24 md:pt-32 pb-12 md:pb-16 bg-gradient-to-b from-[var(--warm-100)] to-[var(--warm-50)]">
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
                            Contact Us
                        </motion.h1>
                        <motion.div variants={fadeInUp} className="section-divider mb-6" />
                        <motion.p
                            variants={fadeInUp}
                            className="text-lg text-[var(--neutral-600)] max-w-2xl mx-auto"
                        >
                            We&apos;re here to help. Reach out to us for appointments, inquiries, or just to say hello.
                        </motion.p>
                    </motion.div>
                </div>
            </section>

            {/* Contact Content */}
            <section className="py-12 md:py-20 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
                        {/* Contact Info */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                        >
                            <motion.h2
                                variants={fadeInUp}
                                className="font-serif text-2xl md:text-3xl text-[var(--primary-700)] mb-6"
                            >
                                Get in Touch
                            </motion.h2>

                            <motion.p
                                variants={fadeInUp}
                                className="text-[var(--neutral-600)] mb-8"
                            >
                                Whether you have questions about our services or want to schedule an appointment,
                                we&apos;re here to help you on your journey to mental wellness.
                            </motion.p>

                            <motion.div variants={staggerContainer} className="space-y-6">
                                <motion.a
                                    variants={fadeInUp}
                                    href="tel:+919876543210"
                                    className="flex items-start space-x-4 group"
                                >
                                    <div className="w-12 h-12 bg-[var(--primary-50)] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--primary-100)] transition-colors">
                                        <Phone className="w-5 h-5 text-[var(--primary-600)]" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-[var(--neutral-700)] mb-1">Phone</h3>
                                        <p className="text-[var(--neutral-600)]">+91 98765 43210</p>
                                    </div>
                                </motion.a>

                                <motion.a
                                    variants={fadeInUp}
                                    href="mailto:info@arambhmentalhealth.com"
                                    className="flex items-start space-x-4 group"
                                >
                                    <div className="w-12 h-12 bg-[var(--primary-50)] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--primary-100)] transition-colors">
                                        <Mail className="w-5 h-5 text-[var(--primary-600)]" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-[var(--neutral-700)] mb-1">Email</h3>
                                        <p className="text-[var(--neutral-600)]">info@arambhmentalhealth.com</p>
                                    </div>
                                </motion.a>

                                <motion.div
                                    variants={fadeInUp}
                                    className="flex items-start space-x-4"
                                >
                                    <div className="w-12 h-12 bg-[var(--primary-50)] rounded-xl flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-5 h-5 text-[var(--primary-600)]" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-[var(--neutral-700)] mb-1">Location</h3>
                                        <p className="text-[var(--neutral-600)]">
                                            Online Services Available<br />
                                            <span className="flex items-center mt-1">
                                                <span className="status-online mr-2" />
                                                Available Now
                                            </span>
                                        </p>
                                    </div>
                                </motion.div>

                                <motion.div
                                    variants={fadeInUp}
                                    className="flex items-start space-x-4"
                                >
                                    <div className="w-12 h-12 bg-[var(--primary-50)] rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-5 h-5 text-[var(--primary-600)]" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-[var(--neutral-700)] mb-1">Working Hours</h3>
                                        <p className="text-[var(--neutral-600)]">
                                            Mon - Fri: 9:00 AM - 7:00 PM<br />
                                            Saturday: 10:00 AM - 4:00 PM<br />
                                            Sunday: Closed
                                        </p>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </motion.div>

                        {/* Contact Form */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeInUp}
                        >
                            <div className="bg-[var(--warm-50)] rounded-2xl p-6 md:p-8">
                                <h2 className="font-serif text-2xl text-[var(--primary-700)] mb-6">
                                    Send Us a Message
                                </h2>

                                {submitted ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-12"
                                    >
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Send className="w-8 h-8 text-green-600" />
                                        </div>
                                        <h3 className="font-serif text-xl text-[var(--primary-700)] mb-2">
                                            Message Sent!
                                        </h3>
                                        <p className="text-[var(--neutral-600)] mb-6">
                                            Thank you for reaching out. We&apos;ll get back to you soon.
                                        </p>
                                        <button
                                            onClick={() => setSubmitted(false)}
                                            className="text-[var(--secondary-600)] hover:text-[var(--secondary-700)] font-medium"
                                        >
                                            Send Another Message
                                        </button>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        <div className="grid sm:grid-cols-2 gap-5">
                                            <div>
                                                <label htmlFor="name" className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                                                    Name
                                                </label>
                                                <input
                                                    id="name"
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="input bg-white"
                                                    placeholder="Your name"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="email" className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                                                    Email
                                                </label>
                                                <input
                                                    id="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="input bg-white"
                                                    placeholder="you@example.com"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-5">
                                            <div>
                                                <label htmlFor="phone" className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                                                    Phone (Optional)
                                                </label>
                                                <input
                                                    id="phone"
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className="input bg-white"
                                                    placeholder="+91 98765 43210"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="subject" className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                                                    Subject
                                                </label>
                                                <select
                                                    id="subject"
                                                    value={formData.subject}
                                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                    className="input bg-white"
                                                    required
                                                >
                                                    <option value="">Select a topic</option>
                                                    <option value="appointment">Book Appointment</option>
                                                    <option value="inquiry">General Inquiry</option>
                                                    <option value="services">Services Information</option>
                                                    <option value="feedback">Feedback</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="message" className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                                                Message
                                            </label>
                                            <textarea
                                                id="message"
                                                value={formData.message}
                                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                className="input bg-white min-h-[120px] resize-none"
                                                placeholder="How can we help you?"
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full btn btn-primary py-3 disabled:opacity-50"
                                        >
                                            {isSubmitting ? (
                                                <span className="flex items-center justify-center">
                                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                    Sending...
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center">
                                                    <Send className="w-5 h-5 mr-2" />
                                                    Send Message
                                                </span>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
