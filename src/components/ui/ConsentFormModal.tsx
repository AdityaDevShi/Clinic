'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Check, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useAuth } from '@/contexts/AuthContext';

interface ConsentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAgree: () => void;
    clientName: string;
    clientId: string;
    therapistName: string;
}

const CONSENT_SECTIONS = [
    {
        title: 'Session Length',
        content: 'There is no specific determination on how many sessions are needed by a client/patient as this may depend on the healing progress of said client/patient and this can be discussed with your therapist.'
    },
    {
        title: 'Relationship',
        content: 'The required relationship that a client/patient should have with his/her therapist is strictly professional. Any other relationship, such as business or personal relationships a client/patient may have with a therapist may prevent or undermine the effectiveness of the treatment.'
    },
    {
        title: 'Confidentiality',
        content: `Sessions between the therapist and the client/patient are strictly confidential. Any notes taken by the therapist, audio recordings, video recordings during therapy shall be kept confidential and secure by the therapist at all times and shall not disclose it to anyone without any prior written consent by the client/patient, with exception to certain limitations by law such as:

1. Abuse to a child, disabled, elderly, other people;
2. Criminal Acts;
3. Sexual Abuse;
4. Acts which may involve the transmission of HIV/AIDS;
5. Any other instance where the therapist has a duty or he or she has a firm belief that there is a necessity to disclose.

In case you have any questions regarding confidentiality, please discuss this with your therapist.`
    },
    {
        title: 'Risks',
        content: `Through therapy clients/patients learn more about themselves that they do not realize. Often, these are things that they do not like. These are the things that they need to first, accept that they are or what they have or do. Growth cannot happen until these issues are accepted and confronted.

There may be a chance that during or after a session, the client/patient may feel emotionally or physically distressed. This is normal and should be part of one's healing process. A therapy's success shall depend both on the efforts of the therapist and the client/patient.`
    },
    {
        title: 'Advantages',
        content: `Therapy helps in making one open his or her awareness. This helps in the bringing of one's personal insights and thus finds ways of coping and addressing his or her problems.

We understand that therapies can be challenging especially for those who are not willing to open up. Uncomfortable feelings are normal and are part of the process. These frustrations and discomforts shall be lessened and clients/patients shall have a better positive outlook in managing his or her emotions. There is no firm timeline for this progress. But with working hand in hand between the client/patient and the therapist, the progress shall be faster than realized.`
    },
    {
        title: 'Court Proceedings',
        content: 'In case of a court proceeding involving the client/patient, it is agreed that the therapist cannot testify, such as but not limited to, custody proceedings, divorce proceedings, injuries, or any other lawsuits, that shall result in the disclosure of the records of the psychotherapist about his/her client/patient.'
    },
    {
        title: 'Withdrawal',
        content: 'Please note that you may withdraw anytime from the psychotherapy upon notice.'
    }
];

