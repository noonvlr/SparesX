import type { Metadata } from "next";
import Link from "next/link";
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

type RawSearchParams = Record<string, string | string[] | undefined>;

const FILTER_KEYS = [
  "deviceCategory",
  "category",
  "brand",
  "deviceModel",
  "model",
  "partType",
  "condition",
  "minPrice",
  "maxPrice",
  "search",
  "city",
  "nearby",
  "sellerType",
  "negotiable",
] as const;

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

/** Filtered and paginated views are near-duplicates, so only /products is indexed. */
function isFilteredView(raw: RawSearchParams) {
  const pageNumber = parseInt(firstParam(raw.page) || "1", 10) || 1;
  if (pageNumber > 1) return true;
  return FILTER_KEYS.some((key) => Boolean(firstParam(raw[key])));
}

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

function buildPageHref(raw: RawSearchParams, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    const single = firstParam(value);
    if (single && key !== "page") params.set(key, single);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}): Promise<Metadata> {
  const raw = await searchParams;
  const filtered = isFilteredView(raw);
  const summary = describeFilters(toListParams(raw));

  const title =
    filtered && summary ? summary : "Browse Mobile Spare Parts";
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
    alternates: { canonical: "/products" },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      type: "website",
      url: "/products",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
    },
    // Filter permutations are infinite; keep the crawl budget on /products
    // and on the individual listings these pages link to.
    robots: { index: !filtered, follow: true },
  };
}

export default async function BrowseProductsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const raw = await searchParams;
  const params = toListParams(raw);
  const { products, total, page, pages } = await fetchProductList(params);

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
                description="Try adjusting your search criteria or clearing some filters."
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
                    href={buildPageHref(raw, page - 1)}
                    className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--ink-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
                  >
                    Previous
                  </Link>
                ) : null}
                <span className="px-2 text-sm text-[var(--muted)]">
                  Page {page} of {pages}
                </span>
                {page < pages ? (
                  <Link
                    href={buildPageHref(raw, page + 1)}
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
