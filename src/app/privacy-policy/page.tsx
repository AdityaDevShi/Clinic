'use client';




export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen">


            <section className="pt-32 pb-16 bg-gradient-to-b from-[var(--warm-100)] to-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="font-serif text-4xl md:text-5xl text-[var(--primary-700)] mb-4">
                        Privacy Policy
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
                            At Arambh Clinic, we respect your privacy and are committed to protecting your personal information.
                            This Privacy Policy explains how we collect, use, and safeguard your data when you use our website and services.
                        </p>

                        <h2 className="text-2xl font-serif text-[var(--primary-700)] mt-8 mb-4">Information We Collect</h2>
                        <p>
                            We may collect personal information such as your name, email address, phone number, and appointment details
                            when you register, book services, or contact us through the website.
                        </p>

                        <h2 className="text-2xl font-serif text-[var(--primary-700)] mt-8 mb-4">How We Use Your Information</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>To provide and manage appointments and services</li>
                            <li>To communicate with you regarding bookings or inquiries</li>
                            <li>To improve our website and services</li>
                            <li>To comply with legal or regulatory requirements</li>
                        </ul>

                        <h2 className="text-2xl font-serif text-[var(--primary-700)] mt-8 mb-4">Data Protection</h2>
                        <p>
                            We implement reasonable security measures to protect your personal information from unauthorized access,
                            misuse, or disclosure.
                        </p>

                        <h2 className="text-2xl font-serif text-[var(--primary-700)] mt-8 mb-4">Third-Party Services</h2>
                        <p>
                            We may use trusted third-party services (such as payment gateways or analytics tools) that follow
                            industry-standard security practices.
                        </p>

                        <h2 className="text-2xl font-serif text-[var(--primary-700)] mt-8 mb-4">Your Consent</h2>
                        <p>
                            By using our website, you consent to this Privacy Policy.
                        </p>

                        <h2 className="text-2xl font-serif text-[var(--primary-700)] mt-8 mb-4">Updates</h2>
                        <p>
                            This policy may be updated from time to time. Any changes will be posted on this page.
                        </p>

                        <h2 className="text-2xl font-serif text-[var(--primary-700)] mt-8 mb-4">Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at{' '}
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
