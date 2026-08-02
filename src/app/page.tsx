import Link from "next/link";
import type { Metadata } from "next";
import FeaturedProducts from "@/components/FeaturedProducts";
import AdSlot from "@/components/AdSlot";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/ui/cn";

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

      <main className="min-h-screen bg-[var(--surface-2)]">
        {/* Hero — full-bleed teal/slate atmosphere, brand-first */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 -z-20 bg-gradient-to-b from-[var(--brand-soft)] via-white to-[var(--surface-2)]"
          />
          <div
            aria-hidden
            className="absolute -top-40 left-1/2 -z-10 h-[420px] w-[780px] -translate-x-1/2 rounded-full bg-[var(--brand)]/15 blur-[100px]"
          />
          <div
            aria-hidden
            className="absolute top-24 right-[-120px] -z-10 h-72 w-72 rounded-full bg-slate-400/10 blur-3xl"
          />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
            <div className="mb-6 flex items-center justify-center gap-2.5">
              <span className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-[var(--radius)] bg-[var(--brand)] text-white text-lg sm:text-xl font-bold shadow-[var(--shadow-sm)]">
                S
              </span>
              <span className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--ink)]">
                Spares<span className="text-[var(--brand)]">X</span>
              </span>
            </div>

            <h1 className="text-balance text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[var(--ink)] mb-5 sm:mb-6">
              Mobile spare parts, sourced directly from verified technicians
            </h1>

            <p className="mx-auto max-w-xl text-base sm:text-lg text-[var(--muted)] mb-9 sm:mb-10 px-2">
              India&apos;s marketplace for mobile spare parts. SparesX connects
              buyers and sellers — we are not the seller, and there are no
              in-app payments yet.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
              <Link
                href="/products"
                className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
              >
                Browse Parts
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" }),
                  "w-full sm:w-auto",
                )}
              >
                Become a Seller
              </Link>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        {categories.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div className="text-center mb-8 sm:mb-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-hover)] mb-2">
                Categories
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--ink)]">
                Browse by category
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {categories.map((category: any) => (
                <Link
                  key={category.name}
                  href={category.href}
                  className="card-hover group flex flex-col items-center gap-2 sm:gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6 shadow-[var(--shadow-sm)]"
                >
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-[var(--radius)] bg-[var(--brand-soft)] text-2xl sm:text-3xl transition-transform duration-300 group-hover:scale-110">
                    {category.icon}
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-[var(--ink)] text-center">
                    {category.name}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdSlot id="home-mid" size="leaderboard" className="my-2" />
        </div>

        <FeaturedProducts products={featuredProducts} />
      </main>
    </>
  );
}
