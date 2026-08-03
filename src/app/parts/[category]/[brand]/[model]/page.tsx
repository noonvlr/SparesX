import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Card, EmptyState, PageHeader } from "@/components/ui/Card";
import { productPath } from "@/lib/seo/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; brand: string; model: string }>;
}): Promise<Metadata> {
  const { category, brand, model } = await params;
  const title = `${decodeURIComponent(category)} ${decodeURIComponent(
    brand,
  )} ${decodeURIComponent(model)} Parts - SparesX`;
  const description = `Browse ${brand} ${model} spare parts in ${category}. Verified listings from technicians.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function PartsPage({
  params,
}: {
  params: Promise<{ category: string; brand: string; model: string }>;
}) {
  const { category, brand, model } = await params;
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || (host ? `${protocol}://${host}` : "");

  const search = `${decodeURIComponent(brand)} ${decodeURIComponent(model)}`;
  const res = await fetch(
    `${baseUrl}/api/products?category=${encodeURIComponent(
      category,
    )}&search=${encodeURIComponent(search)}`,
    { cache: "no-store" },
  );
  const data = res.ok ? await res.json() : { products: [] };
  const products = data.products || [];

  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <PageHeader
          className="mb-8"
          title={`${decodeURIComponent(category)} • ${decodeURIComponent(brand)} • ${decodeURIComponent(model)}`}
          description="Verified listings for this device model."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.length === 0 ? (
            <EmptyState
              className="col-span-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]"
              title="No listings yet"
              description="Try a broader category or submit a request."
            />
          ) : (
            products.map((product: any) => (
              <Link key={product._id} href={productPath(product)}>
                <Card hover className="p-4 h-full">
                  <div className="font-semibold text-[var(--ink)] line-clamp-2">
                    {product.name}
                  </div>
                  <div className="text-sm text-[var(--muted)] mt-1">
                    {product.category} • {product.condition}
                  </div>
                  <div className="text-[var(--brand)] font-bold mt-2">
                    ₹{product.price?.toLocaleString()}
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
