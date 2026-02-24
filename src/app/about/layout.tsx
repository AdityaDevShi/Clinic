import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Us — Our Mission & Values",
    description:
        "Learn about Arambh Mental Health Centre — our mission, values, and the compassionate team behind evidence-based mental health care. Led by Clinical Psychologist Shiwani Kohli.",
    openGraph: {
        title: "About Arambh Mental Health Centre",
        description:
            "Dedicated to helping you find clarity, balance, and emotional well-being through evidence-based care.",
        url: "https://arambh.net/about",
    },
    alternates: {
        canonical: "https://arambh.net/about",
    },
};

export default function AboutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
