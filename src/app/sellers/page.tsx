import type { Metadata } from "next";
import { headers } from "next/headers";
import TrustBadges from "@/components/TrustBadges";

export const metadata: Metadata = {
  title: "Sellers",
  description:
    "Browse technicians on SparesX. Phone-verified and trusted sellers for mobile spare parts across India.",
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
    title: "Sellers | SparesX",
    description:
      "Browse technicians on SparesX. Connect with phone-verified and trusted sellers.",
    type: "website",
    url: "https://spares-x-h1cj.vercel.app/sellers",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sellers | SparesX",
    description: "Connect with phone-verified mobile spare parts sellers.",
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
            Sellers
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Look for verification (blue), reputation (gold), and special (purple)
            badges when choosing a seller.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sellers.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-500">
              No sellers found yet.
            </div>
          ) : (
            sellers.map(
              (seller: {
                _id: string;
                name: string;
                createdAt: string;
                city?: string;
                state?: string;
                phoneVerified?: boolean;
                emailVerified?: boolean;
                kycVerified?: boolean;
                businessVerified?: boolean;
                addressVerified?: boolean;
                isTrusted?: boolean;
                trustScore?: number;
                trustLabel?: string;
                badges?: import("@/lib/badges/catalog").PublicBadge[];
                activeBadgeKeys?: string[];
              }) => (
                <article
                  key={seller._id}
                  className="bg-white border border-gray-100 rounded-xl shadow-sm p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {seller.name}
                    </h2>
                    <TrustBadges
                      phoneVerified={seller.phoneVerified}
                      emailVerified={seller.emailVerified}
                      kycVerified={seller.kycVerified}
                      businessVerified={seller.businessVerified}
                      addressVerified={seller.addressVerified}
                      isTrusted={seller.isTrusted}
                      trustScore={seller.trustScore}
                      trustLabel={seller.trustLabel}
                      badges={seller.badges}
                      activeBadgeKeys={seller.activeBadgeKeys}
                      showScore
                    />
                  </div>
                  {(seller.city || seller.state) && (
                    <p className="text-sm text-gray-500 mt-1">
                      {[seller.city, seller.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
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
