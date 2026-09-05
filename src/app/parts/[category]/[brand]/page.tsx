import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BreadcrumbJsonLd,
  Breadcrumbs,
} from "@/components/seo/Breadcrumbs";
import { PageHeader } from "@/components/ui/Card";
import {
  getPartsHubBrand,
  getPartsHubCategory,
  getPartsHubModels,
} from "@/lib/seo/partsHubs";
import { slugifyPathSegment } from "@/lib/seo/partsPath";
import { SITE_NAME } from "@/lib/seo/site";

export const revalidate = 3600;

type Params = {
  params: Promise<{ category: string; brand: string }>;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const raw = await params;
  const categorySlug = slugifyPathSegment(raw.category);
  const brandSlug = slugifyPathSegment(raw.brand);
  const category = categorySlug
    ? await getPartsHubCategory(categorySlug)
    : null;
  const brand =
    category && brandSlug
      ? await getPartsHubBrand(category.slug, brandSlug)
      : null;

  if (!category || !brand) {
    return {
      title: "Parts",
      robots: { index: false, follow: true },
    };
  }

  const path = `/parts/${category.slug}/${brand.slug}`;
  const title = `${category.label} Parts for ${brand.label}`;
  const description = `Browse ${brand.label} ${category.label.toLowerCase()} spare parts by model on ${SITE_NAME}. Compare technician listings across India.`;

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

export default async function PartsBrandPage({ params }: Params) {
  const raw = await params;
  const categorySlug = slugifyPathSegment(raw.category);
  const brandSlug = slugifyPathSegment(raw.brand);
  if (!categorySlug || !brandSlug) notFound();

  const category = await getPartsHubCategory(categorySlug);
  if (!category) notFound();

  const brand = await getPartsHubBrand(category.slug, brandSlug);
  if (!brand) notFound();

  const models = await getPartsHubModels(category.slug, brand.slug);
  if (models.length === 0) notFound();

  const path = `/parts/${category.slug}/${brand.slug}`;
  const jsonLdCrumbs = [
    { name: "Parts", href: "/parts" },
    { name: category.label, href: `/parts/${category.slug}` },
    { name: brand.label, href: path },
  ];

  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <BreadcrumbJsonLd items={jsonLdCrumbs} />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumbs
          items={[
            { name: "Parts", href: "/parts" },
            { name: category.label, href: `/parts/${category.slug}` },
            { name: brand.label },
          ]}
        />

        <PageHeader
          className="mb-6"
          title={`${category.label} parts for ${brand.label}`}
          description={`Select a ${brand.label} model to open the ${category.label.toLowerCase()} hub with live technician listings on ${SITE_NAME}.`}
        />

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {models.map((model) => (
            <li key={model.slug}>
              <Link
                href={model.path}
                className="block rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 hover:border-[var(--brand-muted)] transition-colors"
              >
                <span className="text-base font-semibold text-[var(--ink)]">
                  {model.label}
                </span>
                <span className="mt-1 block text-sm text-[var(--muted)]">
                  {model.count} listing{model.count === 1 ? "" : "s"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
