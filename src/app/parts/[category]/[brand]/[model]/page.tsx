import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import {
  BreadcrumbJsonLd,
  Breadcrumbs,
} from "@/components/seo/Breadcrumbs";
import { EmptyState, PageHeader } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/button-variants";
import { fetchProductList } from "@/lib/products/listQuery";
import { slugifyPathSegment } from "@/lib/seo/partsPath";
import { SITE_NAME, absoluteUrl, productPath } from "@/lib/seo/site";

export const revalidate = 3600;

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

  const categorySlug = slugifyPathSegment(raw.category);
  const brandSlug = slugifyPathSegment(raw.brand);
  const modelSlug = slugifyPathSegment(raw.model);

  return {
    category: titleCase(clean(raw.category)),
    brand: titleCase(clean(raw.brand)),
    model: clean(raw.model),
    categorySlug,
    brandSlug,
    modelSlug,
    path: `/parts/${categorySlug || raw.category}/${brandSlug || raw.brand}/${modelSlug || raw.model}`,
  };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const raw = await params;
  const { category, brand, model, path, categorySlug } = decodeSegments(raw);

  const title = `${brand} ${model} ${category} Parts`;
  const description = `Buy ${brand} ${model} ${category.toLowerCase()} spare parts from technicians across India. Compare prices and condition, then contact the seller directly on ${SITE_NAME}.`;

  const { total } = await fetchProductList({
    partType: categorySlug || raw.category,
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
    // Empty or single-listing hubs are thin doorway pages — keep out of the index.
    robots: { index: total >= 2, follow: true },
  };
}

export default async function PartsModelPage({ params }: Params) {
  const raw = await params;
  const {
    category,
    brand,
    model,
    path,
    categorySlug,
    brandSlug,
  } = decodeSegments(raw);

  const { products, total } = await fetchProductList({
    partType: categorySlug || raw.category,
    brand,
    deviceModel: model,
    limit: "24",
  });

  const categoryHref = `/parts/${categorySlug || raw.category}`;
  const brandHref = `${categoryHref}/${brandSlug || raw.brand}`;

  const jsonLdCrumbs = [
    { name: "Parts", href: "/parts" },
    { name: category, href: categoryHref },
    { name: brand, href: brandHref },
    { name: model, href: path },
  ];

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
      <BreadcrumbJsonLd items={jsonLdCrumbs} />
      {products.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      ) : null}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumbs
          items={[
            { name: "Parts", href: "/parts" },
            { name: category, href: categoryHref },
            { name: brand, href: brandHref },
            { name: model },
          ]}
        />

        <PageHeader
          className="mb-6"
          title={`${brand} ${model} ${category} parts`}
          description={`${total} live listing${total === 1 ? "" : "s"} for ${brand} ${model} ${category.toLowerCase()} — compare condition and price, then message the seller on ${SITE_NAME}.`}
        />

        <div className="mb-8 max-w-3xl space-y-3 text-sm leading-relaxed text-[var(--ink-secondary)]">
          <p>
            This hub collects technician-listed {category.toLowerCase()} for the{" "}
            {brand} {model} currently available on {SITE_NAME}. Unlike a retail
            catalog, stock changes as repair shops sell through their inventory,
            so prices and condition vary by seller.
          </p>
          <p>
            Looking for {category.toLowerCase()} parts for the {brand} {model}?
            Compare listings below, then check each technician&apos;s trust score and
            verification badges before you reach out. If nobody has the part you
            need yet,{" "}
            <Link
              href="/requests?tab=submit"
              className="font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]"
            >
              post a part request
            </Link>{" "}
            and technicians will come to you.
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
              href={`/products?partType=${encodeURIComponent(categorySlug || raw.category)}`}
              className="text-xs font-semibold rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[var(--ink)] hover:border-[var(--brand-muted)] hover:text-[var(--brand)]"
            >
              Browse {category.toLowerCase()}
            </Link>
            <Link
              href="/technicians"
              className="text-xs font-semibold rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[var(--ink)] hover:border-[var(--brand-muted)] hover:text-[var(--brand)]"
            >
              Find technicians
            </Link>
          </nav>
        </div>

        {products.length === 0 ? (
          <EmptyState
            className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]"
            title="No listings for this model yet"
            description="Post a request and matching technicians can contact you when they have the part."
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
