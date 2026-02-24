'use client';




export default function RefundCancellationPolicyPage() {
    return (
        <div className="min-h-screen">


            <section className="pt-32 pb-16 bg-gradient-to-b from-[var(--warm-100)] to-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="font-serif text-4xl md:text-5xl text-[var(--primary-700)] mb-4">
                        Refund & Cancellation Policy
                    </h1>
                    <div className="section-divider mb-6" />
                    <p className="text-lg text-[var(--neutral-600)]">
                        Arambh Clinic
                    </p>
                </div>
            </section>

            <section className="py-12 bg-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="prose prose-lg text-[var(--neutral-600)] max-w-none">
                        <p>
                            Arambh Clinic aims to provide a transparent and fair booking experience.
                            Please read the refund and cancellation policy carefully.
                        </p>

                        <h2 className="text-2xl font-serif text-[var(--primary-700)] mt-8 mb-4">Cancellations</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Appointments cancelled at least 24 hours prior to the scheduled time may be eligible for a refund.</li>
                            <li>Same-day cancellations or no-shows may not be eligible for a refund.</li>
                        </ul>

                        <h2 className="text-2xl font-serif text-[var(--primary-700)] mt-8 mb-4">Refunds</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Eligible refunds will be processed within 5–7 business days.</li>
                            <li>Payment gateway or transaction charges, if any, are non-refundable.</li>
                        </ul>

                        <h2 className="text-2xl font-serif text-[var(--primary-700)] mt-8 mb-4">Service Cancellations by Clinic</h2>
                        <p>
                            In case an appointment is cancelled by Arambh Clinic, a full refund will be initiated.
                        </p>

                        <h2 className="text-2xl font-serif text-[var(--primary-700)] mt-8 mb-4">Mode of Refund</h2>
                        <p>
                            Refunds will be processed through the original payment method used at the time of booking.
                        </p>

                        <h2 className="text-2xl font-serif text-[var(--primary-700)] mt-8 mb-4">Policy Updates</h2>
                        <p>
                            This policy may be updated without prior notice. The latest version will always be available on this page.
                        </p>

                        <h2 className="text-2xl font-serif text-[var(--primary-700)] mt-8 mb-4">Contact</h2>
                        <p>
                            For refund-related queries, please contact{' '}
                            <a href="mailto:care@arambh.net" className="text-[var(--primary-600)] hover:underline">
                                care@arambh.net
                            </a>.
                        </p>
                    </div>
                </div>
            </section>


        </div>
    );
}
