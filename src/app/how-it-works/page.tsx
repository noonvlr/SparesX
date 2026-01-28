import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works - SparesX",
  description:
    "Understand how buyers and technicians connect on SparesX to source spare parts quickly.",
  openGraph: {
    title: "How It Works - SparesX",
    description:
      "Understand how buyers and technicians connect on SparesX to source spare parts quickly.",
    type: "website",
  },
};

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            How SparesX Works
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            A simple workflow built for technicians and buyers.
          </p>
        </header>

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
            <article
              key={step.title}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"
            >
              <div className="text-blue-600 font-bold text-xl mb-2">
                {index + 1}.
              </div>
              <h2 className="text-lg font-semibold mb-2 text-gray-900">
                {step.title}
              </h2>
              <p className="text-gray-600 text-sm">{step.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
