import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import TrustBadges from "@/components/TrustBadges";
import StarRatingDisplay from "@/components/StarRatingDisplay";
import { Card, EmptyState, PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Sellers",
  description:
    "Browse technicians on SparesX. Phone-verified and trusted sellers for mobile spare parts across India.",
  keywords: [
    "phone-verified sellers",
    "technician network",
    "trusted sellers",
    "spare parts sellers",
    "mobile repair technicians",
  ],
  alternates: {
    canonical: "/sellers",
  },
  openGraph: {
    title: "Sellers | SparesX",
    description:
      "Browse technicians on SparesX. Connect with phone-verified and trusted sellers.",
    type: "website",
    url: "/sellers",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sellers | SparesX",
    description: "Connect with phone-verified mobile spare parts sellers.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function SellersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const city = typeof raw.city === "string" ? raw.city : undefined;
  const nearby =
    raw.nearby === "1" || raw.nearby === "true" ? "1" : undefined;

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || (host ? `${protocol}://${host}` : "");

  const qs = new URLSearchParams();
  if (city) qs.set("city", city);
  if (nearby) qs.set("nearby", nearby);
  const res = await fetch(
    `${baseUrl}/api/sellers${qs.toString() ? `?${qs}` : ""}`,
    { cache: "no-store" },
  );
  const data = res.ok ? await res.json() : { sellers: [] };
  const sellers = data.sellers || [];

  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <PageHeader
          title="Sellers"
          description="Look for verification (teal), reputation (gold), and special (purple) badges when choosing a seller."
        />
        {city ? (
          <p className="mb-4 text-sm text-[var(--muted)]">
            Showing sellers in {city}
            {nearby ? " and nearby cities" : ""}.{" "}
            <Link href="/sellers" className="text-[var(--brand)] font-medium">
              Clear city filter
            </Link>
          </p>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sellers.length === 0 ? (
            <EmptyState
              className="col-span-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]"
              title="No sellers found yet"
              description="Check back soon as technicians join SparesX."
            />
          ) : (
            sellers.map(
              (seller: {
                _id: string;
                name: string;
                createdAt: string;
                city?: string;
                state?: string;
                sameCity?: boolean;
                phoneVerified?: boolean;
                emailVerified?: boolean;
                kycVerified?: boolean;
                businessVerified?: boolean;
                addressVerified?: boolean;
                isTrusted?: boolean;
                trustScore?: number;
                trustLabel?: string;
                averageRating?: number;
                ratingCount?: number;
                badges?: import("@/lib/badges/catalog").PublicBadge[];
                activeBadgeKeys?: string[];
              }) => (
                <Card key={seller._id} hover className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/u/${seller._id}`}
                        className="text-lg font-semibold text-[var(--ink)] hover:text-[var(--brand-hover)]"
                      >
                        {seller.name}
                      </Link>
                      {seller.sameCity ? (
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--brand)] mt-0.5">
                          Same city
                        </p>
                      ) : null}
                      <div className="mt-1">
                        <StarRatingDisplay
                          value={seller.averageRating || 0}
                          count={seller.ratingCount || 0}
                        />
                      </div>
                    </div>
                    <TrustBadges
                      phoneVerified={seller.phoneVerified}
                      emailVerified={seller.emailVerified}
                      kycVerified={seller.kycVerified}
                      businessVerified={seller.businessVerified}
                      addressVerified={seller.addressVerified}
                      isTrusted={seller.isTrusted}
                      trustScore={seller.trustScore}
                      trustLabel={seller.trustLabel}
                      badges={seller.badges}
                      activeBadgeKeys={seller.activeBadgeKeys}
                      showScore
                    />
                  </div>
                  {(seller.city || seller.state) && (
                    <p className="text-sm text-[var(--muted)] mt-1">
                      {[seller.city, seller.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <p className="text-sm text-[var(--muted)] mt-2">
                    Active since{" "}
                    {new Date(seller.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </p>
                </Card>
              ),
            )
          )}
        </div>
      </section>
    </main>
  );
}
