import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

/**
 * Auto-post API for Instagram integration via Zapier/Make.com/IFTTT
 * 
 * POST /api/blog/auto-post
 * Headers: { "x-api-key": "your-secret-key" }
 * Body: { title, content, imageUrl?, instagramUrl? }
 * 
 * Creates a blog post authored by "Arambh Clinic"
 */
export async function POST(request: NextRequest) {
    try {
        // Verify API key
        const apiKey = request.headers.get('x-api-key');
        const expectedKey = process.env.BLOG_AUTO_POST_KEY;

        if (!expectedKey || apiKey !== expectedKey) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, content, imageUrl, instagramUrl, images: bodyImages, videoUrl } = body;

        if (!title || !content) {
            return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
        }

        // Generate slug
        const slug = title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            + '-' + Date.now().toString(36);

        const db = getAdminDb();

        // Support both single imageUrl and images array
        let images: string[] = bodyImages || [];
        if (images.length === 0 && imageUrl) {
            images = [imageUrl];
        }

        const postData = {
            title: title.trim(),
            slug,
            content: content.trim(),
            authorId: 'arambh-clinic',
            authorName: 'Arambh Clinic',
            authorRole: 'admin',
            images,
            instagramUrl: instagramUrl || null,
            videoUrl: videoUrl || null,
            createdAt: new Date(),
        };

        const docRef = await db.collection('blog_posts').add(postData);

        return NextResponse.json({
            success: true,
            postId: docRef.id,
            slug,
            url: `https://arambh.net/blog/${slug}`,
        });
    } catch (error: any) {
        console.error('Auto-post error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

