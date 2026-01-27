import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/products/${id}`,
    { cache: "no-store" },
  );
  if (!res.ok) return { title: "Product Not Found" };
  const { product } = await res.json();

  return {
    title: `${product.name} - SparesX`,
    description: product.description,
    keywords: [
      product.category,
      product.condition,
      "mobile spare parts",
      product.name,
    ],
    openGraph: {
      title: product.name,
      description: product.description,
      type: "website",
      images: product.images || [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/products/${id}`,
    { cache: "no-store" },
  );
  if (!res.ok) return notFound();
  const { product } = await res.json();

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-6 sm:py-10 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-7xl mx-auto animate-fade-up">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <a
            href="/products"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 group"
          >
            <svg
              className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Products
          </a>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-fade-up">
          <div className="p-6 sm:p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Product Images */}
              <div className="order-1">
                {product.images && product.images.length > 0 ? (
                  <div className="space-y-4">
                    {/* Main Image */}
                    <div className="relative w-full bg-white rounded-2xl overflow-hidden shadow-xl border-2 border-gray-200">
                      <div className="relative w-full aspect-square flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 sm:p-6">
                        <img
                          src={product.images[0]}
                          alt={`${product.name} - Main Image`}
                          className="w-full h-full object-contain hover:scale-105 transition-transform duration-500 transform-gpu will-change-transform"
                          loading="eager"
                        />
                      </div>
                    </div>

                    {/* Thumbnail Gallery */}
                    {product.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2 sm:gap-3">
                        {product.images.map((img: string, idx: number) => (
                          <div
                            key={idx}
                            className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-all duration-200 cursor-pointer bg-white shadow-md hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center p-2 will-change-transform transform-gpu"
                          >
                            <img
                              src={img}
                              alt={`${product.name} - Image ${idx + 1}`}
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 shadow-inner">
                    <div className="text-center p-6">
                      <svg
                        className="w-20 h-20 mx-auto mb-4 opacity-30"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="font-semibold text-lg">
                        No images available
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Product images will appear here
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="order-2 flex flex-col space-y-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900 leading-tight">
                    {product.name}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="inline-flex items-center bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 px-4 py-2 rounded-full font-semibold text-blue-800 text-sm">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      {product.category}
                    </span>
                    <span
                      className={`inline-flex items-center px-4 py-2 rounded-full font-semibold text-sm border-2 ${
                        product.condition === "new"
                          ? "bg-gradient-to-r from-green-50 to-green-100 border-green-300 text-green-800"
                          : "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300 text-amber-800"
                      }`}
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {product.condition.charAt(0).toUpperCase() +
                        product.condition.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
                  <p className="text-sm font-medium text-blue-700 mb-2">
                    Price
                  </p>
                  <div className="text-4xl sm:text-5xl font-bold text-blue-700">
                    ₹{product.price.toLocaleString()}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 flex-grow">
                  <h2 className="text-xl font-bold mb-3 text-gray-900 flex items-center">
                    <svg
                      className="w-6 h-6 mr-2 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Description
                  </h2>
                  <p className="text-gray-700 leading-relaxed text-base">
                    {product.description}
                  </p>
                </div>

                <div className="pt-6 border-t-2 border-gray-200">
                  <div className="flex items-center text-sm text-gray-500">
                    <svg
                      className="w-5 h-5 mr-2 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="font-medium">Listed on:</span>
                    <span className="ml-2 font-semibold text-gray-700">
                      {new Date(product.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        timeZone: "UTC",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
