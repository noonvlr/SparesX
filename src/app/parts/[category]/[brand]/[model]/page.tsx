import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { EmptyState, PageHeader } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/button-variants";
import { fetchProductList } from "@/lib/products/listQuery";
import { SITE_NAME, absoluteUrl, productPath } from "@/lib/seo/site";

type Params = {
  params: Promise<{ category: string; brand: string; model: string }>;
};

/** Decoded, title-cased URL segments for display and metadata. */
function decodeSegments(raw: {
  category: string;
  brand: string;
  model: string;
}) {
  const clean = (value: string) =>
    decodeURIComponent(value).replace(/[-_]+/g, " ").trim();

  const titleCase = (value: string) =>
    value.replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    category: titleCase(clean(raw.category)),
    brand: titleCase(clean(raw.brand)),
    model: clean(raw.model),
    path: `/parts/${raw.category}/${raw.brand}/${raw.model}`,
  };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const raw = await params;
  const { category, brand, model, path } = decodeSegments(raw);

  const title = `${brand} ${model} ${category} Parts`;
  const description = `Buy ${brand} ${model} ${category.toLowerCase()} spare parts from technicians across India. Compare prices and condition, then contact the seller directly on ${SITE_NAME}.`;

  const { total } = await fetchProductList({
    category: raw.category,
    brand,
    deviceModel: model,
  });

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      type: "website",
      url: path,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
    },
    // An empty landing page is thin content; keep it out of the index.
    robots: { index: total > 0, follow: true },
  };
}

export default async function PartsPage({ params }: Params) {
  const raw = await params;
  const { category, brand, model, path } = decodeSegments(raw);

  const { products, total } = await fetchProductList({
    category: raw.category,
    brand,
    deviceModel: model,
    limit: "24",
  });

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: absoluteUrl("/products"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${brand} ${model} ${category}`,
        item: absoluteUrl(path),
      },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${brand} ${model} ${category} parts`,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(productPath(product)),
      name: product.name,
    })),
  };

  const browseHref = `/products?brand=${encodeURIComponent(
    brand,
  )}&deviceModel=${encodeURIComponent(model)}`;

  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {products.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      ) : null}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 text-sm text-[var(--muted)]"
        >
          <Link href="/" className="hover:text-[var(--brand)]">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-[var(--brand)]">
            Products
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--ink-secondary)]">
            {brand} {model}
          </span>
        </nav>

        <PageHeader
          className="mb-6"
          title={`${brand} ${model} ${category} parts`}
          description={`${total} listing${total === 1 ? "" : "s"} for the ${brand} ${model}. Check seller badges and Trust Score, then contact them directly — SparesX does not process payments or hold stock.`}
        />

        <div className="mb-8 max-w-3xl space-y-3 text-sm leading-relaxed text-[var(--ink-secondary)]">
          <p>
            Looking for {category.toLowerCase()} parts for the {brand} {model}?
            Independent repair technicians across India list their spare
            inventory here, so you can compare condition and price before
            committing. Listings usually include displays, batteries, charging
            ports, cameras, and housings, depending on what sellers currently
            hold.
          </p>
          <p>
            Check each seller&apos;s trust score and verification badges before
            you reach out. If nobody has the part you need yet,{" "}
            <Link
              href="/requests?tab=submit"
              className="font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]"
            >
              post a part request
            </Link>{" "}
            and sellers will come to you.
          </p>
          <nav
            aria-label="Related searches"
            className="flex flex-wrap gap-2 pt-1"
          >
            <Link
              href={`/products?brand=${encodeURIComponent(brand)}`}
              className="text-xs font-semibold rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[var(--ink)] hover:border-[var(--brand-muted)] hover:text-[var(--brand)]"
            >
              All {brand} parts
            </Link>
            <Link
              href={`/products?brand=${encodeURIComponent(brand)}&deviceModel=${encodeURIComponent(model)}`}
              className="text-xs font-semibold rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[var(--ink)] hover:border-[var(--brand-muted)] hover:text-[var(--brand)]"
            >
              {brand} {model} listings
            </Link>
            <Link
              href={`/products?partType=${encodeURIComponent(raw.category)}`}
              className="text-xs font-semibold rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[var(--ink)] hover:border-[var(--brand-muted)] hover:text-[var(--brand)]"
            >
              Browse {category.toLowerCase()}
            </Link>
            <Link
              href="/sellers"
              className="text-xs font-semibold rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[var(--ink)] hover:border-[var(--brand-muted)] hover:text-[var(--brand)]"
            >
              Find sellers
            </Link>
          </nav>
        </div>

        {products.length === 0 ? (
          <EmptyState
            className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]"
            title="No listings for this model yet"
            description="Post a request and matching sellers can contact you when they have the part."
            action={
              <Link
                href="/requests?tab=submit"
                className={buttonVariants({ variant: "primary" })}
              >
                Post a request
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {products.map((product, index) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  priority={index < 4}
                />
              ))}
            </div>

            {total > products.length ? (
              <div className="mt-8 text-center">
                <Link
                  href={browseHref}
                  className={buttonVariants({ variant: "outline" })}
                >
                  See all {total} {brand} {model} listings
                </Link>
              </div>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
