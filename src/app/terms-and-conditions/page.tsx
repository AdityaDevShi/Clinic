'use client';




export default function TermsAndConditionsPage() {
    return (
        <div className="min-h-screen">


            <section className="pt-32 pb-16 bg-gradient-to-b from-[var(--warm-100)] to-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="font-serif text-4xl md:text-5xl text-[var(--primary-700)] mb-4">
                        Terms and Conditions
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
                            By accessing or using the Arambh Clinic website, you agree to comply with and be bound by the following terms and conditions.
                        </p>

                        <h2 className="text-2xl font-serif text-[var(--primary-700)] mt-8 mb-4">Use of Website</h2>
                        <p>
                            The content on this website is provided for general information and service booking purposes only.
                            It should not be considered medical or psychological advice unless explicitly stated.
                        </p>

                        <h2 className="text-2xl font-serif text-[var(--primary-700)] mt-8 mb-4">Appointments & Services</h2>
                        <p>
                            Booking an appointment through the website does not guarantee service availability.
                            Arambh Clinic reserves the right to reschedule or cancel appointments if necessary.
                        </p>

                        <h2 className="text-2xl font-serif text-[var(--primary-700)] mt-8 mb-4">User Responsibilities</h2>
                        <p>
                            You agree to provide accurate information during registration and booking.
                            Any misuse of the website may result in restricted access.
                        </p>

                        <h2 className="text-2xl font-serif text-[var(--primary-700)] mt-8 mb-4">Intellectual Property</h2>
                        <p>
                            All content, branding, and materials on this website are the property of Arambh Clinic and
                            may not be used without permission.
                        </p>

                        <h2 className="text-2xl font-serif text-[var(--primary-700)] mt-8 mb-4">Limitation of Liability</h2>
                        <p>
                            Arambh Clinic shall not be held liable for any indirect, incidental, or consequential damages
                            arising from the use of this website or services.
                        </p>

                        <h2 className="text-2xl font-serif text-[var(--primary-700)] mt-8 mb-4">Changes to Terms</h2>
                        <p>
                            These terms may be updated at any time. Continued use of the website constitutes acceptance
                            of the updated terms.
                        </p>

                        <h2 className="text-2xl font-serif text-[var(--primary-700)] mt-8 mb-4">Contact</h2>
                        <p>
                            For questions regarding these Terms & Conditions, contact{' '}
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
