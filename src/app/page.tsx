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
import { RequestModel } from "@/lib/models/Request";
import { loadHomepageFeatured } from "@/lib/products/featuredHome";
import { resolveUploadUrl } from "@/lib/ui/imageUrl";
import {
  FOUNDER_EDUCATION_DEGREE,
  FOUNDER_EXPERIENCE_YEARS,
  FOUNDER_NAME,
  FOUNDER_PATH,
  HOME_META,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/seo/entities";
export const metadata: Metadata = {
  title: {
    absolute: HOME_META.title,
  },
  description: HOME_META.description,
  keywords: [
    "mobile spare parts",
    "technician marketplace",
    "phone repair parts India",
    "technician spare parts",
    "request spare parts",
    "mobile battery screen camera",
  ],
  openGraph: {
    title: HOME_META.title,
    description: HOME_META.description,
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
    title: HOME_META.title,
    description: HOME_META.description,
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

  const [
    featuredProducts,
    categoryRows,
    listingCounts,
    listedCount,
    openRequestsCount,
  ] = await Promise.all([
      loadHomepageFeatured(6),
      findPublicCategories({ dedupeByName: true }),
      Product.aggregate<{ _id: string; count: number }>([
        { $match: { status: "approved", partType: { $nin: [null, ""] } } },
        { $group: { _id: "$partType", count: { $sum: 1 } } },
      ]),
      Product.countDocuments({ status: "approved" }),
      RequestModel.countDocuments({ status: "open" }),
    ]);

  const heroThumbs = featuredProducts
    .flatMap((p) => {
      const first = Array.isArray(p.images) ? p.images[0] : null;
      const src = resolveUploadUrl(first);
      return src
        ? [{ src, alt: [p.brand, p.deviceModel, p.partType].filter(Boolean).join(" ") || p.name || "Spare part" }]
        : [];
    })
    .slice(0, 8);

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

  const jsonLd = buildWebSiteJsonLd();
  const organizationSchema = buildOrganizationJsonLd();

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
        <section className="relative overflow-hidden home-hero">
          <div
            aria-hidden
            className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,var(--brand-soft)_0%,var(--surface)_42%,var(--surface-2)_100%)]"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-20 opacity-[0.35] home-hero-grid"
          />
          <div
            aria-hidden
            className="absolute -top-32 left-1/2 -z-10 h-[480px] w-[min(920px,140vw)] -translate-x-1/2 rounded-full bg-[var(--brand)]/18 blur-[110px]"
          />

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 sm:pt-16 sm:pb-12 text-center">
            <div className="mb-5 sm:mb-7 flex flex-col items-center gap-2.5 home-hero-enter">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon-512.png"
                alt=""
                width={192}
                height={192}
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-[var(--radius-lg)] object-contain shadow-[var(--shadow-md)]"
                decoding="async"
              />
              <p
                className="text-[1.75rem] sm:text-[2.5rem] font-bold tracking-tight text-[var(--ink)] leading-none"
                aria-label="SparesX"
              >
                Spares<span className="text-[var(--brand)]">X</span>
              </p>
            </div>

            <h1 className="text-[1.65rem] sm:text-display text-balance font-bold tracking-tight text-[var(--ink)] mb-3 sm:mb-4 home-hero-enter home-hero-enter--delay-1">
              Mobile spare parts, built for technicians.
            </h1>

            <p className="mx-auto max-w-xl text-[15px] sm:text-lg leading-relaxed text-[var(--ink-secondary)] mb-5 sm:mb-7 px-1 home-hero-enter home-hero-enter--delay-2">
              List what you have, find what you need, or request a part — made
              for the repair trade.
            </p>

            <div className="mb-4 sm:mb-5 px-1 home-hero-enter home-hero-enter--delay-3">
              <HomeSearch />
            </div>

            <div className="flex flex-row gap-2.5 justify-center px-1 home-hero-enter home-hero-enter--delay-3">
              <Link
                href="/products"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "md" }),
                  "flex-1 sm:flex-none sm:w-auto",
                )}
              >
                Browse Parts
              </Link>
              <Link
                href="/requests?tab=submit"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "md" }),
                  "flex-1 sm:flex-none sm:w-auto",
                )}
              >
                Request a Part
              </Link>
            </div>
          </div>

          {heroThumbs.length >= 4 ? (
            <div
              aria-hidden
              className="relative mx-auto max-w-5xl px-4 sm:px-6 pb-10 sm:pb-14 home-hero-enter home-hero-enter--delay-4"
            >
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 sm:gap-2">
                {heroThumbs.map((thumb, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${thumb.src}-${i}`}
                    src={thumb.src}
                    alt=""
                    className="aspect-square w-full object-cover rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]"
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-10 sm:bottom-14 h-16 bg-gradient-to-t from-[var(--surface-2)] to-transparent" />
            </div>
          ) : (
            <div className="h-6 sm:h-10" />
          )}
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6">
          <HomeMarketplaceStats
            listedCount={listedCount}
            openRequestsCount={openRequestsCount}
          />
        </section>

        {categories.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div className="text-center mb-8 sm:mb-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-hover)] mb-2">
                Categories
              </p>
              <h2 className="text-title sm:text-[1.75rem] font-semibold tracking-tight text-[var(--ink)]">
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

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-5 py-8 sm:px-8 sm:py-10 text-center shadow-[var(--shadow-sm)]">
            <h2 className="text-title sm:text-[1.75rem] font-semibold tracking-tight text-[var(--ink)] mb-3">
              Built by Someone Who Knows Mobile Repair
            </h2>
            <p className="text-[15px] sm:text-base leading-relaxed text-[var(--muted)] mb-6">
              SparesX was founded by {FOUNDER_NAME}, an {FOUNDER_EDUCATION_DEGREE}{" "}
              graduate with more than {FOUNDER_EXPERIENCE_YEARS} years of
              hands-on experience in mobile phone repair, chip-level servicing
              and technician training.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={FOUNDER_PATH}
                className={cn(buttonVariants({ size: "md" }), "w-full sm:w-auto")}
              >
                Meet the Founder
              </Link>
              <Link
                href="/about"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "md" }),
                  "w-full sm:w-auto",
                )}
              >
                About SparesX
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
