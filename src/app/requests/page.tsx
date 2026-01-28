import type { Metadata } from "next";
import RequestForm from "./_components/RequestForm";

export const metadata: Metadata = {
  title: "Request a Part",
  description:
    "Can't find what you need? Submit a spare parts request and get responses from verified technicians. Fast, reliable sourcing for any mobile part.",
  keywords: [
    "request spare part",
    "part request",
    "find mobile parts",
    "custom request",
    "technician network",
  ],
  alternates: {
    canonical: "/requests",
  },
  openGraph: {
    title: "Request a Spare Part | SparesX",
    description:
      "Submit a spare parts request and get responses from verified technicians. Fast, reliable sourcing.",
    type: "website",
    url: "https://spares-x-h1cj.vercel.app/requests",
  },
  twitter: {
    card: "summary_large_image",
    title: "Request a Part | SparesX",
    description: "Get custom spare parts from verified technicians.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RequestsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Request a Spare Part
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Tell us what you need. Verified technicians will review your request
            and reach out with availability.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RequestForm />
          </div>
          <aside className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              What happens next?
            </h2>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>• Your request is shared with verified sellers.</li>
              <li>• Sellers contact you with availability and pricing.</li>
              <li>• Compare offers and proceed with the best match.</li>
            </ul>
            <div className="rounded-lg bg-blue-50 text-blue-700 px-4 py-3 text-sm">
              Tip: Include part condition, device variant, and urgency for
              faster responses.
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
