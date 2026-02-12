'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Loader2, Upload, Plus, Trash2, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { generateAvailabilityFromHours, formatTimeSlot } from '@/lib/scheduling/availability';
import { doc as firestoreDoc, writeBatch, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';

const RECOMMENDED_TAGS = [
    'Stress', 'Anxiety', 'Depression', 'Trauma', 'Anger Management',
    'Self-Awareness', 'Mood Swings', 'Confidence', 'Relationships',
    'Grief', 'Sleep Operations', 'Personal Growth'
];

const THERAPY_MODES = ['Online', 'In-Person', 'Hybrid'];

export default function EditProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        specialization: '',
        hourlyRate: 0,
        bio: '',
        about: '',
        patientsHelped: 0,
        research: '',
        availabilitySummary: '',
        languages: [] as string[],
        qualifications: [] as string[],
        recommendedFor: [] as string[],
        therapyModes: [] as string[],
        referralLinks: [] as { name: string; url: string }[],
        testimonials: [] as { id: string; author: string; content: string; rating: number }[],
        certificates: [] as { id: string; title: string; url: string }[],
        photoUrl: '',
        workingHoursStart: '10:30',
        workingHoursEnd: '19:00',
        lunchBreakStart: '13:00'
    });

    const [newLanugage, setNewLanguage] = useState('');
    const [newQualification, setNewQualification] = useState('');
    const [newTag, setNewTag] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user) return;
        if (user.role !== 'therapist') {
            router.push('/');
            return;
        }

        const fetchProfile = async () => {
            try {
                const docRef = doc(db, 'therapists', user.id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setFormData(prev => ({ ...prev, ...docSnap.data() }));
                } else {
                    // Pre-fill name from auth if doc doesn't exist
                    setFormData(prev => ({ ...prev, name: user.name || '' }));
                }
            } catch (error) {
                console.error('Error details:', error);
                toast.error('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user, router]);

    // Helper to compress image to Base64
    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 500;
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;

                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // Compress to JPEG at 0.7 quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(dataUrl);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        try {
            const loadingToast = toast.loading('Processing photo...');

            // Convert to Base64 (max 500px wide)
            const base64Image = await compressImage(file);
            console.log("Image compressed, size:", base64Image.length);

            // Update state
            setFormData(prev => ({ ...prev, photoUrl: base64Image }));

            // Save directly to Firestore (User Collection)
            console.log("Saving to Firestore...");
            const docRef = doc(db, 'therapists', user.id);
            await updateDoc(docRef, {
                photoUrl: base64Image,
                updatedAt: new Date()
            });
            console.log("Firestore updated!");

            toast.dismiss(loadingToast);
            toast.success('Photo updated successfully!');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to process photo');
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const docRef = doc(db, 'therapists', user.id);
            // Use setDoc with merge to ensure document exists
            await setDoc(docRef, {
                ...formData,
                isEnabled: true, // Auto-enable if disabled
                updatedAt: new Date()
            }, { merge: true });

            // Regenerate Availability
            try {
                const newAvailability = generateAvailabilityFromHours(
                    user.id,
                    formData.workingHoursStart || '10:30',
                    formData.workingHoursEnd || '19:00',
                    formData.lunchBreakStart || '13:00'
                );

                // 1. Delete existing availability
                const availabilityRef = collection(db, 'availability');
                const q = query(availabilityRef, where('therapistId', '==', user.id));
                const querySnapshot = await getDocs(q);

                const batch = writeBatch(db);
                querySnapshot.forEach((doc) => {
                    batch.delete(doc.ref);
                });

                // 2. Add new availability
                newAvailability.forEach((slot) => {
                    const newDocRef = doc(availabilityRef, slot.id); // Use ID from generator
                    batch.set(newDocRef, slot);
                });

                await batch.commit();
                console.log('Availability regenerated successfully');

            } catch (availError) {
                console.error('Error updating availability:', availError);
                toast.error('Profile saved, but schedule update failed.');
            }

            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    // Helper functions for array fields
    const toggleArrayItem = (field: keyof typeof formData, item: string) => {
        setFormData(prev => {
            const array = prev[field] as string[];
            return {
                ...prev,
                [field]: array.includes(item)
                    ? array.filter(i => i !== item)
                    : [...array, item]
            };
        });
    };

    const addArrayItem = (field: keyof typeof formData, item: string) => {
        if (!item.trim()) return;
        setFormData(prev => ({
            ...prev,
            [field]: [...(prev[field] as string[]), item.trim()]
        }));
    };

    const removeArrayItem = (field: keyof typeof formData, index: number) => {
        setFormData(prev => ({
            ...prev,
            [field]: (prev[field] as any[]).filter((_, i) => i !== index)
        }));
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--warm-50)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-600)]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--warm-50)]">
            <Header />
            <div className="max-w-4xl mx-auto px-4 py-8 pt-24">

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-serif text-[var(--primary-800)]">Edit Profile</h1>
                        <p className="text-[var(--neutral-600)]">Manage your professional presence</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>

                <div className="space-y-6">
                    {/* 1. Basic Info & Photo */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border)]">
                        <h2 className="text-xl font-serif text-[var(--primary-700)] mb-4">Basic Information</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Photo Upload */}
                            <div className="col-span-1 flex flex-col items-center">
                                <div className="w-32 h-32 rounded-full overflow-hidden bg-[var(--primary-100)] mb-4 relative group">
                                    {formData.photoUrl ? (
                                        <img src={formData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[var(--primary-400)]">
                                            <Upload className="w-8 h-8" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-white text-xs font-medium"
                                        >
                                            Change Photo
                                        </button>
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>

                            {/* Basic Fields */}
                            <div className="col-span-2 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="input w-full"
                                            placeholder="Dr. Start Lastname"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">Hourly Rate (₹)</label>
                                        <input
                                            type="number"
                                            value={formData.hourlyRate}
                                            onChange={e => setFormData({ ...formData, hourlyRate: parseInt(e.target.value) || 0 })}
                                            className="input w-full"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">Specialization</label>
                                    <input
                                        type="text"
                                        value={formData.specialization}
                                        onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                                        className="input w-full"
                                        placeholder="e.g. Clinical Psychologist"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Bio & About */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border)]">
                        <h2 className="text-xl font-serif text-[var(--primary-700)] mb-4">About You</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">Short Bio (Card Preview)</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    className="input w-full h-20 resize-none"
                                    placeholder="Brief introduction for the therapist card (2-3 lines)."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">Detailed About Section</label>
                                <RichTextEditor
                                    value={formData.about}
                                    onChange={(val: string) => setFormData({ ...formData, about: val })}
                                    placeholder="Share your journey, philosophy, and what clients can expect."
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. Stats & Research */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border)]">
                        <h2 className="text-xl font-serif text-[var(--primary-700)] mb-4">Professional Impact</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">Patients Helped (Approx)</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={formData.patientsHelped}
                                    onChange={e => setFormData({ ...formData, patientsHelped: Math.max(0, parseInt(e.target.value) || 0) })}
                                    className="input w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">Research / Dissertation Topic</label>
                                <RichTextEditor
                                    value={formData.research}
                                    onChange={(val: string) => setFormData({ ...formData, research: val })}
                                    placeholder="e.g. Impact of CBT on Anxiety..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* 4. Recommend Me For */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border)]">
                        <h2 className="text-xl font-serif text-[var(--primary-700)] mb-4">Recommend Me For</h2>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {RECOMMENDED_TAGS.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => toggleArrayItem('recommendedFor', tag)}
                                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${(formData.recommendedFor || []).includes(tag)
                                        ? 'bg-[var(--primary-100)] border-[var(--primary-500)] text-[var(--primary-700)]'
                                        : 'bg-white border-[var(--neutral-200)] text-[var(--neutral-600)] hover:bg-[var(--warm-50)]'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newTag}
                                onChange={e => setNewTag(e.target.value)}
                                className="input flex-1"
                                placeholder="Add custom tag..."
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        addArrayItem('recommendedFor', newTag);
                                        setNewTag('');
                                    }
                                }}
                            />
                            <button
                                onClick={() => {
                                    addArrayItem('recommendedFor', newTag);
                                    setNewTag('');
                                }}
                                className="btn btn-secondary"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* 5. Qualifications & Languages */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border)]">
                            <h2 className="text-xl font-serif text-[var(--primary-700)] mb-4">Qualifications</h2>
                            <ul className="mb-4 space-y-2 max-h-40 overflow-y-auto">
                                {(formData.qualifications || []).map((qual, idx) => (
                                    <li key={idx} className="flex justify-between items-center bg-[var(--warm-50)] p-2 rounded">
                                        <span className="text-sm">{qual}</span>
                                        <button onClick={() => removeArrayItem('qualifications', idx)} className="text-red-500 hover:text-red-700">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newQualification}
                                    onChange={e => setNewQualification(e.target.value)}
                                    className="input flex-1"
                                    placeholder="Add qualification..."
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            addArrayItem('qualifications', newQualification);
                                            setNewQualification('');
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        addArrayItem('qualifications', newQualification);
                                        setNewQualification('');
                                    }}
                                    className="btn btn-secondary"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border)]">
                            <h2 className="text-xl font-serif text-[var(--primary-700)] mb-4">Languages</h2>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {(formData.languages || []).map((lang, idx) => (
                                    <span key={idx} className="bg-[var(--primary-50)] text-[var(--primary-700)] px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                        {lang}
                                        <button onClick={() => removeArrayItem('languages', idx)} className="hover:text-red-600">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newLanugage}
                                    onChange={e => setNewLanguage(e.target.value)}
                                    className="input flex-1"
                                    placeholder="Add language..."
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            addArrayItem('languages', newLanugage);
                                            setNewLanguage('');
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        addArrayItem('languages', newLanugage);
                                        setNewLanguage('');
                                    }}
                                    className="btn btn-secondary"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 6. Availability & Review */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border)]">
                        <h2 className="text-xl font-serif text-[var(--primary-700)] mb-4">Logistics</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-2">Therapy Modes</label>
                                <div className="flex gap-4">
                                    {THERAPY_MODES.map(mode => (
                                        <label key={mode} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={(formData.therapyModes || []).includes(mode)}
                                                onChange={() => toggleArrayItem('therapyModes', mode)}
                                                className="rounded border-[var(--primary-300)] text-[var(--primary-600)] focus:ring-[var(--primary-500)]"
                                            />
                                            <span className="text-sm text-[var(--neutral-700)]">{mode}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">Availability Summary</label>
                                <input
                                    type="text"
                                    value={formData.availabilitySummary}
                                    onChange={e => setFormData({ ...formData, availabilitySummary: e.target.value })}
                                    className="input w-full"
                                    placeholder="e.g. Mon-Fri, 9:00 AM - 5:00 PM EST"
                                />
                            </div>

                            <div className="border-t border-[var(--neutral-200)] pt-4 mt-4">
                                <h3 className="text-md font-medium text-[var(--primary-800)] mb-3">Working Hours (Mon-Sat)</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--neutral-600)] mb-1">Start Time</label>
                                        <select
                                            value={formData.workingHoursStart}
                                            onChange={e => setFormData({ ...formData, workingHoursStart: e.target.value })}
                                            className="input w-full text-sm"
                                        >
                                            {Array.from({ length: 24 }).flatMap((_, i) => [
                                                `${i.toString().padStart(2, '0')}:00`,
                                                `${i.toString().padStart(2, '0')}:30`
                                            ]).map(time => (
                                                <option key={time} value={time}>{formatTimeSlot(time)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--neutral-600)] mb-1">End Time</label>
                                        <select
                                            value={formData.workingHoursEnd}
                                            onChange={e => setFormData({ ...formData, workingHoursEnd: e.target.value })}
                                            className="input w-full text-sm"
                                        >
                                            {Array.from({ length: 24 }).flatMap((_, i) => [
                                                `${i.toString().padStart(2, '0')}:00`,
                                                `${i.toString().padStart(2, '0')}:30`
                                            ]).map(time => (
                                                <option key={time} value={time}>{formatTimeSlot(time)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--neutral-600)] mb-1">Lunch Start (1 Hr)</label>
                                        <select
                                            value={formData.lunchBreakStart}
                                            onChange={e => setFormData({ ...formData, lunchBreakStart: e.target.value })}
                                            className="input w-full text-sm"
                                        >
                                            {Array.from({ length: 24 }).flatMap((_, i) => [
                                                `${i.toString().padStart(2, '0')}:00`,
                                                `${i.toString().padStart(2, '0')}:30`
                                            ]).map(time => (
                                                <option key={time} value={time}>{formatTimeSlot(time)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <p className="text-xs text-[var(--neutral-500)] mt-2">
                                    * This schedule will be applied to Monday through Saturday. Sunday is off.
                                    <br />
                                    * A 1-hour lunch break is automatically included starting at the selected time.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 7. Certificates */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border)]">
                        <h2 className="text-xl font-serif text-[var(--primary-700)] mb-4">Certificates & Credentials</h2>
                        <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                {(formData.certificates || []).map((cert, index) => (
                                    <div key={cert.id} className="relative group border border-[var(--neutral-200)] rounded-lg p-2 flex items-center gap-3 bg-[var(--neutral-50)]">
                                        <img src={cert.url} alt={cert.title} className="w-16 h-12 object-cover rounded border border-[var(--neutral-200)]" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-[var(--primary-800)] truncate">{cert.title}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newCerts = [...(formData.certificates || [])];
                                                newCerts.splice(index, 1);
                                                setFormData({ ...formData, certificates: newCerts });
                                            }}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {(formData.certificates?.length || 0) < 3 && (
                                <div className="border-2 border-dashed border-[var(--neutral-300)] rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-[var(--primary-400)] transition-colors bg-[var(--neutral-50)]">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            try {
                                                const toastId = toast.loading('Processing certificate...');
                                                const base64 = await compressImage(file);
                                                const title = prompt('Enter certificate name (e.g. "PhD in Psychology")');
                                                if (!title) {
                                                    toast.dismiss(toastId);
                                                    return;
                                                }
                                                const newCert = { id: Date.now().toString(), title, url: base64 };
                                                setFormData(prev => ({
                                                    ...prev,
                                                    certificates: [...(prev.certificates || []), newCert]
                                                }));
                                                toast.success('Certificate added!', { id: toastId });
                                            } catch (err) {
                                                toast.error('Failed to process image');
                                                console.error(err);
                                            }
                                        }}
                                        className="hidden"
                                        id="cert-upload"
                                    />
                                    <label htmlFor="cert-upload" className="cursor-pointer flex flex-col items-center">
                                        <Upload className="w-8 h-8 text-[var(--neutral-400)] mb-2" />
                                        <span className="text-sm font-medium text-[var(--neutral-600)]">Upload Certificate Image</span>
                                        <span className="text-xs text-[var(--neutral-400)] mt-1">Max 3 images (JPG/PNG)</span>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 8. Testimonials */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border)]">
                        <h2 className="text-xl font-serif text-[var(--primary-700)] mb-4">Client Testimonials</h2>
                        <div className="space-y-4">
                            {(formData.testimonials || []).map((t, idx) => (
                                <div key={idx} className="bg-[var(--warm-50)] p-4 rounded-lg relative group">
                                    <button
                                        onClick={() => removeArrayItem('testimonials', idx)}
                                        className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <div className="grid grid-cols-2 gap-4 mb-2">
                                        <input
                                            type="text"
                                            value={t.author}
                                            onChange={e => {
                                                const newT = [...(formData.testimonials || [])];
                                                newT[idx].author = e.target.value;
                                                setFormData({ ...formData, testimonials: newT });
                                            }}
                                            className="input text-sm"
                                            placeholder="Client Name/Initials"
                                        />
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-[var(--neutral-600)]">Rating:</span>
                                            <select
                                                value={t.rating}
                                                onChange={e => {
                                                    const newT = [...(formData.testimonials || [])];
                                                    newT[idx].rating = parseInt(e.target.value);
                                                    setFormData({ ...formData, testimonials: newT });
                                                }}
                                                className="input text-sm w-20"
                                            >
                                                {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} ★</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <textarea
                                        value={t.content}
                                        onChange={e => {
                                            const newT = [...(formData.testimonials || [])];
                                            newT[idx].content = e.target.value;
                                            setFormData({ ...formData, testimonials: newT });
                                        }}
                                        className="input w-full text-sm h-20 resize-none"
                                        placeholder="Testimonial content..."
                                    />
                                </div>
                            ))}
                            <button
                                onClick={() => setFormData({
                                    ...formData,
                                    testimonials: [...(formData.testimonials || []), { id: Date.now().toString(), author: '', rating: 5, content: '' }]
                                })}
                                className="text-sm text-[var(--primary-600)] font-medium hover:underline flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" /> Add Testimonial
                            </button>
                        </div>
                    </div>

                    {/* 8. Referral Links */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-[var(--border)]">
                        <h2 className="text-xl font-serif text-[var(--primary-700)] mb-4">External Links</h2>
                        <div className="space-y-4">
                            {(formData.referralLinks || []).map((link, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={link.name}
                                        onChange={e => {
                                            const newLinks = [...(formData.referralLinks || [])];
                                            newLinks[idx].name = e.target.value;
                                            setFormData({ ...formData, referralLinks: newLinks });
                                        }}
                                        className="input flex-1"
                                        placeholder="Link Name"
                                    />
                                    <input
                                        type="text"
                                        value={link.url}
                                        onChange={e => {
                                            const newLinks = [...(formData.referralLinks || [])];
                                            newLinks[idx].url = e.target.value;
                                            setFormData({ ...formData, referralLinks: newLinks });
                                        }}
                                        className="input flex-1"
                                        placeholder="URL"
                                    />
                                    <button
                                        onClick={() => removeArrayItem('referralLinks', idx)}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => setFormData({
                                    ...formData,
                                    referralLinks: [...(formData.referralLinks || []), { name: '', url: '' }]
                                })}
                                className="text-sm text-[var(--primary-600)] font-medium hover:underline flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" /> Add Link
                            </button>
                        </div>
                    </div>

                </div>
            </div>
            <Footer />
        </div>
    );
}
