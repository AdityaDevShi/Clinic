import { NextResponse } from 'next/server';
import { getAdminDb, verifyRequestUid } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

// Firestore caps a single document at ~1 MiB. Reject oversized PDFs early so
// we fail with a clear error instead of an opaque write failure.
const MAX_PDF_BASE64_LENGTH = 900_000; // ~675 KB of binary

export async function POST(req: Request) {
    try {
        // Authenticate: derive the caller's uid from the verified ID token.
        const requestingUid = await verifyRequestUid(req);
        if (!requestingUid) {
            return NextResponse.json({ error: 'Unauthorized: invalid or missing auth token' }, { status: 401 });
        }

        const body = await req.json();
        const { clientName, therapistName, pdfBase64, agreedAt } = body;

        if (!clientName || !pdfBase64 || !agreedAt) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (typeof pdfBase64 !== 'string' || pdfBase64.length > MAX_PDF_BASE64_LENGTH) {
            return NextResponse.json({ error: 'Consent document is invalid or too large' }, { status: 400 });
        }

        // Bind the consent record to the authenticated user — never trust a
        // clientId supplied in the request body.
        const adminDb = getAdminDb();
        const consentRef = await adminDb.collection('consents').add({
            clientId: requestingUid,
            clientName,
            therapistName: therapistName || '',
            signedBy: clientName,
            pdfBase64, // Store the PDF data directly
            agreedAt: new Date(agreedAt),
            createdAt: new Date()
        });

        return NextResponse.json({ success: true, consentId: consentRef.id });

    } catch (error: any) {
        console.error('Error saving consent:', error);
        return NextResponse.json(
            { error: 'Failed to save consent form' },
            { status: 500 }
        );
    }
}
