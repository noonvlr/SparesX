import Link from "next/link";
import type { Metadata } from "next";
import FeaturedProducts from "@/components/FeaturedProducts";
import AdSlot from "@/components/AdSlot";
import HomeSearch from "@/components/HomeSearch";
import HomeMarketplaceStats from "@/components/HomeMarketplaceStats";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/ui/cn";
import { connectDB } from "@/lib/db/connect";
import { findPublicCategories } from "@/lib/categories/publicQuery";
import { Product } from "@/lib/models/Product";
import {
  SITE_CONTACT_EMAIL,
  SITE_NAME,
  SITE_OPERATOR,
  SITE_URL,
} from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Buy & Sell Mobile Spare Parts Online",
  description:
    "SparesX is a marketplace for mobile repair technicians to list, find, and request spare parts. Browse verified technician listings, trust scores, and connect directly with sellers.",
  keywords: [
    "mobile spare parts",
    "technician marketplace",
    "phone repair parts India",
    "verified technician parts",
    "request spare parts",
    "mobile battery screen camera",
  ],
  openGraph: {
    title: "Buy & Sell Mobile Spare Parts Online | SparesX",
    description:
      "List, find, and request spare parts with verified technicians. Trust scores and badges help you connect directly — SparesX does not process payments.",
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
      "Marketplace for technicians: verified listings, trust scores, and direct seller connections.",
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

export const revalidate = 60;

export default async function HomePage() {
  await connectDB();

  const [featuredRaw, categoryRows, listingCounts, listedCount, soldCount] =
    await Promise.all([
      Product.find({ status: "approved" })
        .sort({ createdAt: -1 })
        .limit(6)
        .select(
          "name price images brand partType condition deviceModel deviceCategory slug status priceNegotiable technician",
        )
        .lean(),
      findPublicCategories({ dedupeByName: true }),
      Product.aggregate<{ _id: string; count: number }>([
        { $match: { status: "approved", partType: { $nin: [null, ""] } } },
        { $group: { _id: "$partType", count: { $sum: 1 } } },
      ]),
      Product.countDocuments({ status: "approved" }),
      Product.countDocuments({ status: "sold" }),
    ]);

  const featuredProducts = featuredRaw.map((p) => ({
    ...p,
    _id: String(p._id),
    technician: p.technician ? String(p.technician) : undefined,
  }));

  const countBySlug = new Map(
    listingCounts.map((row) => [String(row._id), row.count]),
  );

  const categories = categoryRows
    .map((cat) => ({
      name: cat.name,
      icon: cat.icon,
      slug: cat.slug,
      href: `/products?partType=${encodeURIComponent(cat.slug)}`,
      listings: countBySlug.get(cat.slug) || 0,
    }))
    .sort((a, b) => b.listings - a.listings || a.name.localeCompare(b.name))
    .slice(0, 10);

  const baseUrl = SITE_URL;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    description:
      "India's premier B2B marketplace for mobile spare parts connecting verified technicians with quality parts",
    url: baseUrl,
    inLanguage: "en-IN",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    legalName: SITE_OPERATOR,
    url: baseUrl,
    logo: `${baseUrl}/og-image.jpg`,
    description:
      "Marketplace connecting buyers and sellers of mobile, laptop, and desktop spare parts across India. SparesX does not sell parts or process payments.",
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: SITE_CONTACT_EMAIL,
        areaServed: "IN",
        availableLanguage: ["en"],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />

      <main className="min-h-screen bg-[var(--surface-2)]">
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 -z-20 bg-gradient-to-b from-[var(--brand-soft)] via-[var(--surface)] to-[var(--surface-2)]"
          />
          <div
            aria-hidden
            className="absolute -top-40 left-1/2 -z-10 h-[420px] w-[780px] -translate-x-1/2 rounded-full bg-[var(--brand)]/15 blur-[100px]"
          />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
            <div className="mb-6 flex items-center justify-center gap-2.5">
              <span className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-[var(--radius)] bg-[var(--brand)] text-[var(--primary-foreground)] text-lg sm:text-xl font-bold shadow-[var(--shadow-sm)]">
                S
              </span>
              <span className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--ink)]">
                Spares<span className="text-[var(--brand)]">X</span>
              </span>
            </div>

            <h1 className="text-balance text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[var(--ink)] mb-5 sm:mb-6">
              The spare parts marketplace, built for technicians.
            </h1>

            <p className="mx-auto max-w-2xl text-base sm:text-lg text-[var(--muted)] mb-8 sm:mb-9 px-2">
              SparesX is the dedicated marketplace where mobile repair
              technicians list, find, and request spare parts — searchable,
              organized, and built just for the trade.
            </p>

            <div className="mb-8 sm:mb-10 px-2">
              <HomeSearch />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
              <Link
                href="/products"
                className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
              >
                Browse Parts
              </Link>
              <Link
                href="/requests?tab=submit"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" }),
                  "w-full sm:w-auto",
                )}
              >
                Request a Part
              </Link>
            </div>

            <HomeMarketplaceStats
              listedCount={listedCount}
              soldCount={soldCount}
            />
          </div>
        </section>

        {categories.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div className="text-center mb-8 sm:mb-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-hover)] mb-2">
                Categories
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--ink)]">
                Browse by category
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Top categories by active listings
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={category.href}
                  className="card-hover group flex flex-col items-center gap-2 sm:gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6 shadow-[var(--shadow-sm)]"
                >
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-[var(--radius)] bg-[var(--brand-soft)] text-2xl sm:text-3xl transition-transform duration-300 group-hover:scale-110">
                    {category.icon}
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-[var(--ink)] text-center">
                    {category.name}
                  </h3>
                  {category.listings > 0 ? (
                    <p className="text-[10px] text-[var(--muted)]">
                      {category.listings} listing
                      {category.listings === 1 ? "" : "s"}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdSlot id="home-mid" size="leaderboard" className="my-2" />
        </div>

        <FeaturedProducts products={featuredProducts as any} />
      </main>
    </>
  );
}
