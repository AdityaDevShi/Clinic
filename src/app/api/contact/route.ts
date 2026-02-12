export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { db } from '@/lib/firebase/server'; // Use server SDK for API routes
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
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
            // 1. Define the start of today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTimestamp = Timestamp.fromDate(today);

            const submissionsRef = collection(db, 'contact_submissions');

            // Note: This query requires a composite index on 'email' and 'createdAt'.
            // If the index is missing, this will throw. We catch it and allow the email to send.
            const q = query(
                submissionsRef,
                where('email', '==', email),
                where('createdAt', '>=', todayTimestamp)
            );

            const querySnapshot = await getDocs(q);

            if (querySnapshot.size >= 3) {
                return NextResponse.json(
                    { error: 'You have reached the daily limit of 3 messages. Please try again tomorrow.' },
                    { status: 429 }
                );
            }

            // Record submission
            await addDoc(submissionsRef, {
                email,
                name,
                createdAt: Timestamp.now(),  // Use server timestamp
                subject: subject || 'General Inquiry'
            });

        } catch (rateLimitError) {
            // Log the error (likely missing index) but ALLOW the message to proceed.
            // This prevents the contact form from breaking due to missing infra configuration.
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

        // Send email to the official business email
        // We send FROM the configured SMTP account (Gmail) TO the official email
        await sendEmail(
            'care@arambh.net', // Destination
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
