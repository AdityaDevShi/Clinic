import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import WorkshopBanner from "@/components/layout/WorkshopBanner";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://arambh.net"),
  title: {
    default: "Arambh Mental Health Centre | A Beginning of Your Becoming",
    template: "%s | Arambh Mental Health Centre",
  },
  description:
    "Professional mental health services with compassionate care. Book appointments with experienced clinical psychologists for individual therapy, couples counseling, child psychology, trauma therapy, and psychological assessments.",
  keywords: [
    "mental health",
    "therapy",
    "counseling",
    "clinical psychologist",
    "anxiety treatment",
    "depression help",
    "online therapy",
    "couples therapy",
    "child psychologist",
    "trauma therapy",
    "psychological assessment",
    "Arambh",
    "mental wellness",
  ],
  authors: [{ name: "Arambh Mental Health Centre" }],
  openGraph: {
    title: "Arambh Mental Health Centre",
    description:
      "A Beginning of Your Becoming — Professional mental health services with compassionate, evidence-based care.",
    type: "website",
    siteName: "Arambh Mental Health Centre",
    locale: "en_IN",
    url: "https://arambh.net",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arambh Mental Health Centre",
    description:
      "A Beginning of Your Becoming — Book appointments with experienced clinical psychologists.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://arambh.net",
  },
};

import GlobalLayoutWrapper from "@/components/layout/GlobalLayoutWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${inter.variable} antialiased bg-[var(--background)] text-[var(--foreground)]`}
        style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
      >
        <AuthProvider>
          <WorkshopBanner />
          <GlobalLayoutWrapper>
            {children}
          </GlobalLayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
