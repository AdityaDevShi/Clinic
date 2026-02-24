import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms and Conditions",
    description:
        "By accessing or using the Arambh Clinic website, you agree to comply with and be bound by the following terms and conditions.",
    openGraph: {
        title: "Terms and Conditions — Arambh Clinic",
        description:
            "Read our terms and conditions for using the Arambh Clinic website and booking services.",
        url: "https://arambh.net/terms-and-conditions",
    },
    alternates: {
        canonical: "https://arambh.net/terms-and-conditions",
    },
};

export default function TermsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
