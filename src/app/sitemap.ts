import { MetadataRoute } from 'next';

// Force dynamic generation so the sitemap is always fresh
export const dynamic = 'force-dynamic';

interface FirestoreDoc {
    document: {
        name: string;
        fields: {
            isEnabled?: { booleanValue: boolean };
            name?: { stringValue: string };
            email?: { stringValue: string };
        };
    };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://arambh.net';

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/services`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/therapists`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/privacy-policy`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/terms-and-conditions`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/refund-cancellation-policy`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ];

    // Dynamic therapist profile pages via Firestore REST API
    let therapistPages: MetadataRoute.Sitemap = [];
    try {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'clinic-f7125';
        const res = await fetch(
            `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/therapists`,
            { next: { revalidate: 3600 } } // revalidate every hour
        );

        if (res.ok) {
            const data = await res.json();
            const documents = data.documents || [];

            therapistPages = documents
                .filter((doc: any) => {
                    const fields = doc.fields || {};
                    return (
                        fields.isEnabled?.booleanValue === true &&
                        fields.name?.stringValue?.trim() &&
                        fields.email?.stringValue?.trim()
                    );
                })
                .map((doc: any) => {
                    const docId = doc.name.split('/').pop();
                    return {
                        url: `${baseUrl}/profile?id=${docId}`,
                        lastModified: new Date(),
                        changeFrequency: 'weekly' as const,
                        priority: 0.8,
                    };
                });
        }
    } catch (error) {
        console.error('Error fetching therapists for sitemap:', error);
    }

    return [...staticPages, ...therapistPages];
}
