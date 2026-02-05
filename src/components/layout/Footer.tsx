import Link from 'next/link';
import { Phone, Mail, MapPin, Heart } from 'lucide-react';

const footerLinks = {
    services: [
        { label: 'Individual Therapy', href: '/services#individual' },
        { label: 'Couples Counseling', href: '/services#couples' },
        { label: 'Child & Adolescent', href: '/services#child' },
        { label: 'Training & Supervision', href: '/services#training' },
    ],
    quickLinks: [
        { label: 'About Us', href: '/about' },
        { label: 'Our Therapists', href: '/therapists' },
        { label: 'Book Appointment', href: '/therapists#book' },
        { label: 'Contact', href: '/contact' },
    ],
};

export default function Footer() {
    return (
        <footer className="bg-[var(--primary-800)] text-white">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    {/* Brand Section */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="flex items-center space-x-2 mb-4">
                            <div className="w-10 h-10 flex items-center justify-center">
                                <svg viewBox="0 0 40 40" className="w-full h-full">
                                    <path
                                        d="M20 5 C12 5 8 12 8 18 C8 28 20 35 20 35 C20 35 32 28 32 18 C32 12 28 5 20 5"
                                        fill="none"
                                        stroke="var(--primary-200)"
                                        strokeWidth="1.5"
                                    />
                                    <circle cx="20" cy="18" r="3" fill="var(--primary-200)" />
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-serif text-xl font-semibold text-white">
                                    Arambh
                                </span>
                                <span className="text-xs text-[var(--primary-300)] -mt-1">
                                    Mental Health Centre
                                </span>
                            </div>
                        </Link>
                        <p className="text-[var(--primary-200)] text-sm leading-relaxed mb-6">
                            Providing compassionate and confidential psychological support to help individuals find clarity and emotional balance.
                        </p>
                        <div className="space-y-3">
                            <a href="tel:+919876543210" className="flex items-center space-x-2 text-[var(--primary-200)] hover:text-white transition-colors text-sm">
                                <Phone className="w-4 h-4" />
                                <span>+91 98765 43210</span>
                            </a>
                            <a href="mailto:info@arambhmentalhealth.com" className="flex items-center space-x-2 text-[var(--primary-200)] hover:text-white transition-colors text-sm">
                                <Mail className="w-4 h-4" />
                                <span>info@arambhmentalhealth.com</span>
                            </a>
                            <div className="flex items-center space-x-2 text-[var(--primary-200)] text-sm">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span>Online Services Available</span>
                            </div>
                        </div>
                    </div>

                    {/* Services Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-white">Our Services</h3>
                        <ul className="space-y-3">
                            {footerLinks.services.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-[var(--primary-200)] hover:text-white transition-colors text-sm"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
                        <ul className="space-y-3">
                            {footerLinks.quickLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-[var(--primary-200)] hover:text-white transition-colors text-sm"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Hours & CTA */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-white">Working Hours</h3>
                        <div className="space-y-2 text-[var(--primary-200)] text-sm mb-6">
                            <p>Monday - Friday: 9:00 AM - 7:00 PM</p>
                            <p>Saturday: 10:00 AM - 4:00 PM</p>
                            <p>Sunday: Closed</p>
                        </div>
                        <Link
                            href="/therapists"
                            className="inline-flex items-center justify-center px-6 py-3 bg-[var(--secondary-500)] text-white rounded-lg hover:bg-[var(--secondary-600)] transition-colors text-sm font-medium"
                        >
                            Book an Appointment
                        </Link>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-[var(--primary-700)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                        <p className="text-[var(--primary-300)] text-sm text-center md:text-left">
                            © {new Date().getFullYear()} Arambh Mental Health Centre. All Rights Reserved.
                        </p>
                        <p className="text-[var(--primary-300)] text-sm flex items-center">
                            Professional <span className="mx-2">|</span> Ethical <span className="mx-2">|</span> Confidential
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
