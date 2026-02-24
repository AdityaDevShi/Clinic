import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description:
        "At Arambh Clinic, we respect your privacy and are committed to protecting your personal information. Read our complete privacy policy.",
    openGraph: {
        title: "Privacy Policy — Arambh Clinic",
        description:
            "Learn how we collect, use, and safeguard your data when you use our website and services.",
        url: "https://arambh.net/privacy-policy",
    },
    alternates: {
        canonical: "https://arambh.net/privacy-policy",
    },
};

export default function PrivacyPolicyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
