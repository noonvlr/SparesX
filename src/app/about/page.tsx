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
            SparesX is an India-only online marketplace that connects buyers and
            sellers of mobile and device spare parts. Anyone in India can
            register and sell.
          </p>
        </header>

        <div className="mb-8 rounded-xl border border-blue-100 bg-blue-50/70 p-5 text-sm text-blue-950 leading-relaxed">
          <p className="font-semibold mb-1">Important</p>
          <p>
            SparesX is not the seller. We only provide the platform for buyers
            and sellers to connect. There are no in-app payments yet — payment
            and shipping are arranged directly between users.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold mb-3">Our Mission</h2>
            <p className="text-gray-600">
              Help repair professionals and spare-part businesses find each
              other faster with clear listings, requests, and direct
              communication.
            </p>
          </article>
          <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold mb-3">Why SparesX</h2>
            <p className="text-gray-600">
              Built for India&apos;s spare-parts trade: marketplace-only tools,
              transparent listings, and policies that set clear expectations for
              buyers and sellers.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
