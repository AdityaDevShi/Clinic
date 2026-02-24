import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact Us — Get in Touch",
    description:
        "Have questions or want to schedule an appointment? Contact Arambh Mental Health Centre via phone (+91 7075829856), email (care@arambh.net), or our online contact form. We're here to help.",
    openGraph: {
        title: "Contact Arambh Mental Health Centre",
        description:
            "Reach out for appointments, inquiries, or feedback. Phone: +91 7075829856 | Email: care@arambh.net",
        url: "https://arambh.net/contact",
    },
    alternates: {
        canonical: "https://arambh.net/contact",
    },
};

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
