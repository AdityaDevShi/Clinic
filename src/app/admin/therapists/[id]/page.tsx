'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Therapist } from '@/types';
import { ArrowLeft, Save, Loader2, X } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function EditTherapistPage() {
    const router = useRouter();
    const params = useParams();
    const { user, loading: authLoading } = useAuth();
    const therapistId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<Therapist>>({});

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (!authLoading && user && user.role !== 'admin') {
            router.push('/');
            return;
        }

        async function fetchTherapist() {
            try {
                if (!therapistId) return;
                const docRef = doc(db, 'therapists', therapistId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setFormData({ id: docSnap.id, ...docSnap.data() } as Therapist);
                } else {
                    console.error('Therapist not found');
                    router.push('/admin/therapists');
                }
            } catch (error) {
                console.error('Error fetching therapist:', error);
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchTherapist();
        }
    }, [user, authLoading, router, therapistId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const docRef = doc(db, 'therapists', therapistId);

            // Prepare data for update
            const updateData = {
                name: formData.name,
                email: formData.email,
                specialization: formData.specialization,
                bio: formData.bio,
                hourlyRate: Number(formData.hourlyRate),
                qualifications: typeof formData.qualifications === 'string'
                    ? (formData.qualifications as string).split(',').map((q: string) => q.trim())
                    : formData.qualifications,
                languages: typeof formData.languages === 'string'
                    ? (formData.languages as string).split(',').map((l: string) => l.trim())
                    : formData.languages,
            };

            await updateDoc(docRef, updateData);
            router.push('/admin/therapists');
        } catch (error) {
            console.error('Error updating therapist:', error);
            alert('Failed to update therapist');
        } finally {
            setSaving(false);
        }
    };

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
                <div className="max-w-3xl mx-auto">
                    <Link
                        href="/admin/therapists"
                        className="inline-flex items-center text-sm text-[var(--neutral-500)] hover:text-[var(--primary-600)] transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Therapists
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-sm overflow-hidden"
                    >
                        <div className="p-6 border-b border-[var(--border)]">
                            <h1 className="font-serif text-2xl text-[var(--primary-700)]">
                                Edit Therapist
                            </h1>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">Name</label>
                                    <input
                                        type="text"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="input"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="input"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">Specialization</label>
                                    <input
                                        type="text"
                                        value={formData.specialization || ''}
                                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                        className="input"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">Hourly Rate (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.hourlyRate || ''}
                                        onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                                        className="input"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">Bio</label>
                                <textarea
                                    value={formData.bio || ''}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    className="input min-h-[120px]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                                    Qualifications (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={Array.isArray(formData.qualifications) ? formData.qualifications.join(', ') : formData.qualifications || ''}
                                    onChange={(e) => setFormData({ ...formData, qualifications: e.target.value.split(',') })}
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
                                    Languages (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={Array.isArray(formData.languages) ? formData.languages.join(', ') : formData.languages || ''}
                                    onChange={(e) => setFormData({ ...formData, languages: e.target.value.split(',') })}
                                    className="input"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                                <Link
                                    href="/admin/therapists"
                                    className="btn btn-secondary py-2 px-6"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn btn-primary py-2 px-6 flex items-center disabled:opacity-50"
                                >
                                    {saving ? (
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
