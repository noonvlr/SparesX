import type { Metadata } from "next";
import { PageHeader, Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "About SparesX",
  description:
    "SparesX is a dedicated marketplace for mobile spare parts in India — built for technicians to list, find, and request parts with Trust Scores, not WhatsApp chaos.",
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
      "A dedicated marketplace for mobile spare parts in India, built for technicians.",
    type: "website",
    url: "https://spares-x-h1cj.vercel.app/about",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <PageHeader
          className="mb-8"
          title="About SparesX"
          description="A dedicated marketplace for mobile spare parts in India, built for technicians."
        />

        <div className="space-y-6 text-[var(--ink-secondary)] text-[15px] leading-relaxed">
          <Card className="p-6 sm:p-7 space-y-4">
            <p>
              Every mobile repair technician knows the problem: a drawer full of
              good parts with nowhere to sell them. A camera module pulled from
              one repair, a screen left over from another — perfectly usable,
              but stuck. For years, the only outlet was word of mouth or a
              crowded WhatsApp group, where listings disappeared within hours
              and finding a specific part meant scrolling through hundreds of
              unrelated messages.
            </p>
            <p>
              SparesX was built to solve that problem directly. Rather than
              another general marketplace where spare parts get lost among
              unrelated listings, SparesX is built exclusively for mobile device
              parts — a dedicated space where technicians can list what they
              have, search for what they need, and request parts that aren&apos;t
              yet available.
            </p>
            <p>
              We&apos;re a marketplace, not a seller. SparesX doesn&apos;t hold
              inventory, set prices, or process payments — we simply give
              technicians and buyers across India a focused platform to connect,
              verify each other through Trust Scores, and trade directly.
            </p>
            <p>
              We&apos;ve just launched, with real listings and a growing base of
              verified technicians already on the platform. We&apos;re refining
              SparesX with the same people it&apos;s built for — technicians who
              understand better than anyone what a functional, no-nonsense
              marketplace should look like.
            </p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-2 text-[var(--ink)]">
                Our Mission
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Give technicians a focused home for spare parts — list what you
                have, find what you need, and request what isn&apos;t listed yet,
                without getting lost in general marketplaces or chat groups.
              </p>
            </Card>
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-2 text-[var(--ink)]">
                Why SparesX
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Built only for mobile parts in India. Trust Scores help you
                decide who to deal with. We connect buyers and sellers directly —
                organized listings, no middleman, and no in-app payments.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
