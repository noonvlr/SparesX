import type { Metadata } from "next";
import Link from "next/link";
import TrustBadges from "@/components/TrustBadges";
import StarRatingDisplay from "@/components/StarRatingDisplay";
import { Card, EmptyState, PageHeader } from "@/components/ui/Card";
import { SITE_NAME } from "@/lib/seo/site";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { expandNearbyCities, canonicalizeCity, isSameCity } from "@/lib/geo/nearbyCities";
import { pickTrustFields } from "@/lib/trust";

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}): Promise<Metadata> {
  const raw = await searchParams;
  const city = firstParam(raw.city);
  const filtered = Boolean(city || firstParam(raw.nearby));

  return {
    title: city ? `Technicians in ${city}` : "Technicians",
    description: city
      ? `Technicians in ${city} on ${SITE_NAME}. Phone-verified and trusted technicians for mobile spare parts.`
      : "Browse technicians on SparesX. Phone-verified and trusted technicians for mobile spare parts across India.",
    keywords: [
      "phone-verified technicians",
      "technician network",
      "trusted technicians",
      "spare parts technicians",
      "mobile repair technicians",
    ],
    alternates: {
      canonical: "/technicians",
    },
    openGraph: {
      title: city
        ? `Technicians in ${city} | ${SITE_NAME}`
        : `Technicians | ${SITE_NAME}`,
      description:
        "Browse technicians on SparesX. Connect with phone-verified and trusted technicians.",
      type: "website",
      url: "/technicians",
    },
    twitter: {
      card: "summary_large_image",
      title: city
        ? `Technicians in ${city} | ${SITE_NAME}`
        : `Technicians | ${SITE_NAME}`,
      description:
        "Connect with phone-verified mobile spare parts technicians.",
    },
    robots: {
      index: !filtered,
      follow: true,
    },
  };
}

/** Same data as GET /api/sellers — queried in-process (no SSR self-fetch). */
async function loadTechnicians(opts: {
  city?: string;
  nearby?: boolean;
  limit?: number;
}) {
  await connectDB();
  const limit = Math.min(48, Math.max(1, opts.limit || 24));
  const filter: Record<string, unknown> = {
    role: "technician",
    isBlocked: false,
  };

  let preferred = "";
  if (opts.city) {
    preferred = canonicalizeCity(opts.city);
    const cities = opts.nearby
      ? expandNearbyCities(opts.city)
      : [preferred || opts.city];
    filter.city = {
      $in: cities.map(
        (c) => new RegExp(`^${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      ),
    };
  }

  const docs = await User.find(filter)
    .select(
      "name createdAt phoneVerified emailVerified kycVerified businessVerified addressVerified isTrusted trustScore activeBadgeKeys specialBadgeKeys role city state averageRating ratingCount responseRate chatInboundOpportunities",
    )
    .sort({ createdAt: -1 })
    .limit(limit * (preferred ? 2 : 1));

  let mapped = docs.map((s) => ({
    ...s.toObject(),
    ...pickTrustFields(s),
    sameCity: preferred ? isSameCity(preferred, s.city) : undefined,
  }));

  if (preferred) {
    mapped = mapped.sort(
      (a, b) => Number(Boolean(b.sameCity)) - Number(Boolean(a.sameCity)),
    );
  }

  return mapped.slice(0, limit);
}

export default async function TechniciansPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const raw = await searchParams;
  const city = firstParam(raw.city);
  const nearby =
    firstParam(raw.nearby) === "1" || firstParam(raw.nearby) === "true";

  let technicians: Awaited<ReturnType<typeof loadTechnicians>> = [];
  try {
    technicians = await loadTechnicians({ city, nearby, limit: 24 });
  } catch {
    technicians = [];
  }

  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <PageHeader
          title="Technicians"
          description="Look for verification (teal), reputation (gold), and special (purple) badges when choosing a technician."
        />
        {city ? (
          <p className="mb-4 text-sm text-[var(--muted)]">
            Showing technicians in {city}
            {nearby ? " and nearby cities" : ""}.{" "}
            <Link
              href="/technicians"
              className="text-[var(--brand)] font-medium"
            >
              Clear city filter
            </Link>
          </p>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {technicians.length === 0 ? (
            <EmptyState
              className="col-span-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]"
              title="No technicians found yet"
              description="Check back soon as technicians join SparesX."
            />
          ) : (
            technicians.map((tech) => (
              <Card key={String(tech._id)} hover className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/u/${tech._id}`}
                      className="text-lg font-semibold text-[var(--ink)] hover:text-[var(--brand-hover)]"
                    >
                      {tech.name}
                    </Link>
                    {tech.sameCity ? (
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--brand)] mt-0.5">
                        Same city
                      </p>
                    ) : null}
                    <div className="mt-1">
                      <StarRatingDisplay
                        value={tech.averageRating || 0}
                        count={tech.ratingCount || 0}
                      />
                    </div>
                    {typeof tech.responseRate === "number" &&
                    (tech.responseSampleSize || 0) >= 3 ? (
                      <p className="text-xs text-[var(--muted)] mt-1">
                        Usually replies within 24h ({tech.responseRate}%)
                      </p>
                    ) : null}
                  </div>
                  <TrustBadges
                    density="compact"
                    phoneVerified={tech.phoneVerified}
                    emailVerified={tech.emailVerified}
                    kycVerified={tech.kycVerified}
                    businessVerified={tech.businessVerified}
                    addressVerified={tech.addressVerified}
                    isTrusted={tech.isTrusted}
                    trustScore={tech.trustScore}
                    trustLabel={tech.trustLabel}
                    badges={tech.badges}
                    activeBadgeKeys={tech.activeBadgeKeys}
                    showScore
                  />
                </div>
                {(tech.city || tech.state) && (
                  <p className="text-sm text-[var(--muted)] mt-1">
                    {[tech.city, tech.state].filter(Boolean).join(", ")}
                  </p>
                )}
                <p className="text-sm text-[var(--muted)] mt-2">
                  Active since{" "}
                  {new Date(tech.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </p>
              </Card>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
