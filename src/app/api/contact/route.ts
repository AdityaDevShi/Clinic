// export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { getAdminDb } from '@/lib/firebase/admin';

// Simple HTML sanitizer to prevent injection in email bodies
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, phone, subject, message } = body;

        // Basic validation
        if (!name || !email || !message || typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'Name, email, and message are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Rate limiting (Fail Open Strategy)
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const adminDb = getAdminDb();
            const submissionsRef = adminDb.collection('contact_submissions');

            const querySnapshot = await submissionsRef
                .where('email', '==', email)
                .where('createdAt', '>=', today)
                .get();

            if (querySnapshot.size >= 3) {
                return NextResponse.json(
                    { error: 'You have reached the daily limit of 3 messages. Please try again tomorrow.' },
                    { status: 429 }
                );
            }

            // Record submission
            await submissionsRef.add({
                email,
                name,
                createdAt: new Date(),
                subject: subject || 'General Inquiry'
            });

        } catch (rateLimitError) {
            console.warn('Rate limiting check failed (proceeding anyway):', rateLimitError);
        }

        // Email content
        const emailSubject = `New Contact Form Submission: ${subject || 'General Inquiry'}`;
        const emailText = `
Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Subject: ${subject || 'Not provided'}

Message:
${message}
        `;

        // Sanitize all user inputs before embedding in HTML email
        const safeName = escapeHtml(name);
        const safeEmail = escapeHtml(email);
        const safePhone = escapeHtml(phone || 'Not provided');
        const safeSubject = escapeHtml(subject || 'Not provided');
        const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

        const emailHtml = `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${safeName}</p>
            <p><strong>Email:</strong> ${safeEmail}</p>
            <p><strong>Phone:</strong> ${safePhone}</p>
            <p><strong>Subject:</strong> ${safeSubject}</p>
            <br/>
            <p><strong>Message:</strong></p>
            <p>${safeMessage}</p>
        `;

        await sendEmail(
            'care@arambh.net',
            emailSubject,
            emailText,
            emailHtml
        );

        return NextResponse.json({ success: true, message: 'Message sent successfully' });
    } catch (error: unknown) {
        console.error('Contact form error:', error);
        return NextResponse.json(
            { error: 'Failed to send message. Please try again later.' },
            { status: 500 }
        );
    }
}
