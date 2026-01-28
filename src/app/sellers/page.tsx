import type { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Verified Sellers",
  description:
    "Browse verified technicians on SparesX. Connect with trusted sellers for mobile spare parts. All sellers are reviewed for quality and reliability.",
  keywords: [
    "verified sellers",
    "technician network",
    "trusted sellers",
    "spare parts sellers",
    "mobile repair technicians",
  ],
  alternates: {
    canonical: "/sellers",
  },
  openGraph: {
    title: "Verified Sellers | SparesX",
    description:
      "Browse verified technicians on SparesX. Connect with trusted sellers for mobile spare parts.",
    type: "website",
    url: "https://spares-x-h1cj.vercel.app/sellers",
  },
  twitter: {
    card: "summary_large_image",
    title: "Verified Sellers | SparesX",
    description: "Connect with trusted mobile spare parts sellers.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function SellersPage() {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || (host ? `${protocol}://${host}` : "");

  const res = await fetch(`${baseUrl}/api/sellers`, { cache: "no-store" });
  const data = res.ok ? await res.json() : { sellers: [] };
  const sellers = data.sellers || [];

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Verified Sellers
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Browse active technicians vetted on SparesX. Connect for reliable
            parts sourcing.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sellers.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-500">
              No verified sellers found yet.
            </div>
          ) : (
            sellers.map(
              (seller: { _id: string; name: string; createdAt: string }) => (
                <article
                  key={seller._id}
                  className="bg-white border border-gray-100 rounded-xl shadow-sm p-5"
                >
                  <h2 className="text-lg font-semibold text-gray-900">
                    {seller.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Active since{" "}
                    {new Date(seller.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </p>
                </article>
              ),
            )
          )}
        </div>
      </section>
    </main>
  );
}
