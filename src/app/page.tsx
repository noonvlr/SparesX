import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home - SparesX | Mobile Spare Parts Marketplace",
  description:
    "SparesX is the premier marketplace for mobile technicians to buy and sell genuine spare parts. Quality parts, verified sellers, seamless transactions.",
  keywords: [
    "mobile spare parts",
    "phone parts marketplace",
    "technician marketplace",
    "mobile repair parts",
    "spare parts seller",
  ],
  openGraph: {
    title: "SparesX - Mobile Spare Parts Marketplace",
    description:
      "Buy and sell genuine mobile spare parts from verified technicians",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            Welcome to SparesX
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            The premier marketplace for mobile technicians to buy and sell spare
            parts. Quality parts, verified sellers, seamless transactions.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16 px-4">
            <Link
              href="/products"
              className="bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
            >
              Browse Products
            </Link>
            <Link
              href="/register"
              className="bg-green-600 text-white px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-semibold hover:bg-green-700 transition shadow-lg hover:shadow-xl"
            >
              Become a Seller
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-16">
          <article className="bg-white p-5 sm:p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📱</div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2">
              Quality Parts
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Find genuine and tested spare parts for all mobile brands
            </p>
          </article>
          <article className="bg-white p-5 sm:p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">✅</div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2">
              Verified Sellers
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              All sellers are verified technicians with quality assurance
            </p>
          </article>
          <article className="bg-white p-5 sm:p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-1">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🚀</div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2">
              Fast Listings
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              List your spare parts quickly and reach buyers instantly
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
