import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import ProductFilters, { ProductSearchBar } from "./_components/ProductFilters";
import ProductSortSelect from "./_components/ProductSortSelect";
import ProductCard from "@/components/ProductCard";
import AdSlot from "@/components/AdSlot";
import { EmptyState, PageHeader } from "@/components/ui/Card";
import {
  fetchProductList,
  firstParam,
  type ProductListParams,
} from "@/lib/products/listQuery";
import { formatPartTypeLabel } from "@/lib/products/listingTitle";
import { SITE_NAME, absoluteUrl, productPath } from "@/lib/seo/site";
import {
  hasListingFilters,
  listingHref,
  listingPageMeta,
  listingPageNumbers,
  requestedListingPage,
} from "@/lib/seo/listingPagination";
import { requestSubmitHref } from "@/lib/requests/demandLinks";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/ui/cn";

type RawSearchParams = Record<string, string | string[] | undefined>;

function toListParams(raw: RawSearchParams): ProductListParams {
  return {
    page: firstParam(raw.page),
    limit: firstParam(raw.limit),
    deviceCategory: firstParam(raw.deviceCategory),
    category: firstParam(raw.category),
    brand: firstParam(raw.brand),
    deviceModel: firstParam(raw.deviceModel),
    model: firstParam(raw.model),
    partType: firstParam(raw.partType),
    condition: firstParam(raw.condition),
    minPrice: firstParam(raw.minPrice),
    maxPrice: firstParam(raw.maxPrice),
    search: firstParam(raw.search),
    city: firstParam(raw.city),
    nearby: firstParam(raw.nearby),
    sellerType: firstParam(raw.sellerType),
    sort: firstParam(raw.sort),
    negotiable: firstParam(raw.negotiable),
  };
}

/** Soft-rank by profile city when the URL has no city filter. */
async function withPreferCity(
  params: ProductListParams,
): Promise<ProductListParams> {
  if (params.city?.trim()) return params;
  try {
    const { cookies } = await import("next/headers");
    const { SESSION_COOKIE } = await import("@/lib/auth/cookieNames");
    const { verifyJwt } = await import("@/lib/auth/jwt");
    const token = (await cookies()).get(SESSION_COOKIE)?.value?.trim();
    if (!token) return params;
    const payload = verifyJwt(token);
    if (!payload?.id) return params;
    const { connectDB } = await import("@/lib/db/connect");
    const { User } = await import("@/lib/models/User");
    await connectDB();
    const user = await User.findById(payload.id)
      .select("city isBlocked sessionVersion")
      .lean();
    if (!user || user.isBlocked) return params;
    const sv = typeof user.sessionVersion === "number" ? user.sessionVersion : 0;
    if (payload.sv !== sv) return params;
    if (!user.city?.trim()) return params;
    return { ...params, preferCity: user.city.trim() };
  } catch {
    return params;
  }
}

/** Filtered views are near-duplicates, so only the default list is indexed. */
function isFilteredView(raw: RawSearchParams) {
  return hasListingFilters(raw);
}

const loadBrowseListing = cache(async (key: string) => {
  const raw = JSON.parse(key) as RawSearchParams;
  const params = await withPreferCity(toListParams(raw));
  return fetchProductList(params);
});

/**
 * Human-readable summary of the active filters, e.g.
 * "Samsung Galaxy S24 Ultra display parts in Chennai".
 */
function describeFilters(params: ProductListParams) {
  const partLabel = formatPartTypeLabel(params.partType);
  const subject = [params.brand, params.deviceModel || params.model]
    .filter(Boolean)
    .join(" ");

  const noun = partLabel ? `${partLabel} parts` : "spare parts";
  const phrase = [subject, noun].filter(Boolean).join(" ");
  const suffix = params.city ? ` in ${params.city}` : "";

  if (params.search) {
    return `Search results for "${params.search}"${suffix}`;
  }
  if (!subject && !partLabel && !params.city) return "";
  return `${phrase.charAt(0).toUpperCase()}${phrase.slice(1)}${suffix}`;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}): Promise<Metadata> {
  const raw = await searchParams;
  const filtered = isFilteredView(raw);
  const summary = describeFilters(toListParams(raw));
  const { pages } = await loadBrowseListing(JSON.stringify(raw));
  const { index, canonical } = listingPageMeta(raw, pages);
  const pageNumber = requestedListingPage(raw);
  const pageLabel =
    index && pageNumber > 1 ? ` (page ${pageNumber})` : "";

  const title =
    filtered && summary
      ? summary
      : `Browse Mobile Spare Parts${pageLabel}`;
  const description =
    filtered && summary
      ? `${summary} listed by technicians on ${SITE_NAME}. Compare prices and contact sellers directly.`
      : "Browse spare parts listed by technicians on SparesX. Filter by device, brand, model, part type, condition, city, and seller badges, then contact the seller directly.";

  return {
    title,
    description,
    keywords: [
      "browse spare parts",
      "mobile parts India",
      "phone repair parts",
      "laptop spare parts",
      "technician marketplace",
      "technician listings",
    ],
    alternates: { canonical },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      type: "website",
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
    },
    // Filter permutations stay out of the index. Numbered pages of the
    // default list are real URLs and keep their own canonical.
    robots: { index, follow: true },
  };
}

