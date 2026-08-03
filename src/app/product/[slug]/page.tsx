import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import ProductDetail from "./_components/ProductDetail";
import { formatListingTitle } from "@/lib/products/listingTitle";
import { SITE_NAME, absoluteUrl, productUrl } from "@/lib/seo/site";

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
    const listingTitle = formatListingTitle(product);
    const conditionLabel = product.condition === "used" ? "Used" : "New";
    const pageTitle = `${listingTitle} (${conditionLabel}) | Buy on ${SITE_NAME}`;
    const description =
      product.description ||
      `${listingTitle} in ${conditionLabel.toLowerCase()} condition, listed by a verified technician on SparesX. Connect directly with the seller — SparesX does not process payments.`;

    return {
      title: pageTitle,
      description: description.slice(0, 300),
      keywords: [
        listingTitle,
        product.partType,
        product.brand,
        product.deviceModel,
        product.modelNumber,
        "mobile spare parts",
        "technician listing",
      ].filter(Boolean),
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: listingTitle,
        description,
        type: "website",
        url: canonicalUrl,
        images: [
          {
            url: productImage,
            width: 800,
            height: 800,
            alt: listingTitle,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: listingTitle,
        description,
        images: [productImage],
      },
      other: {
        "og:type": "product",
        "product:price:amount": String(product.price ?? ""),
        "product:price:currency": "INR",
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
  const canonicalUrl = productUrl(product);
  const listingTitle = formatListingTitle(product);
  const partTypeLabel = product.partType || "Spare Parts";

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listingTitle,
    description: product.description || listingTitle,
    image: product.images?.length ? product.images : undefined,
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
        ? { "@type": "Organization", name: product.technician.name }
        : undefined,
      areaServed: "IN",
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: absoluteUrl("/products"),
      },
      ...(product.partType
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: partTypeLabel,
              item: absoluteUrl(
                `/products?partType=${encodeURIComponent(product.partType)}`,
              ),
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: product.partType ? 4 : 3,
        name: listingTitle,
        item: canonicalUrl,
      },
    ],
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
      <ProductDetail product={product} similarProducts={similarProducts} />
    </>
  );
}
