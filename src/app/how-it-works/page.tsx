import type { Metadata } from "next";
import { PageHeader, Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Discover how SparesX connects buyers and technicians. Learn our simple 3-step process: Browse & Request, Get Verified Responses, and Secure Fulfillment.",
  keywords: [
    "how it works",
    "buying process",
    "marketplace guide",
    "spare parts workflow",
  ],
  alternates: {
    canonical: "/how-it-works",
  },
  openGraph: {
    title: "How It Works | SparesX",
    description:
      "Discover how SparesX connects buyers and technicians. Simple 3-step process to get the spare parts you need.",
    type: "website",
    url: "https://spares-x-h1cj.vercel.app/how-it-works",
  },
  twitter: {
    card: "summary_large_image",
    title: "How It Works | SparesX",
    description: "Learn our simple process for buying mobile spare parts.",
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
              title: "Verified Responses",
              text: "Technicians respond with availability and pricing.",
            },
            {
              title: "Secure Fulfillment",
              text: "Compare offers, confirm, and complete the purchase securely.",
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
