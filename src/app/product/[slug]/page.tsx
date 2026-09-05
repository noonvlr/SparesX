import { notFound, permanentRedirect } from "next/navigation";
import { Types } from "mongoose";
import type { Metadata } from "next";
import ProductDetail from "./_components/ProductDetail";
import {
  buildProductKeywords,
  buildProductSeoDescription,
  buildProductSeoTitle,
  formatProductHeading,
} from "@/lib/seo/productMeta";
import { formatPartTypeLabel } from "@/lib/products/listingTitle";
import { loadPublicProductForPage } from "@/lib/products/loadPublicProduct";
import { SITE_NAME, absoluteUrl, partsPath, productPath, productUrl, slugifyPathSegment } from "@/lib/seo/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const data = await loadPublicProductForPage(slug);
    if (!data.ok || !data.product) {
      return {
        title: "Product Not Found",
        description: "The product you're looking for could not be found.",
        robots: { index: false, follow: true },
      };
    }

    const { product } = data;
    // Canonical always points at the slug form so /product/<id> doesn't compete.
    const canonicalUrl = productUrl(product);
    const productImageRaw =
      (Array.isArray(product.images) && product.images[0]) || "/og-image.jpg";
    const productImage = absoluteUrl(String(productImageRaw));
    const pageTitle = buildProductSeoTitle(product);
    const heading = formatProductHeading(product);
    const description = buildProductSeoDescription(product);
    const isSold = product.status === "sold";
    const isDuplicate =
      Array.isArray(product.tags) &&
      product.tags.includes("possible_duplicate");

    return {
      // Bare title — root layout appends "| SparesX" via its template.
      title: isSold ? `${pageTitle} — Sold` : pageTitle,
      description,
      keywords: buildProductKeywords(product),
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: isSold ? `${heading} (Sold)` : heading,
        description,
        url: canonicalUrl,
        siteName: SITE_NAME,
        locale: "en_IN",
        images: [
          {
            url: productImage,
            width: 800,
            height: 800,
            alt: heading,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: isSold ? `${heading} (Sold)` : heading,
        description,
        images: [productImage],
      },
      other: {
        "product:brand": String(product.brand || ""),
        "product:condition":
          product.condition === "used" ? "used" : "new",
        "product:price:amount": String(product.price ?? ""),
        "product:price:currency": "INR",
        "product:retailer_item_id": String(product._id),
      },
      // Sold + soft-duplicate listings stay reachable but should not rank.
      robots: {
        index: !isSold && !isDuplicate,
        follow: true,
      },
    };
  } catch {
    return {
      title: "Product Not Found",
      description: "The product you're looking for could not be found.",
      robots: { index: false, follow: true },
    };
  }
}

