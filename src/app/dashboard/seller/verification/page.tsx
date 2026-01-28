import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seller Verification - SparesX",
  description: "Verification status and requirements for sellers on SparesX.",
  openGraph: {
    title: "Seller Verification - SparesX",
    description: "Verification status and requirements for sellers on SparesX.",
    type: "website",
  },
};

export default function SellerVerificationPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Verification</h1>
        <p className="text-gray-600 mb-6">
          Verification helps buyers trust your listings. Ensure your profile is
          complete and provide proof of service credentials when requested.
        </p>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-gray-600">
          Our team will reach out if additional verification is needed.
        </div>
      </section>
    </main>
  );
}
