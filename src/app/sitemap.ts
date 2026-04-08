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
            url: `${baseUrl}/online-mental-health-counselling-india`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
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
        {
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
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
                    const name = doc.fields?.name?.stringValue || '';
                    const slug = name
                        .toLowerCase()
                        .replace(/^(dr\.|mr\.|ms\.|mrs\.|prof\.)\s*/i, '')
                        .trim()
                        .replace(/[^a-z0-9\s-]/g, '')
                        .replace(/\s+/g, '-')
                        .replace(/-+/g, '-')
                        .replace(/^-|-$/g, '');
                    return {
                        url: `${baseUrl}/therapists/${slug}`,
                        lastModified: new Date(),
                        changeFrequency: 'weekly' as const,
                        priority: 0.8,
                    };
                });
        }
    } catch (error) {
        console.error('Error fetching therapists for sitemap:', error);
    }

    // Dynamic blog post pages via Firestore REST API
    let blogPages: MetadataRoute.Sitemap = [];
    try {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'clinic-f7125';
        const blogRes = await fetch(
            `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/blog_posts`,
            { next: { revalidate: 3600 } }
        );

        if (blogRes.ok) {
            const blogData = await blogRes.json();
            const blogDocs = blogData.documents || [];

            blogPages = blogDocs.map((doc: any) => {
                const slug = doc.fields?.slug?.stringValue;
                if (!slug) return null;
                return {
                    url: `${baseUrl}/blog/${slug}`,
                    lastModified: new Date(),
                    changeFrequency: 'weekly' as const,
                    priority: 0.7,
                };
            }).filter(Boolean);
        }
    } catch (error) {
        console.error('Error fetching blog posts for sitemap:', error);
    }

    return [...staticPages, ...therapistPages, ...blogPages];
}
