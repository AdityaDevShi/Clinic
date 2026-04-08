import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact Us — Get in Touch",
    description:
        "Have questions or want to schedule an appointment? Contact Arambh Mental Health Centre via email (care@arambh.net) or our online contact form. Sign in to view our phone number. We're here to help.",
    openGraph: {
        title: "Contact Arambh Mental Health Centre",
        description:
            "Reach out for appointments, inquiries, or feedback. Email: care@arambh.net | Sign in to view phone number.",
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
