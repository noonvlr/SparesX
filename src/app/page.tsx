import Link from "next/link";
import type { Metadata } from "next";
import FeaturedProducts from "@/components/FeaturedProducts";

export const metadata: Metadata = {
  title: "Buy & Sell Mobile Spare Parts Online",
  description:
    "India's premier B2B marketplace for mobile spare parts. Connect with verified technicians, buy genuine parts & tools. Quality assured, fast delivery nationwide.",
  keywords: [
    "mobile spare parts",
    "buy phone parts online",
    "mobile spare parts marketplace",
    "technician spare parts",
    "mobile repair parts India",
    "wholesale phone parts",
    "phone screen replacement",
    "mobile battery online",
    "phone parts B2B",
    "verified technician parts",
  ],
  openGraph: {
    title: "Buy & Sell Mobile Spare Parts Online | SparesX",
    description:
      "India's premier B2B marketplace for mobile spare parts. Connect with verified technicians, buy genuine parts. Quality assured, fast delivery.",
    url: "/",
    siteName: "SparesX",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SparesX - Mobile Spare Parts Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buy & Sell Mobile Spare Parts Online | SparesX",
    description:
      "India's premier B2B marketplace for mobile spare parts. Quality assured, verified technicians, fast delivery nationwide.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function HomePage() {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://spares-x-h1cj.vercel.app";

  // Fetch featured products with revalidation (ISR)
  const productsRes = await fetch(`${baseUrl}/api/products?limit=6`, {
    next: { revalidate: 300 }, // Revalidate every 5 minutes
  });
  const productsData = productsRes.ok
    ? await productsRes.json()
    : { products: [] };
  const featuredProducts = productsData.products || [];

  // Fetch categories with caching (ISR)
  const categoriesRes = await fetch(`${baseUrl}/api/categories`, {
    next: { revalidate: 3600 }, // Revalidate every hour
  });
  const categoriesData = categoriesRes.ok
    ? await categoriesRes.json()
    : { categories: [] };
  const categories =
    categoriesData.categories?.map((cat: any) => ({
      name: cat.name,
      icon: cat.icon,
      href: `/products?category=${cat.slug}`,
    })) || [];

  // JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SparesX",
    description:
      "India's premier B2B marketplace for mobile spare parts connecting verified technicians with quality parts",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
              Welcome to SparesX
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              India&apos;s marketplace for mobile spare parts. SparesX connects
              buyers and sellers — we are not the seller, and there are no
              in-app payments yet.
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
                Anyone Can Sell
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                Anyone in India can register and list spare parts on the
                platform
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

        {/* Categories Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.map((category: any) => (
              <Link
                key={category.name}
                href={category.href}
                className="bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 group"
              >
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
                  {category.icon}
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-800 text-center">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>

        <FeaturedProducts products={featuredProducts} />
      </main>
    </>
  );
}