export default async function BrowseProductsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const raw = await searchParams;
  const params = await withPreferCity(toListParams(raw));
  const { products, total, page, pages } = await loadBrowseListing(
    JSON.stringify(raw),
  );

  // Evidence layer: SSR browse path must emit search events (API list is unused here).
  const searchQ = params.search?.trim();
  if (searchQ && searchQ.length >= 2) {
    const { trackMarketplaceEvent } = await import("@/lib/analytics/events");
    const dims = {
      query: searchQ,
      brand: params.brand || undefined,
      partType: params.partType || undefined,
      deviceModel: params.deviceModel || params.model || undefined,
      city: params.city || params.preferCity || undefined,
    };
    void trackMarketplaceEvent({
      type: "search",
      ...dims,
      meta: { resultCount: total, source: "products_ssr" },
    });
    if (total === 0) {
      void trackMarketplaceEvent({
        type: "search_zero_results",
        ...dims,
        meta: { resultCount: 0, source: "products_ssr" },
      });
    }
  }

  const summary = describeFilters(params);
  const productNames = Array.from(
    new Set(products.map((p) => p.name).filter(Boolean)),
  );

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: summary || "Mobile and computer spare parts on SparesX",
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: (page - 1) * 12 + index + 1,
      url: absoluteUrl(productPath(product)),
      name: product.name,
    })),
  };

  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      {products.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      ) : null}

      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <PageHeader
          title={summary || "Browse products"}
          description="Spare parts listed by technicians across India. Filter by device, brand, model, part type, condition, city, and seller badges, then contact the seller directly — SparesX does not process payments."
        />

        <div className="mb-6">
          <ProductSearchBar productNames={productNames} />
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="lg:w-72 lg:flex-shrink-0">
            <div className="lg:sticky lg:top-4">
              <ProductFilters />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[var(--muted)]">
                {total} product{total !== 1 ? "s" : ""} found
                {pages > 1 ? ` · page ${page} of ${pages}` : ""}
              </p>
              <ProductSortSelect />
            </div>

            {products.length === 0 ? (
              <EmptyState
                className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]"
                title="No products match your filters"
                description="Try adjusting filters — or post a part request so sellers can come to you."
                action={
                  <Link
                    href={requestSubmitHref({
                      q: params.search,
                      brand: params.brand,
                      deviceModel: params.deviceModel || params.model,
                      partType: params.partType,
                      deviceCategory: params.deviceCategory || params.category,
                      city: params.city,
                    })}
                    className={cn(buttonVariants())}
                  >
                    Post a part request
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-5">
                {products.map((product, index) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    priority={index < 3}
                  />
                ))}
              </div>
            )}

            {pages > 1 ? (
              <nav
                aria-label="Pagination"
                className="mt-6 flex flex-wrap items-center justify-center gap-2"
              >
                {page > 1 ? (
                  <Link
                    href={listingHref(raw, page > pages ? pages : page - 1)}
                    className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--ink-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
                  >
                    Previous
                  </Link>
                ) : null}
                {listingPageNumbers(page, pages).map((pageNumber) =>
                  pageNumber === page ? (
                    <span
                      key={pageNumber}
                      aria-current="page"
                      className="rounded-[var(--radius)] border border-[var(--brand)] bg-[var(--brand-soft)] px-3 py-2 text-sm font-semibold text-[var(--brand)]"
                    >
                      {pageNumber}
                    </span>
                  ) : (
                    <Link
                      key={pageNumber}
                      href={listingHref(raw, pageNumber)}
                      className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--ink-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
                    >
                      {pageNumber}
                    </Link>
                  ),
                )}
                {page < pages ? (
                  <Link
                    href={listingHref(raw, page + 1)}
                    className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--ink-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
                  >
                    Next
                  </Link>
                ) : null}
              </nav>
            ) : null}

            <AdSlot
              id="products-grid-bottom"
              size="leaderboard"
              className="mt-6"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
