import type { Metadata } from "next";
import { PageHeader, Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions",
  description:
    "Find answers to common questions about buying and selling mobile spare parts on SparesX. Learn about verification, warranties, and more.",
  keywords: [
    "spare parts faq",
    "common questions",
    "help center",
    "buying guide",
    "seller verification",
  ],
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "Frequently Asked Questions | SparesX",
    description:
      "Find answers to common questions about buying and selling mobile spare parts on SparesX.",
    type: "website",
    url: "https://spares-x-h1cj.vercel.app/faq",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ | SparesX",
    description: "Common questions about mobile spare parts marketplace.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const faqs = [
  {
    question: "Who can sell on SparesX?",
    answer: "Verified technicians can list spare parts after registration.",
  },
  {
    question: "How do I request a specific part?",
    answer:
      "Use the Request a Part form with brand, model, and condition details.",
  },
  {
    question: "Do listings include warranty?",
    answer:
      "Warranty terms depend on the seller. Always confirm details before purchase.",
  },
  {
    question: "How are sellers verified?",
    answer:
      "Sellers are reviewed for legitimacy and service quality before approval.",
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <PageHeader
          className="mb-10"
          title="Frequently Asked Questions"
          description="Quick answers for buyers and technicians."
        />

        <div className="space-y-4">
          {faqs.map((faq) => (
            <Card key={faq.question} className="p-6">
              <h2 className="text-lg font-semibold text-[var(--ink)] mb-2">
                {faq.question}
              </h2>
              <p className="text-[var(--muted)] text-sm">{faq.answer}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
