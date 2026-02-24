import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/admin/',
                    '/therapist/dashboard',
                    '/therapist/profile',
                    '/therapist/patients/',
                    '/therapist/schedule',
                    '/client/',
                    '/login',
                    '/signup',
                    '/api/',
                ],
            },
        ],
        sitemap: 'https://arambh.net/sitemap.xml',
    };
}
