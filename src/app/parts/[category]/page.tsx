import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BreadcrumbJsonLd,
  Breadcrumbs,
} from "@/components/seo/Breadcrumbs";
import { PageHeader } from "@/components/ui/Card";
import {
  getPartsHubBrands,
  getPartsHubCategory,
} from "@/lib/seo/partsHubs";
import { slugifyPathSegment } from "@/lib/seo/partsPath";
import { SITE_NAME } from "@/lib/seo/site";

export const revalidate = 3600;

type Params = {
  params: Promise<{ category: string }>;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category: raw } = await params;
  const categorySlug = slugifyPathSegment(raw);
  const category = categorySlug
    ? await getPartsHubCategory(categorySlug)
    : null;

  if (!category) {
    return {
      title: "Parts",
      robots: { index: false, follow: true },
    };
  }

  const path = `/parts/${category.slug}`;
  const title = `${category.label} Parts`;
  const description = `Browse ${category.label.toLowerCase()} spare parts by brand on ${SITE_NAME}. Compare technician listings across India.`;

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
    robots: { index: true, follow: true },
  };
}

export default async function PartsCategoryPage({ params }: Params) {
  const { category: raw } = await params;
  const categorySlug = slugifyPathSegment(raw);
  if (!categorySlug) notFound();

  const category = await getPartsHubCategory(categorySlug);
  if (!category) notFound();

  const brands = await getPartsHubBrands(category.slug);
  if (brands.length === 0) notFound();

  const path = `/parts/${category.slug}`;
  const jsonLdCrumbs = [
    { name: "Parts", href: "/parts" },
    { name: category.label, href: path },
  ];

  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <BreadcrumbJsonLd items={jsonLdCrumbs} />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumbs
          items={[
            { name: "Parts", href: "/parts" },
            { name: category.label },
          ]}
        />

        <PageHeader
          className="mb-6"
          title={`${category.label} parts`}
          description={`Choose a brand to see ${category.label.toLowerCase()} models with active technician listings on ${SITE_NAME}.`}
        />

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {brands.map((brand) => (
            <li key={brand.slug}>
              <Link
                href={`/parts/${category.slug}/${brand.slug}`}
                className="block rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 hover:border-[var(--brand-muted)] transition-colors"
              >
                <span className="text-base font-semibold text-[var(--ink)]">
                  {brand.label}
                </span>
                <span className="mt-1 block text-sm text-[var(--muted)]">
                  {brand.modelCount} model
                  {brand.modelCount === 1 ? "" : "s"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
