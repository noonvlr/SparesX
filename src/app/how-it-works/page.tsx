import type { Metadata } from "next";
import { PageHeader, Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "See how SparesX works for technicians: browse or request parts, connect with sellers, and finalize deals directly — SparesX does not process payments.",
  keywords: [
    "how it works",
    "buying process",
    "marketplace guide",
    "spare parts workflow",
    "technician marketplace",
  ],
  alternates: {
    canonical: "/how-it-works",
  },
  openGraph: {
    title: "How It Works | SparesX",
    description:
      "Browse or request parts, connect with technicians, and finalize deals directly. SparesX doesn't process payments.",
    type: "website",
    url: "/how-it-works",
  },
  twitter: {
    card: "summary_large_image",
    title: "How It Works | SparesX",
    description:
      "Connect with technicians and finalize deals directly. SparesX doesn't process payments.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <PageHeader
          className="mb-10"
          title="How SparesX Works"
          description="A simple workflow built for technicians and buyers."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Browse & Request",
              text: "Search products or submit a request with exact part details.",
            },
            {
              title: "Seller Responses",
              text: "Technicians respond with availability and pricing. Check badges and Trust Score on their profile before you deal.",
            },
            {
              title: "Connect & Finalize",
              text: "Agree on price and complete the deal directly with the technician. SparesX doesn't process payments — you handle the exchange between yourselves.",
            },
          ].map((step, index) => (
            <Card key={step.title} className="p-6">
              <div className="text-[var(--brand)] font-bold text-xl mb-2">
                {index + 1}.
              </div>
              <h2 className="text-lg font-semibold mb-2 text-[var(--ink)]">
                {step.title}
              </h2>
              <p className="text-[var(--muted)] text-sm">{step.text}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
