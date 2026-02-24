import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Refund & Cancellation Policy",
    description:
        "Read the refund and cancellation policy for Arambh Clinic to understand the terms for rescheduling or refunding your appointments.",
    openGraph: {
        title: "Refund & Cancellation Policy — Arambh Clinic",
        description:
            "Arambh Clinic aims to provide a transparent and fair booking experience. Check our refund rules.",
        url: "https://arambh.net/refund-cancellation-policy",
    },
    alternates: {
        canonical: "https://arambh.net/refund-cancellation-policy",
    },
};

export default function RefundLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
