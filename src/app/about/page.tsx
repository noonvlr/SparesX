import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About SparesX",
  description:
    "Learn about SparesX, India's premier B2B marketplace for mobile spare parts. Connecting verified technicians with quality parts since inception.",
  keywords: [
    "about sparesx",
    "mobile parts marketplace",
    "technician network",
    "spare parts platform",
  ],
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About SparesX | Mobile Spare Parts Marketplace",
    description:
      "Learn about SparesX, India's premier B2B marketplace connecting verified technicians with quality mobile spare parts.",
    type: "website",
    url: "https://spares-x-h1cj.vercel.app/about",
  },
  twitter: {
    card: "summary_large_image",
    title: "About SparesX",
    description: "India's premier B2B marketplace for mobile spare parts.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            About SparesX
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            SparesX connects buyers with verified technicians for fast, trusted
            spare parts sourcing.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold mb-3">Our Mission</h2>
            <p className="text-gray-600">
              Empower repair professionals with a reliable marketplace that
              reduces downtime and improves service quality.
            </p>
          </article>
          <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold mb-3">Why SparesX</h2>
            <p className="text-gray-600">
              Verified sellers, transparent listings, and a network built for
              technicians first.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
