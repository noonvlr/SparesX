import type { Metadata } from "next";
import { PageHeader, Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "About SparesX",
  description:
    "Learn about SparesX, India's premier B2B marketplace for mobile spare parts. Connecting verified technicians with quality parts since inception.",
  keywords: [
    "about sparesx",
    "mobile parts marketplace",
    "technician network",
    "spare parts platform",
  ],
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About SparesX | Mobile Spare Parts Marketplace",
    description:
      "Learn about SparesX, India's premier B2B marketplace connecting verified technicians with quality mobile spare parts.",
    type: "website",
    url: "https://spares-x-h1cj.vercel.app/about",
  },
  twitter: {
    card: "summary_large_image",
    title: "About SparesX",
    description: "India's premier B2B marketplace for mobile spare parts.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <PageHeader
          className="mb-10"
          title="About SparesX"
          description="SparesX is an India-only online marketplace that connects buyers and sellers of mobile and device spare parts. Anyone in India can register and sell."
        />

        <div className="mb-8 rounded-[var(--radius-lg)] border border-[var(--brand-muted)] bg-[var(--brand-soft)] p-5 text-sm text-[var(--ink-secondary)] leading-relaxed">
          <p className="font-semibold mb-1 text-[var(--brand-hover)]">
            Important
          </p>
          <p>
            SparesX is not the seller. We only provide the platform for buyers
            and sellers to connect. There are no in-app payments yet — payment
            and shipping are arranged directly between users.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <Card className="p-6 sm:p-7">
            <h2 className="text-xl font-semibold mb-3 text-[var(--ink)]">
              Our Mission
            </h2>
            <p className="text-[var(--muted)]">
              Help repair professionals and spare-part businesses find each
              other faster with clear listings, requests, and direct
              communication.
            </p>
          </Card>
          <Card className="p-6 sm:p-7">
            <h2 className="text-xl font-semibold mb-3 text-[var(--ink)]">
              Why SparesX
            </h2>
            <p className="text-[var(--muted)]">
              Built for India&apos;s spare-parts trade: marketplace-only tools,
              transparent listings, and policies that set clear expectations for
              buyers and sellers.
            </p>
          </Card>
        </div>
      </section>
    </main>
  );
}
