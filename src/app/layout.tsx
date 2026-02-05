import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

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
  title: "Arambh Mental Health Centre | A New Beginning for Your Mind",
  description: "Professional mental health services with compassionate care. Book appointments with our experienced therapists for individual therapy, couples counseling, and psychological assessments.",
  keywords: ["mental health", "therapy", "counseling", "psychologist", "anxiety", "depression", "wellness"],
  authors: [{ name: "Arambh Mental Health Centre" }],
  openGraph: {
    title: "Arambh Mental Health Centre",
    description: "A New Beginning for Your Mind - Professional mental health services",
    type: "website",
  },
};

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
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
