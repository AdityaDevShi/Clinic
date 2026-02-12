import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    // Prefer new SMTP settings, fallback to legacy Gmail
    ...(process.env.SMTP_HOST ? {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    } : {
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
        },
    })
} as any);

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
    const fromEmail = process.env.SMTP_USER || process.env.GMAIL_USER;

    const mailOptions = {
        from: `"Arambh Clinic" <${fromEmail}>`,
        to,
        subject,
        text,
        html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};
