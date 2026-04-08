/**
 * Converts a therapist name to a URL-friendly slug.
 * "Dr. Shiwani Kohli" → "shiwani-kohli"
 * "Mr. Rahul Verma" → "rahul-verma"
 */
export function toSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/^(dr\.|mr\.|ms\.|mrs\.|prof\.)\s*/i, '') // Strip titles
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')   // Remove special chars
        .replace(/\s+/g, '-')           // Spaces → hyphens
        .replace(/-+/g, '-')            // Collapse multiple hyphens
        .replace(/^-|-$/g, '');          // Trim leading/trailing hyphens
}

/**
 * Checks if a string looks like a Firebase document ID (alphanumeric, 20+ chars)
 * vs a human-readable slug (contains hyphens, shorter).
 */
export function isFirebaseId(str: string): boolean {
    return /^[a-zA-Z0-9]{15,}$/.test(str);
}
