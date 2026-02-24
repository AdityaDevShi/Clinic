import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Find a Therapist — Book an Appointment Online",
    description:
        "Browse our team of licensed clinical psychologists and therapists. Filter by specialization, check live availability, read reviews, and book your appointment online at Arambh Mental Health Centre.",
    openGraph: {
        title: "Our Therapists — Arambh Mental Health Centre",
        description:
            "Connect with licensed therapists who understand your journey. Check availability and book online.",
        url: "https://arambh.net/therapists",
    },
    alternates: {
        canonical: "https://arambh.net/therapists",
    },
};

export default function TherapistsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
