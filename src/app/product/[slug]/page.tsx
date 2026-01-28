import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetail from "./_components/ProductDetail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://spares-x-h1cj.vercel.app";

  try {
    const res = await fetch(`${baseUrl}/api/products/${slug}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        title: "Product Not Found",
        description: "The product you're looking for could not be found.",
        robots: { index: false, follow: true },
      };
    }

    const { product } = await res.json();
    const productUrl = `${baseUrl}/product/${slug}`;
    const productImage = product.images?.[0] || "/og-image.jpg";

    return {
      title: `${product.name} | Buy Online`,
      description:
        product.description ||
        `Buy ${product.name} from verified sellers on SparesX. Quality assured mobile spare parts with fast delivery.`,
      keywords: [
        product.name,
        product.category,
        product.brand,
        "mobile spare parts",
        "buy online",
        "genuine parts",
      ],
      alternates: {
        canonical: productUrl,
      },
      openGraph: {
        title: product.name,
        description: product.description || `Buy ${product.name} online`,
        type: "website",
        url: productUrl,
        siteName: "SparesX",
        images: [
          {
            url: productImage,
            width: 800,
            height: 800,
            alt: product.name,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: product.name,
        description: product.description || `Buy ${product.name} online`,
        images: [productImage],
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch (error) {
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
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://spares-x-h1cj.vercel.app";

  try {
    const res = await fetch(`${baseUrl}/api/products/${slug}`, {
      cache: "no-store",
    });

    if (!res.ok) return notFound();

    const { product } = await res.json();

    // JSON-LD structured data for product
    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      image: product.images?.[0],
      offers: {
        "@type": "Offer",
        price: product.price,
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
        url: `${baseUrl}/product/${slug}`,
      },
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
        <ProductDetail product={product} />
      </>
    );
  } catch (error) {
    return notFound();
  }
}