export default function ConsentFormModal({ isOpen, onClose, onAgree, clientName, clientId, therapistName }: ConsentFormModalProps) {
    const { firebaseUser } = useAuth();
    const [agreed, setAgreed] = useState(false);
    const [saving, setSaving] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const generateAndSavePdf = async () => {
        setSaving(true);
        try {
            // Generate PDF using jsPDF
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 20;
            const maxWidth = pageWidth - margin * 2;
            let y = 20;

            // Title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('CONSENT FORM - THERAPY', pageWidth / 2, y, { align: 'center' });
            y += 12;

            // Intro
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const intro = 'We understand that it is not easy to seek help with regard to mental health concerns. The acceptance of the need for help must come from the person seeking counseling. With this informed consent for psychotherapy, you will be able to understand more about your situation and with us, work on addressing your difficulties. Let us start by filling out this informed consent form.';
            const introLines = doc.splitTextToSize(intro, maxWidth);
            doc.text(introLines, margin, y);
            y += introLines.length * 5 + 8;

            // Sections
            for (const section of CONSENT_SECTIONS) {
                // Check if we need a new page
                if (y > 260) {
                    doc.addPage();
                    y = 20;
                }

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(section.title, margin, y);
                y += 7;

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const lines = doc.splitTextToSize(section.content, maxWidth);
                doc.text(lines, margin, y);
                y += lines.length * 5 + 8;
            }

            // Signature section
            if (y > 240) {
                doc.addPage();
                y = 20;
            }

            y += 10;
            doc.setDrawColor(100, 100, 100);
            doc.line(pageWidth - margin - 80, y, pageWidth - margin, y);
            y += 6;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Signature of the client', pageWidth - margin, y, { align: 'right' });
            y += 8;
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bolditalic');
            doc.text(clientName, pageWidth - margin, y, { align: 'right' });
            y += 8;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageWidth - margin, y, { align: 'right' });
            y += 5;
            doc.text(`Therapist: ${therapistName}`, pageWidth - margin, y, { align: 'right' });

            // Convert to base64
            const pdfBase64 = doc.output('datauristring').split(',')[1];

            // Save to backend
            const token = await firebaseUser?.getIdToken();
            const res = await fetch('/api/consent/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    clientId,
                    clientName,
                    therapistName,
                    pdfBase64,
                    agreedAt: new Date().toISOString()
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save consent');
            }

            // Success — proceed to payment
            setAgreed(false);
            onAgree();
        } catch (error: any) {
            console.error('Consent save error:', error);
            alert('Failed to save consent form. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--neutral-200)] bg-[var(--neutral-50)]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--primary-100)] flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-[var(--primary-600)]" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-serif font-semibold text-[var(--primary-800)]">Consent Form — Therapy</h2>
                                    <p className="text-xs text-[var(--neutral-500)]">Please read and agree before proceeding to payment</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                disabled={saving}
                                className="p-2 rounded-full hover:bg-[var(--neutral-200)] transition-colors disabled:opacity-50"
                            >
                                <X className="w-5 h-5 text-[var(--neutral-500)]" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-6" style={{ maxHeight: 'calc(90vh - 220px)' }}>
                            {/* Intro */}
                            <p className="text-sm text-[var(--neutral-700)] leading-relaxed">
                                We understand that it is not easy to seek help with regard to mental health concerns. The acceptance of the need for help must come from the person seeking counseling. With this informed consent for psychotherapy, you will be able to understand more about your situation and with us, work on addressing your difficulties. Let us start by filling out this informed consent form.
                            </p>

                            {/* Sections */}
                            {CONSENT_SECTIONS.map((section, idx) => (
                                <div key={idx}>
                                    <h3 className="text-sm font-bold text-[var(--primary-800)] mb-2 pb-1 border-b border-dotted border-[var(--neutral-300)]">
                                        {section.title}
                                    </h3>
                                    <p className="text-sm text-[var(--neutral-600)] leading-relaxed whitespace-pre-line">
                                        {section.content}
                                    </p>
                                </div>
                            ))}

                            {/* Signature Area */}
                            <div className="mt-6 pt-4 border-t-2 border-[var(--neutral-300)]">
                                <div className="flex flex-col items-end">
                                    <p className="text-sm font-semibold text-[var(--primary-800)] mb-2">Signature of the client</p>
                                    <div className="px-6 py-3 bg-[var(--primary-50)] rounded-lg border-2 border-dashed border-[var(--primary-300)] min-w-[200px] text-center">
                                        <span className="text-lg font-serif italic text-[var(--primary-700)]">{clientName}</span>
                                    </div>
                                    <p className="text-xs text-[var(--neutral-500)] mt-2">
                                        Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer: Agree + Actions */}
                        <div className="px-6 py-4 border-t border-[var(--neutral-200)] bg-[var(--neutral-50)] space-y-4">
                            {/* Checkbox */}
                            <label className="flex items-start gap-3 cursor-pointer select-none">
                                <div className="mt-0.5">
                                    <input
                                        type="checkbox"
                                        checked={agreed}
                                        onChange={(e) => setAgreed(e.target.checked)}
                                        disabled={saving}
                                        className="sr-only peer"
                                    />
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${agreed
                                        ? 'bg-[var(--primary-600)] border-[var(--primary-600)]'
                                        : 'border-[var(--neutral-400)] bg-white'
                                        }`}>
                                        {agreed && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                </div>
                                <span className="text-sm text-[var(--neutral-700)] leading-snug">
                                    I have read and understood the above consent form. I agree to the <strong>Terms of Service</strong> and give my consent to proceed with therapy sessions.
                                </span>
                            </label>

                            {/* Buttons */}
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    disabled={saving}
                                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-[var(--neutral-600)] hover:bg-[var(--neutral-200)] transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={generateAndSavePdf}
                                    disabled={!agreed || saving}
                                    className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[var(--primary-600)] text-white hover:bg-[var(--primary-700)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving Consent...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Agree &amp; Continue to Payment
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
