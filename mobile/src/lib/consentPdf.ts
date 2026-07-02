import * as Print from 'expo-print';
import { File } from 'expo-file-system';

/** Consent content mirrors the website's ConsentFormModal. */
export const CONSENT_SECTIONS: { title: string; content: string }[] = [
    {
        title: 'Session Length',
        content:
            'There is no specific determination on how many sessions are needed by a client/patient as this may depend on the healing progress of said client/patient and this can be discussed with your therapist.',
    },
    {
        title: 'Relationship',
        content:
            'The required relationship that a client/patient should have with his/her therapist is strictly professional. Any other relationship, such as business or personal relationships a client/patient may have with a therapist may prevent or undermine the effectiveness of the treatment.',
    },
    {
        title: 'Confidentiality',
        content:
            'Sessions between the therapist and the client/patient are strictly confidential. Any notes taken by the therapist, audio recordings, video recordings during therapy shall be kept confidential and secure by the therapist at all times and shall not disclose it to anyone without any prior written consent by the client/patient, with exception to certain limitations by law such as: (1) Abuse to a child, disabled, elderly, other people; (2) Criminal Acts; (3) Sexual Abuse; (4) Acts which may involve the transmission of HIV/AIDS; (5) Any other instance where the therapist has a duty or firm belief that there is a necessity to disclose.',
    },
    {
        title: 'Risks',
        content:
            "Through therapy clients/patients learn more about themselves that they do not realize. There may be a chance that during or after a session, the client/patient may feel emotionally or physically distressed. This is normal and should be part of one's healing process. A therapy's success shall depend both on the efforts of the therapist and the client/patient.",
    },
    {
        title: 'Advantages',
        content:
            'Therapy helps in making one open his or her awareness, bringing personal insights and finding ways of coping. Uncomfortable feelings are normal and part of the process. With the client/patient and therapist working hand in hand, progress shall be faster than realized.',
    },
    {
        title: 'Court Proceedings',
        content:
            'In case of a court proceeding involving the client/patient, it is agreed that the therapist cannot testify, such as but not limited to custody proceedings, divorce proceedings, injuries, or any other lawsuits, that shall result in the disclosure of the records of the psychotherapist about his/her client/patient.',
    },
    {
        title: 'Withdrawal',
        content: 'Please note that you may withdraw anytime from the psychotherapy upon notice.',
    },
];

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Render the signed consent form to a PDF and return it base64-encoded, ready
 * for POST /api/consent/save (kept text-only so it stays well under the limit).
 */
export async function generateConsentPdfBase64(
    clientName: string,
    therapistName: string
): Promise<string> {
    const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    const sectionsHtml = CONSENT_SECTIONS.map(
        (s) => `<h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.content)}</p>`
    ).join('');

    const html = `
    <html>
      <head><meta charset="utf-8" />
        <style>
          body { font-family: Georgia, serif; color: #333; padding: 32px; line-height: 1.5; }
          h1 { color: #3d4937; font-size: 22px; text-align: center; }
          h3 { color: #5d7052; font-size: 14px; margin-bottom: 4px; }
          p { font-size: 12px; margin-top: 0; }
          .sig { margin-top: 40px; text-align: right; }
          .sig .name { font-size: 16px; font-style: italic; font-weight: bold; }
          .meta { font-size: 11px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Arambh Clinic — Informed Consent</h1>
        ${sectionsHtml}
        <div class="sig">
          <div>__________________________</div>
          <div class="name">${escapeHtml(clientName)}</div>
          <div class="meta">Signature of the client</div>
          <div class="meta">Date: ${escapeHtml(date)}</div>
          <div class="meta">Therapist: ${escapeHtml(therapistName)}</div>
        </div>
      </body>
    </html>`;

    const { uri } = await Print.printToFileAsync({ html, base64: false });
    return await new File(uri).base64();
}
