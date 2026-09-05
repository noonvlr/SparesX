import type { Metadata } from "next";
import Link from "next/link";
import {
  BreadcrumbJsonLd,
  Breadcrumbs,
} from "@/components/seo/Breadcrumbs";
import { PageHeader } from "@/components/ui/Card";
import { getPartsHubCategories } from "@/lib/seo/partsHubs";
import { SITE_NAME } from "@/lib/seo/site";

export const revalidate = 3600;

const PATH = "/parts";

export const metadata: Metadata = {
  title: "Parts",
  description: `Browse spare parts by type on ${SITE_NAME}. Explore categories with live technician listings across India.`,
  alternates: { canonical: PATH },
  openGraph: {
    title: `Parts | ${SITE_NAME}`,
    description: `Browse spare parts by type on ${SITE_NAME}. Explore categories with live technician listings.`,
    type: "website",
    url: PATH,
  },
  twitter: {
    card: "summary_large_image",
    title: `Parts | ${SITE_NAME}`,
    description: `Browse spare parts by type on ${SITE_NAME}.`,
  },
  robots: { index: true, follow: true },
};

export default async function PartsIndexPage() {
  const categories = await getPartsHubCategories();

  const jsonLdCrumbs = [{ name: "Parts", href: PATH }];

  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <BreadcrumbJsonLd items={jsonLdCrumbs} />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumbs items={[{ name: "Parts" }]} />

        <PageHeader
          className="mb-6"
          title="Parts"
          description={`Browse spare part types with active technician listings on ${SITE_NAME}. Each category links to brands and models with enough stock to be useful.`}
        />

        {categories.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No part categories with enough live listings yet. Check back soon or{" "}
            <Link
              href="/products"
              className="font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]"
            >
              browse all products
            </Link>
            .
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/parts/${category.slug}`}
                  className="block rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 hover:border-[var(--brand-muted)] transition-colors"
                >
                  <span className="text-base font-semibold text-[var(--ink)]">
                    {category.label}
                  </span>
                  <span className="mt-1 block text-sm text-[var(--muted)]">
                    {category.brandCount} brand
                    {category.brandCount === 1 ? "" : "s"} · {category.hubCount}{" "}
                    model hub{category.hubCount === 1 ? "" : "s"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
