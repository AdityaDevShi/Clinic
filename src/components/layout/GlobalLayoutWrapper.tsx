'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function GlobalLayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Check if the current route is a dashboard route that shouldn't have the global header/footer
    // Most admin/therapist dashboards in this app DO use the global header/footer, 
    // but in case any custom dashboard layouts exist we can exclude them here.
    // Based on previous pages, admin/dashboard, therapist/dashboard all imported Header/Footer.
    const isDashboard = false; // We can add routes here if we want to hide them later

    return (
        <div className="flex flex-col min-h-screen">
            {!isDashboard && <Header />}

            <main className="flex-grow">
                {children}
            </main>

            {!isDashboard && <Footer />}
        </div>
    );
}
