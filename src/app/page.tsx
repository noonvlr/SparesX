import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

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

  const resolveImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("https://") || url.startsWith("data:")) return url;
    if (url.startsWith("http://")) return url.replace("http://", "https://");
    if (url.startsWith("//")) return `https:${url}`;
    return url.startsWith("/") ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
  };

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
              The premier marketplace for mobile technicians to buy and sell
              spare parts. Quality parts, verified sellers, seamless
              transactions.
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

        {/* Featured Products Section */}
        {featuredProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex justify-between items-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Featured Products
              </h2>
              <Link
                href="/products"
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm sm:text-base hover:underline"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {featuredProducts.map((product: any) => (
                <Link
                  key={product._id}
                  href={`/product/${product._id}`}
                  className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 card-hover group"
                >
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    {product.images && product.images[0] ? (
                      <Image
                        src={resolveImageUrl(
                          product.images.find((img: string) => !!img),
                        )}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-contain p-4 card-image-zoom"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg
                          className="w-20 h-20"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      ₹{product.price.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                        {product.category}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          product.condition === "new"
                            ? "bg-green-50 text-green-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {product.condition}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
