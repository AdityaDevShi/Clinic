'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Therapist } from '@/types';
import {
    ArrowLeft,
    Search,
    Plus,
    Edit2,
    Trash2,
    Power,
    Loader2,
    User,
    X
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

// Demo therapists
const demoTherapists: Therapist[] = [
    {
        id: '1',
        name: 'Dr. Shiwani Kohli',
        email: 'shiwani@arambhmentalhealth.com',
        specialization: 'Clinical Psychology',
        bio: 'RCI Registered Clinical Psychologist with expertise in anxiety, depression, and trauma therapy.',
        isOnline: true,
        isEnabled: true,
        hourlyRate: 2500,
        lastOnline: new Date(),
        qualifications: ['M.Phil Clinical Psychology', 'RCI Registered'],
        languages: ['English', 'Hindi'],
    },
    {
        id: '2',
        name: 'Dr. Priya Sharma',
        email: 'priya@arambhmentalhealth.com',
        specialization: 'Child & Adolescent Psychology',
        bio: 'Specialized in working with children and teenagers facing emotional and developmental challenges.',
        isOnline: true,
        isEnabled: true,
        hourlyRate: 2000,
        lastOnline: new Date(),
        qualifications: ['Ph.D. Child Psychology'],
        languages: ['English', 'Hindi', 'Punjabi'],
    },
    {
        id: '3',
        name: 'Dr. Rahul Verma',
        email: 'rahul@arambhmentalhealth.com',
        specialization: 'Couples & Family Therapy',
        bio: 'Expert in relationship counseling and family dynamics.',
        isOnline: false,
        isEnabled: true,
        hourlyRate: 3500,
        lastOnline: new Date(Date.now() - 3600000),
        qualifications: ['M.A. Psychology', 'Certified Couples Therapist'],
        languages: ['English', 'Hindi'],
    },
];

interface TherapistFormData {
    name: string;
    email: string;
    specialization: string;
    bio: string;
    hourlyRate: number;
    qualifications: string;
    languages: string;
}

export default function AdminTherapistsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [therapists, setTherapists] = useState<Therapist[]>(demoTherapists);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState<TherapistFormData>({
        name: '',
        email: '',
        specialization: '',
        bio: '',
        hourlyRate: 2000,
        qualifications: '',
        languages: '',
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (!authLoading && user && user.role !== 'admin') {
            router.push('/');
            return;
        }

        async function fetchTherapists() {
            try {
                const therapistsQuery = query(collection(db, 'therapists'));
                const therapistsDocs = await getDocs(therapistsQuery);

                if (!therapistsDocs.empty) {
                    const fetchedTherapists = therapistsDocs.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                        lastOnline: doc.data().lastOnline?.toDate() || new Date(),
                    })) as Therapist[];
                    setTherapists(fetchedTherapists);
                }
            } catch (error) {
                console.log('Using demo therapists:', error);
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchTherapists();
        }
    }, [user, authLoading, router]);

    const toggleTherapistStatus = async (therapist: Therapist) => {
        try {
            await updateDoc(doc(db, 'therapists', therapist.id), {
                isEnabled: !therapist.isEnabled,
            });
            setTherapists((prev) =>
                prev.map((t) =>
                    t.id === therapist.id ? { ...t, isEnabled: !t.isEnabled } : t
                )
            );
        } catch (error) {
            console.log('Error updating therapist:', error);
            // Update locally anyway for demo
            setTherapists((prev) =>
                prev.map((t) =>
                    t.id === therapist.id ? { ...t, isEnabled: !t.isEnabled } : t
                )
            );
        }
    };

    const handleAddTherapist = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const newTherapist = {
                name: formData.name,
                email: formData.email,
                specialization: formData.specialization,
                bio: formData.bio,
                hourlyRate: formData.hourlyRate,
                qualifications: formData.qualifications.split(',').map((q) => q.trim()),
                languages: formData.languages.split(',').map((l) => l.trim()),
                isOnline: false,
                isEnabled: true,
                lastOnline: new Date(),
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, 'therapists'), newTherapist);

            setTherapists((prev) => [
                ...prev,
                { ...newTherapist, id: docRef.id, lastOnline: new Date() } as Therapist,
            ]);

            setShowAddModal(false);
            setFormData({
                name: '',
                email: '',
                specialization: '',
                bio: '',
                hourlyRate: 2000,
                qualifications: '',
                languages: '',
            });
        } catch (error) {
            console.log('Error adding therapist:', error);
            // Add locally for demo
            const newId = `demo_${Date.now()}`;
            setTherapists((prev) => [
                ...prev,
                {
                    id: newId,
                    name: formData.name,
                    email: formData.email,
                    specialization: formData.specialization,
                    bio: formData.bio,
                    hourlyRate: formData.hourlyRate,
                    qualifications: formData.qualifications.split(',').map((q) => q.trim()),
                    languages: formData.languages.split(',').map((l) => l.trim()),
                    isOnline: false,
                    isEnabled: true,
                    lastOnline: new Date(),
                },
            ]);
            setShowAddModal(false);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredTherapists = therapists.filter((t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--warm-50)]">
                <Loader2 className="w-8 h-8 text-[var(--primary-500)] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 py-24 px-4 bg-gradient-to-b from-[var(--warm-100)] to-[var(--warm-50)]">
                <div className="max-w-5xl mx-auto">
                    <Link
                        href="/admin/dashboard"
                        className="inline-flex items-center text-sm text-[var(--neutral-500)] hover:text-[var(--primary-600)] transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>

                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                    >
                        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                            <h1 className="font-serif text-3xl text-[var(--primary-700)]">
                                Manage Therapists
                            </h1>

                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--neutral-400)]" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="input pl-10 py-2 text-sm w-full sm:w-48"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="btn btn-primary py-2 px-4 text-sm flex items-center"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Therapist
                                </button>
                            </div>
                        </motion.div>

                        {/* Therapists Table */}
                        <motion.div variants={fadeInUp} className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[var(--warm-50)] border-b border-[var(--border)]">
                                        <tr>
                                            <th className="text-left py-4 px-6 text-sm font-medium text-[var(--neutral-600)]">Therapist</th>
                                            <th className="text-left py-4 px-6 text-sm font-medium text-[var(--neutral-600)]">Specialization</th>
                                            <th className="text-left py-4 px-6 text-sm font-medium text-[var(--neutral-600)]">Rate</th>
                                            <th className="text-left py-4 px-6 text-sm font-medium text-[var(--neutral-600)]">Status</th>
                                            <th className="text-right py-4 px-6 text-sm font-medium text-[var(--neutral-600)]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTherapists.map((therapist, index) => (
                                            <tr key={therapist.id} className={index !== filteredTherapists.length - 1 ? 'border-b border-[var(--border)]' : ''}>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-[var(--primary-100)] rounded-full flex items-center justify-center">
                                                            <User className="w-5 h-5 text-[var(--primary-600)]" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-[var(--neutral-700)]">{therapist.name}</p>
                                                            <p className="text-sm text-[var(--neutral-500)]">{therapist.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-sm text-[var(--neutral-600)]">
                                                    {therapist.specialization}
                                                </td>
                                                <td className="py-4 px-6 text-sm text-[var(--neutral-700)] font-medium">
                                                    ₹{therapist.hourlyRate}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${therapist.isEnabled
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-[var(--neutral-100)] text-[var(--neutral-500)]'
                                                            }`}>
                                                            {therapist.isEnabled ? 'Active' : 'Disabled'}
                                                        </span>
                                                        {therapist.isOnline && (
                                                            <span className="w-2 h-2 rounded-full bg-green-500" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => toggleTherapistStatus(therapist)}
                                                            className={`p-2 rounded-lg transition-colors ${therapist.isEnabled
                                                                ? 'hover:bg-red-50 text-red-600'
                                                                : 'hover:bg-green-50 text-green-600'
                                                                }`}
                                                            title={therapist.isEnabled ? 'Disable' : 'Enable'}
                                                        >
                                                            <Power className="w-4 h-4" />
                                                        </button>
                                                        <Link
                                                            href={`/admin/therapists/${therapist.id}`}
                                                            className="p-2 rounded-lg hover:bg-[var(--warm-50)] text-[var(--neutral-600)]"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {filteredTherapists.length === 0 && (
                                <div className="text-center py-12">
                                    <User className="w-12 h-12 text-[var(--neutral-300)] mx-auto mb-4" />
                                    <p className="text-[var(--neutral-500)]">No therapists found</p>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                </div>
            </main>

            {/* Add Therapist Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
                            <h2 className="font-serif text-xl text-[var(--primary-700)]">Add Therapist</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 hover:bg-[var(--warm-50)] rounded-lg"
                            >
                                <X className="w-5 h-5 text-[var(--neutral-500)]" />
                            </button>
                        </div>

                        <form onSubmit={handleAddTherapist} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">Specialization</label>
                                <input
                                    type="text"
                                    value={formData.specialization}
                                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">Hourly Rate (₹)</label>
                                <input
                                    type="number"
                                    value={formData.hourlyRate}
                                    onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">Bio</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    className="input min-h-[80px] resize-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                                    Qualifications (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={formData.qualifications}
                                    onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                                    className="input"
                                    placeholder="M.Phil Psychology, RCI Registered"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                                    Languages (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={formData.languages}
                                    onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                                    className="input"
                                    placeholder="English, Hindi"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 btn btn-secondary py-3"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 btn btn-primary py-3 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                    ) : (
                                        'Add Therapist'
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            <Footer />
        </div>
    );
}
