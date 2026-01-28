import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - SparesX",
  description:
    "Answers to common questions about sourcing spare parts on SparesX.",
  openGraph: {
    title: "FAQ - SparesX",
    description:
      "Answers to common questions about sourcing spare parts on SparesX.",
    type: "website",
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
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Quick answers for buyers and technicians.
          </p>
        </header>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <article
              key={faq.question}
              className="bg-white border border-gray-100 rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {faq.question}
              </h2>
              <p className="text-gray-600 text-sm">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
