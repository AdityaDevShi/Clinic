import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Our Services — Therapy, Assessments & Psychology Programs",
    description:
        "Explore Arambh's professional mental health services: psychotherapy & counseling (CBT, DBT, trauma therapy), psychodiagnostic assessments (IQ, neuropsychological testing), psychology internships, and academic tutorials.",
    openGraph: {
        title: "Services — Arambh Mental Health Centre",
        description:
            "Professional mental health services tailored to your unique needs — therapy, assessments, internships, and more.",
        url: "https://arambh.net/services",
    },
    alternates: {
        canonical: "https://arambh.net/services",
    },
};

export default function ServicesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
