import { notFound, permanentRedirect } from "next/navigation";
import { headers } from "next/headers";
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
import { SITE_NAME, absoluteUrl, productPath, productUrl } from "@/lib/seo/site";

/** Origin for server-side self-fetch (must be this instance, not the public domain). */
async function requestOrigin() {
  const headerList = await headers();
  const host = headerList.get("host");
  if (!host) return absoluteUrl("/");
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

async function loadProduct(slug: string) {
  const origin = await requestOrigin();
  const res = await fetch(`${origin}/api/products/${slug}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const data = await loadProduct(slug);
    if (!data?.product) {
      return {
        title: "Product Not Found",
        description: "The product you're looking for could not be found.",
        robots: { index: false, follow: true },
      };
    }

    const { product } = data;
    // Canonical always points at the slug form so /product/<id> doesn't compete.
    const canonicalUrl = productUrl(product);
    const productImage = product.images?.[0] || "/og-image.jpg";
    const pageTitle = buildProductSeoTitle(product);
    const heading = formatProductHeading(product);
    const description = buildProductSeoDescription(product);

    return {
      // Bare title — root layout appends "| SparesX" via its template.
      title: pageTitle,
      description,
      keywords: buildProductKeywords(product),
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: heading,
        description,
        // "product" is a valid OG type; Next's typings omit it from the union,
        // so cast through the metadata object rather than emitting a body meta.
        ...( { type: "product" } as unknown as { type: "website" }),
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
        title: heading,
        description,
        images: [productImage],
      },
      other: {
        "product:brand": product.brand || "",
        "product:condition":
          product.condition === "used" ? "used" : "new",
        "product:price:amount": String(product.price ?? ""),
        "product:price:currency": "INR",
        "product:retailer_item_id": String(product._id),
      },
      robots: {
        index: true,
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

  let data: any = null;
  try {
    data = await loadProduct(slug);
  } catch {
    return notFound();
  }

  if (!data?.product) return notFound();

  const { product, similarProducts = [] } = data;

  // Consolidate /product/<ObjectId> onto the readable slug so Google never
  // indexes two URLs for the same listing. Query-string visits keep working.
  const looksLikeObjectId =
    Types.ObjectId.isValid(slug) && String(new Types.ObjectId(slug)) === slug;
  if (looksLikeObjectId && product.slug && product.slug !== slug) {
    permanentRedirect(productPath(product));
  }

  const canonicalUrl = productUrl(product);
  const heading = formatProductHeading(product);
  const partTypeLabel = formatPartTypeLabel(product.partType) || "Spare Parts";
  const images = Array.isArray(product.images)
    ? product.images.filter(Boolean)
    : [];

  const brandHref = product.brand
    ? `/products?brand=${encodeURIComponent(product.brand)}`
    : null;
  const partHref = product.partType
    ? `/products?partType=${encodeURIComponent(product.partType)}${
        product.brand ? `&brand=${encodeURIComponent(product.brand)}` : ""
      }`
    : null;

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
    ...(product.brand && brandHref
      ? [{ name: product.brand, href: brandHref }]
      : []),
    ...(product.partType && partHref
      ? [{ name: partTypeLabel, href: partHref }]
      : []),
    { name: heading, href: productPath(product) },
  ];

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: heading,
    description: buildProductSeoDescription(product),
    image: images.length ? images : undefined,
    sku: product.modelNumber || String(product._id),
    mpn: product.modelNumber || undefined,
    brand: product.brand
      ? { "@type": "Brand", name: product.brand }
      : undefined,
    model: product.deviceModel || undefined,
    category: partTypeLabel,
    itemCondition:
      product.condition === "used"
        ? "https://schema.org/UsedCondition"
        : "https://schema.org/NewCondition",
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      itemCondition:
        product.condition === "used"
          ? "https://schema.org/UsedCondition"
          : "https://schema.org/NewCondition",
      url: canonicalUrl,
      seller: product.technician?.name
        ? {
            "@type": "Person",
            name: product.technician.name,
            ...(product.technician.city
              ? {
                  address: {
                    "@type": "PostalAddress",
                    addressLocality: product.technician.city,
                    ...(product.technician.state
                      ? { addressRegion: product.technician.state }
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductDetail
        product={product}
        similarProducts={similarProducts}
        breadcrumbs={breadcrumbs}
      />
    </>
  );
}