export default async function ProductSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const data = await loadPublicProductForPage(slug);
  if (!data.ok || !data.product) return notFound();

  const { product, similarProducts = [] } = data;

  // One view per PDP render (page body only — not generateMetadata / client refetch).
  if (product.status === "approved" || product.status === "sold") {
    const { trackMarketplaceEvent } = await import("@/lib/analytics/events");
    const tech = product.technician;
    void trackMarketplaceEvent({
      type: "product_view",
      productId: String(product._id),
      brand: typeof product.brand === "string" ? product.brand : undefined,
      partType:
        (typeof product.partType === "string" && product.partType) ||
        (typeof product.category === "string" && product.category) ||
        undefined,
      deviceModel:
        typeof product.deviceModel === "string" ? product.deviceModel : undefined,
      city:
        tech && typeof tech === "object" && tech !== null && "city" in tech
          ? (tech.city as string | undefined) || undefined
          : undefined,
      meta: { source: "product_ssr" },
    });
  }

  // Consolidate /product/<ObjectId> onto the readable slug so Google never
  // indexes two URLs for the same listing. Query-string visits keep working.
  const looksLikeObjectId =
    Types.ObjectId.isValid(slug) && String(new Types.ObjectId(slug)) === slug;
  if (
    looksLikeObjectId &&
    typeof product.slug === "string" &&
    product.slug &&
    product.slug !== slug
  ) {
    permanentRedirect(productPath(product));
  }

  const canonicalUrl = productUrl(product);
  const heading = formatProductHeading(product);
  const partTypeLabel =
    formatPartTypeLabel(
      typeof product.partType === "string" ? product.partType : undefined,
    ) || "Spare Parts";
  const images = Array.isArray(product.images)
    ? product.images.filter(Boolean).map((src) => absoluteUrl(String(src)))
    : [];
  const isSold = product.status === "sold";

  const brandHref =
    typeof product.brand === "string" && product.brand
      ? `/products?brand=${encodeURIComponent(product.brand)}`
      : null;
  const hubHref = partsPath({
    partType: typeof product.partType === "string" ? product.partType : null,
    brand: typeof product.brand === "string" ? product.brand : null,
    deviceModel:
      typeof product.deviceModel === "string" ? product.deviceModel : null,
  });
  const partHref =
    typeof product.partType === "string" && product.partType
      ? `/products?partType=${encodeURIComponent(product.partType)}${
          typeof product.brand === "string" && product.brand
            ? `&brand=${encodeURIComponent(product.brand)}`
            : ""
        }`
      : null;

  const breadcrumbs = hubHref
    ? [
        { name: "Home", href: "/" },
        { name: "Parts", href: "/parts" },
        {
          name: partTypeLabel,
          href: `/parts/${slugifyPathSegment(String(product.partType))}`,
        },
        {
          name: String(product.brand),
          href: `/parts/${slugifyPathSegment(String(product.partType))}/${slugifyPathSegment(String(product.brand))}`,
        },
        {
          name: String(product.deviceModel),
          href: hubHref,
        },
        { name: heading, href: productPath(product) },
      ]
    : [
        { name: "Home", href: "/" },
        { name: "Products", href: "/products" },
        ...(product.brand && brandHref
          ? [{ name: String(product.brand), href: brandHref }]
          : []),
        ...(product.partType && partHref
          ? [{ name: partTypeLabel, href: partHref }]
          : []),
        { name: heading, href: productPath(product) },
      ];

  const technician =
    product.technician && typeof product.technician === "object"
      ? (product.technician as Record<string, unknown>)
      : null;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: heading,
    description: buildProductSeoDescription(product),
    image: images.length ? images : undefined,
    sku:
      (typeof product.modelNumber === "string" && product.modelNumber) ||
      String(product._id),
    mpn:
      typeof product.modelNumber === "string" ? product.modelNumber : undefined,
    brand: product.brand
      ? { "@type": "Brand", name: String(product.brand) }
      : undefined,
    model:
      typeof product.deviceModel === "string" ? product.deviceModel : undefined,
    category: partTypeLabel,
    itemCondition:
      product.condition === "used"
        ? "https://schema.org/UsedCondition"
        : product.condition === "refurbished"
          ? "https://schema.org/RefurbishedCondition"
          : "https://schema.org/NewCondition",
    // Seller ratings belong on the Person/seller node — not AggregateRating on Product
    // (avoids Google rich-result mismatch for marketplace listings).
    ...(technician?._id || technician?.id
      ? {
          seller: {
            "@type": "Person",
            name: (technician.name as string) || "Seller",
            url: absoluteUrl(`/u/${technician._id || technician.id}`),
            ...(typeof technician.averageRating === "number" &&
            technician.averageRating > 0 &&
            typeof technician.ratingCount === "number" &&
            technician.ratingCount > 0
              ? {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: technician.averageRating,
                    reviewCount: technician.ratingCount,
                    bestRating: 5,
                    worstRating: 1,
                  },
                }
              : {}),
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "INR",
      availability: isSold
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
      itemCondition:
        product.condition === "used"
          ? "https://schema.org/UsedCondition"
          : product.condition === "refurbished"
            ? "https://schema.org/RefurbishedCondition"
            : "https://schema.org/NewCondition",
      url: canonicalUrl,
      seller: technician?.name
        ? {
            "@type": "Person",
            name: String(technician.name),
            ...(technician.city
              ? {
                  address: {
                    "@type": "PostalAddress",
                    addressLocality: String(technician.city),
                    ...(technician.state
                      ? { addressRegion: String(technician.state) }
                      : {}),
                    addressCountry: "IN",
                  },
                }
              : {}),
          }
        : undefined,
      areaServed: {
        "@type": "Country",
        name: "IN",
      },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: absoluteUrl(entry.href),
    })),
  };

  return (
    <>
      {/*
        Next's Metadata API rewrites unknown openGraph.type values, so the
        product OG type has to be emitted as a raw meta tag. App Router hoists
        it into <head>. Google rich results use the JSON-LD Product block;
        this mainly helps Facebook/WhatsApp link previews.
      */}
      <meta property="og:type" content="product" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductDetail
        product={product as unknown as Parameters<typeof ProductDetail>[0]["product"]}
        similarProducts={
          similarProducts as unknown as NonNullable<
            Parameters<typeof ProductDetail>[0]["similarProducts"]
          >
        }
        breadcrumbs={breadcrumbs}
      />
    </>
  );
}
