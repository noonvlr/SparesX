import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";
import ProductDetail from "./_components/ProductDetail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || (host ? `${protocol}://${host}` : "");
  const res = await fetch(`${baseUrl}/api/products/${slug}`, {
    cache: "no-store",
  });
  if (!res.ok) return { title: "Product Not Found" };
  const { product } = await res.json();

  return {
    title: `${product.name} - SparesX`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      type: "website",
      images: product.images || [],
    },
  };
}

export default async function ProductSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || (host ? `${protocol}://${host}` : "");
  const res = await fetch(`${baseUrl}/api/products/${slug}`, {
    cache: "no-store",
  });
  if (!res.ok) return notFound();

  const { product } = await res.json();

  return <ProductDetail product={product} />;
}
