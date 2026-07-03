/** Strip HTML tags from rich-text content for plain-text display in RN. */
export function htmlToPlainText(html: string): string {
    if (!html) return '';
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n\n')
        .replace(/<li[^>]*>/gi, '• ')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#0?39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/** Extract a YouTube video id from watch/share/embed/shorts/live URLs (null if not YouTube). */
export function youtubeVideoId(url: string): string | null {
    const match = url.match(
        /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/
    );
    return match ? match[1] : null;
}

export interface VideoMeta {
    title: string;
    author: string;
    thumbnail: string | null;
}

/**
 * Fetch video title/author/thumbnail via YouTube's public oEmbed endpoint.
 * Works for any YouTube URL form; returns null on failure (caller falls back).
 */
export async function fetchYoutubeMeta(url: string): Promise<VideoMeta | null> {
    try {
        const res = await fetch(
            `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
        );
        if (!res.ok) return null;
        const data = await res.json();
        return {
            title: data.title || '',
            author: data.author_name || '',
            thumbnail: data.thumbnail_url || null,
        };
    } catch {
        return null;
    }
}
