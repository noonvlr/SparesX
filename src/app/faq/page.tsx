import type { Metadata } from "next";
import { PageHeader, Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions",
  description:
    "Quick answers for buyers and technicians on SparesX — listing, buying, Trust Scores, payments, and more.",
  alternates: { canonical: "/faq" },
  robots: { index: true, follow: true },
};

const faqs = [
  {
    question: "Who can sell on SparesX?",
    answer:
      "Any verified technician or spare-parts business can list on SparesX after completing registration.",
  },
  {
    question: "Is it free to list a part?",
    answer:
      "Yes, listing is free. SparesX doesn't charge commission or listing fees — we're a platform, not a marketplace that takes a cut.",
  },
  {
    question: "How do I request a specific part?",
    answer:
      "Use the Request a Part form with the brand, model, and condition you need. Sellers with matching stock can reach out to you directly.",
  },
  {
    question: "How does buying work?",
    answer:
      'Browse listings and tap "Contact now" to reach the seller directly. Prices marked "Negotiable" are open to discussion between you and the seller.',
  },
  {
    question: "Does SparesX handle payments?",
    answer:
      "No. SparesX doesn't process payments or hold funds — buyers and sellers arrange payment directly between themselves. We recommend agreeing on terms clearly before any transaction.",
  },
  {
    question: "Do listings include a warranty?",
    answer:
      "Warranty terms are set by the individual seller, not SparesX. Always confirm warranty and return terms with the seller before purchasing.",
  },
  {
    question: "How are sellers verified?",
    answer:
      "Every seller is reviewed for legitimacy and service quality before approval, and builds a Trust Score based on their activity and reliability on the platform.",
  },
  {
    question: "What is the Trust Score?",
    answer:
      "A rating that reflects a seller's reliability based on their history on SparesX. Check a seller's profile before buying to see their score.",
  },
  {
    question: "What if something goes wrong with a purchase?",
    answer:
      "Since SparesX isn't party to the transaction, first resolve issues directly with the seller. If that doesn't work, you can raise it through our Dispute Resolution process or report the seller.",
  },
  {
    question: "Is SparesX available outside India?",
    answer: "SparesX currently operates only within India.",
  },
  {
    question: "How long does seller verification take?",
    answer:
      "Verification is typically reviewed within a few business days. You'll be notified once your account is approved.",
  },
  {
    question: "Can I edit or delete a listing after posting it?",
    answer:
      "Yes, you can edit details or remove a listing at any time from your seller dashboard.",
  },
  {
    question: "What happens if I sell a part outside SparesX?",
    answer:
      "Once a part is sold, mark the listing as sold or remove it so buyers don't contact you for parts no longer available.",
  },
  {
    question: "Can I list more than one part at a time?",
    answer:
      "Yes, there's no limit on the number of active listings a verified seller can post.",
  },
  {
    question: "What counts as a prohibited item?",
    answer:
      "Certain parts and devices aren't allowed on SparesX — check our Prohibited Items page for the full list before listing.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <PageHeader
          className="mb-10"
          title="Frequently Asked Questions"
          description="Quick answers for buyers and technicians."
        />

        <div className="space-y-3">
          {faqs.map((faq) => (
            <Card key={faq.question} className="p-5 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-[var(--ink)] mb-2">
                {faq.question}
              </h2>
              <p className="text-[var(--muted)] text-sm leading-relaxed">
                {faq.answer}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
