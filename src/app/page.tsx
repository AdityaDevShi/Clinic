'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  User,
  Users,
  Heart,
  ClipboardList,
  Shield,
  Leaf,
  Award,
  Phone,
  Mail,
  MapPin,
  ArrowRight
} from 'lucide-react';

// Animation variants
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
    icon: User,
    title: 'Individual Therapy',
    description: 'Support for anxiety, depression, stress, and personal growth.',
  },
  {
    icon: Heart,
    title: 'Child & Adolescent Therapy',
    description: 'Helping young minds navigate challenges and emotions.',
  },
  {
    icon: Users,
    title: 'Couples Counseling',
    description: 'Improving communication and relationship harmony.',
  },
  {
    icon: ClipboardList,
    title: 'Training & Supervision',
    description: 'Professional training and supervision for psychology interns and students.',
  },
];

const whyChooseUs = [
  {
    icon: Award,
    title: 'Experienced Care',
    description: 'RCI Licensed Clinical Psychologist.',
  },
  {
    icon: Shield,
    title: 'Confidential & Safe',
    description: 'Secure and private online sessions.',
  },
  {
    icon: Leaf,
    title: 'Holistic Approach',
    description: 'Tailored therapies for mind well-being.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-20 md:pt-24 min-h-[85vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(253,252,250,0.85)] via-[rgba(253,252,250,0.8)] to-[rgba(245,240,232,0.95)]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h1
              variants={fadeInUp}
              className="font-serif text-4xl md:text-5xl lg:text-6xl text-[var(--primary-700)] mb-4"
            >
              Arambh <span className="font-normal text-[var(--primary-600)]">Mental Health Centre</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-[var(--neutral-600)] mb-8 italic"
            >
              A New Beginning for Your Mind
            </motion.p>

            <motion.div variants={fadeInUp}>
              <Link
                href="/therapists"
                className="inline-flex items-center justify-center px-8 py-4 bg-[var(--secondary-500)] text-white rounded-lg hover:bg-[var(--secondary-600)] transition-all duration-300 text-lg font-medium shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                Book an Appointment
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--warm-50)] to-transparent" />
      </section>

      {/* About Section */}
      <section className="py-16 md:py-24 bg-[var(--warm-50)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="font-serif text-3xl md:text-4xl text-[var(--primary-700)] mb-4"
            >
              About Us
            </motion.h2>

            <motion.div variants={fadeInUp} className="section-divider mb-8" />

            <motion.p
              variants={fadeInUp}
              className="text-[var(--neutral-600)] leading-relaxed text-lg"
            >
              Welcome to <strong className="text-[var(--primary-600)]">Arambh Mental Health Centre</strong>.
              Led by RCI Registered Clinical Psychologist, <strong className="text-[var(--primary-600)]">Shiwani Kohli</strong>
              {' '}(RCI Reg. No. A12945), we provide compassionate and confidential psychological support
              to help individuals find clarity and emotional balance.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.h2
              variants={fadeInUp}
              className="font-serif text-3xl md:text-4xl text-[var(--primary-700)] mb-4"
            >
              Our Services
            </motion.h2>
            <motion.div variants={fadeInUp} className="section-divider" />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
          >
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                variants={fadeInUp}
                className="card p-6 md:p-8 text-center hover-lift group"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-[var(--warm-100)] rounded-full flex items-center justify-center group-hover:bg-[var(--primary-100)] transition-colors duration-300">
                  <service.icon className="w-8 h-8 text-[var(--primary-500)]" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-[var(--primary-700)] mb-2">
                  {service.title}
                </h3>
                <p className="text-[var(--neutral-500)] text-sm leading-relaxed">
                  {service.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mt-10"
          >
            <Link
              href="/services"
              className="inline-flex items-center text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium group"
            >
              View All Services
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* When Should You See a Clinical Psychologist? Section - Placed after About Us */}
      <section className="py-16 md:py-24 bg-white relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary-50)] rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="font-serif text-3xl md:text-4xl text-[var(--primary-700)] mb-6 leading-tight"
            >
              When Should You See a <br className="hidden md:block" /> Clinical Psychologist?
            </motion.h2>
            <motion.div variants={fadeInUp} className="section-divider mb-8" />
            <motion.p
              variants={fadeInUp}
              className="text-lg text-[var(--neutral-600)] max-w-3xl mx-auto"
            >
              Clinical psychologists can help manage emotional, behavioral, and cognitive difficulties.
              Seeking professional support is a sign of strength, not weakness.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Emotional and Behavioral Signs */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeInUp}
              className="bg-[var(--warm-50)] rounded-2xl p-8 hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mr-4">
                  <Heart className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[var(--primary-800)]">
                  Emotional & Behavioral
                </h3>
              </div>
              <ul className="space-y-3 pl-2">
                {[
                  'Feeling persistently sad, anxious, or irritable',
                  'Having panic attacks, excessive fears, or phobias',
                  'Struggling with obsessive thoughts or repeated behaviors',
                  'Sudden changes in mood or personality',
                  'Feeling overwhelmed, stressed, or burnt out',
                  'Unexplained physical symptoms (psychosomatic)'
                ].map((item, i) => (
                  <li key={i} className="flex items-start text-[var(--neutral-700)]">
                    <span className="w-1.5 h-1.5 bg-rose-400 rounded-full mt-2.5 mr-3 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Cognitive and Thinking Difficulties */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeInUp}
              className="bg-[var(--warm-50)] rounded-2xl p-8 hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[var(--primary-800)]">
                  Cognitive & Thinking
                </h3>
              </div>
              <ul className="space-y-3 pl-2">
                {[
                  'Trouble remembering things or staying focused',
                  'Difficulty concentrating or completing tasks (ADHD)',
                  'Confusion, difficulty finding words, or disorientation',
                  'Decline in school or work performance',
                  'Thinking/planning struggles after stroke or brain injury'
                ].map((item, i) => (
                  <li key={i} className="flex items-start text-[var(--neutral-700)]">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2.5 mr-3 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Developmental and Social Concerns */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeInUp}
              className="bg-[var(--warm-50)] rounded-2xl p-8 hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <Leaf className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[var(--primary-800)]">
                  Developmental (Child/Teen)
                </h3>
              </div>
              <ul className="space-y-3 pl-2">
                {[
                  'Signs of autism or social interaction challenges',
                  'Learning difficulties in reading, writing, or math',
                  'Withdrawing from friends, family, or school',
                  'Trouble adjusting to env/routine changes'
                ].map((item, i) => (
                  <li key={i} className="flex items-start text-[var(--neutral-700)]">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2.5 mr-3 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Life and Relationship Challenges */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeInUp}
              className="bg-[var(--warm-50)] rounded-2xl p-8 hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                  <Users className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[var(--primary-800)]">
                  Life & Relationships
                </h3>
              </div>
              <ul className="space-y-3 pl-2">
                {[
                  'Coping with grief, separation, or major changes',
                  'Marital or relationship issues',
                  'Difficulty managing emotions in relationships',
                  'Feeling lost, unmotivated, or unsure of direction'
                ].map((item, i) => (
                  <li key={i} className="flex items-start text-[var(--neutral-700)]">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2.5 mr-3 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 md:py-24 gradient-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.h2
              variants={fadeInUp}
              className="font-serif text-3xl md:text-4xl text-[var(--primary-700)] mb-4"
            >
              Why Choose Us
            </motion.h2>
            <motion.div variants={fadeInUp} className="section-divider" />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
          >
            {whyChooseUs.map((item) => (
              <motion.div
                key={item.title}
                variants={fadeInUp}
                className="bg-white rounded-xl p-6 md:p-8 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 mx-auto mb-4 bg-[var(--primary-50)] rounded-full flex items-center justify-center">
                  <item.icon className="w-7 h-7 text-[var(--primary-500)]" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-[var(--primary-700)] mb-2">
                  {item.title}
                </h3>
                <p className="text-[var(--neutral-500)] text-sm">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="font-serif text-3xl md:text-4xl text-[var(--primary-700)] mb-4"
            >
              Contact Us
            </motion.h2>

            <motion.div variants={fadeInUp} className="section-divider mb-8" />

            <motion.p
              variants={fadeInUp}
              className="text-[var(--neutral-600)] mb-10"
            >
              We&apos;re here to help. Get in touch to book an appointment.
            </motion.p>

            <motion.div
              variants={staggerContainer}
              className="flex flex-wrap justify-center gap-8 md:gap-12"
            >
              <motion.a
                variants={fadeInUp}
                href="tel:+917075829856"
                className="flex items-center space-x-2 text-[var(--neutral-600)] hover:text-[var(--primary-600)] transition-colors"
              >
                <Phone className="w-5 h-5 text-[var(--primary-500)]" />
                <span>+91 7075829856</span>
              </motion.a>

              <motion.a
                variants={fadeInUp}
                href="mailto:care@arambh.net"
                className="flex items-center space-x-2 text-[var(--neutral-600)] hover:text-[var(--primary-600)] transition-colors"
              >
                <Mail className="w-5 h-5 text-[var(--primary-500)]" />
                <span>care@arambh.net</span>
              </motion.a>

              <motion.div
                variants={fadeInUp}
                className="flex items-center space-x-2 text-[var(--neutral-600)]"
              >
                <MapPin className="w-5 h-5 text-[var(--primary-500)]" />
                <span className="flex items-center">
                  Online Services Available
                  <span className="ml-2 status-online" />
                </span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
