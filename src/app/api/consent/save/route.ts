import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { clientId, clientName, therapistName, pdfBase64, agreedAt } = body;

        if (!clientId || !clientName || !pdfBase64 || !agreedAt) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Store consent record in Firestore
        // The PDF base64 is stored so it can be retrieved/downloaded later
        const adminDb = getAdminDb();
        const consentRef = await adminDb.collection('consents').add({
            clientId,
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
