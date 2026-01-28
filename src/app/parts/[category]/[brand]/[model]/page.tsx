import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

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
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {decodeURIComponent(category)} • {decodeURIComponent(brand)} •{" "}
            {decodeURIComponent(model)}
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Verified listings for this device model.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-500">
              No listings yet. Try a broader category or submit a request.
            </div>
          ) : (
            products.map((product: any) => (
              <Link
                key={product._id}
                href={`/product/${product._id}`}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition"
              >
                <div className="font-semibold text-gray-900 line-clamp-2">
                  {product.name}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {product.category} • {product.condition}
                </div>
                <div className="text-blue-600 font-bold mt-2">
                  ₹{product.price?.toLocaleString()}
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
