import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trust Score Explained | SparesX",
  description:
    "How SparesX trust scores and badges work — verification, ratings, and reputation bands from 0 to 100.",
  alternates: { canonical: "/trust-score" },
  openGraph: {
    title: "Trust Score Explained | SparesX",
    description:
      "Learn how SparesX calculates trust scores and what badges mean for sellers.",
    type: "website",
  },
};

const SCORE_BANDS = [
  { range: "0–20", label: "New User", hint: "Just getting started" },
  { range: "21–40", label: "Growing", hint: "Building verification & activity" },
  { range: "41–60", label: "Trusted", hint: "Solid verification and early reputation" },
  { range: "61–80", label: "Reliable", hint: "Strong track record" },
  { range: "81–100", label: "Elite", hint: "Top-tier trust signals" },
];

const POINTS = [
  { label: "Mobile verified", points: "+10" },
  { label: "Email verified", points: "+5" },
  { label: "KYC verified", points: "+20" },
  { label: "Business verified", points: "+10" },
  { label: "Address verified", points: "+5" },
  { label: "Account age", points: "up to +10" },
  { label: "Completed sales", points: "up to +15" },
  { label: "Positive ratings", points: "up to +15" },
  { label: "Fast response rate", points: "up to +5" },
  { label: "Low complaint rate", points: "up to +5" },
  { label: "Trusted seller (admin)", points: "+5" },
  { label: "Special recognition badges", points: "up to +5" },
];

export default function TrustScorePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <header className="mb-10">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">
            Transparency
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            How Trust Score works
          </h1>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
            Every SparesX account has a Trust Score from{" "}
            <strong className="text-gray-900">0 to 100</strong>. It is calculated
            automatically from verification, marketplace activity, and ratings —
            so buyers can judge sellers at a glance, and sellers know what to
            improve.
          </p>
        </header>

        <section className="mb-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Score bands</h2>
          <p className="text-sm text-gray-600 mb-5">
            Your score maps to a simple label shown next to badges on profiles
            and listings.
          </p>
          <ul className="space-y-3">
            {SCORE_BANDS.map((b) => (
              <li
                key={b.range}
                className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 rounded-xl border border-gray-100 px-4 py-3"
              >
                <span className="text-sm font-bold text-gray-900 w-16 shrink-0">
                  {b.range}
                </span>
                <span className="text-sm font-semibold text-blue-700">
                  {b.label}
                </span>
                <span className="text-sm text-gray-500 sm:ml-auto">{b.hint}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            What adds to your score
          </h2>
          <p className="text-sm text-gray-600 mb-5">
            Points stack up to a maximum of 100. Completing verification and
            earning good ratings is the fastest way to climb.
          </p>
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-gray-600">
                  <th className="px-4 py-2.5 font-semibold">Factor</th>
                  <th className="px-4 py-2.5 font-semibold text-right">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                {POINTS.map((row) => (
                  <tr key={row.label} className="border-t border-gray-100">
                    <td className="px-4 py-2.5 text-gray-800">{row.label}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                      {row.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Badges vs Trust Score</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            The Trust Score is a single number.{" "}
            <strong className="text-gray-900">Badges</strong> are separate
            symbols that explain why someone is trustworthy:
          </p>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
              <span className="font-semibold text-blue-900">Verification (blue)</span>
              {" — "}
              Mobile, Email, KYC, Business, Address. Confirms identity and
              contact checks.
            </li>
            <li className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
              <span className="font-semibold text-amber-950">
                Reputation (gold)
              </span>
              {" — "}
              Trusted / Top / Elite Seller. Only the highest earned reputation
              badge is shown. Based on verification + sales + ratings +
              activity (or admin grant while metrics ramp up).
            </li>
            <li className="rounded-xl bg-violet-50 border border-violet-100 px-4 py-3">
              <span className="font-semibold text-violet-950">
                Special (purple)
              </span>
              {" — "}
              Official Store, Verified Technician, Founding Member, Moderator,
              Administrator. Manually or system-awarded roles.
            </li>
          </ul>
        </section>

        <section className="mb-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7 space-y-3">
          <h2 className="text-xl font-bold text-gray-900">Ratings</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            After a mutual in-app chat with a seller, buyers can rate overall
            experience, behaviour, and response. Those reviews update the
            seller&apos;s average rating, which feeds the Trust Score and can
            unlock reputation badges over time.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            SparesX does not process payments in-app yet — ratings are based on
            real enquiry conversations, not checkout.
          </p>
        </section>

        <section className="mb-10 rounded-2xl bg-slate-900 text-slate-200 p-5 sm:p-7 space-y-3">
          <h2 className="text-xl font-bold text-white">Fairness notes</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-300">
            <li>Users cannot assign badges or scores to themselves.</li>
            <li>
              KYC, business, and many special badges require admin review.
            </li>
            <li>
              Reputation badges can be revoked if performance drops or policy
              is violated.
            </li>
            <li>
              Contact details stay private on public profiles — trust signals
              are what others see first.
            </li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/verify"
            className="inline-flex px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
          >
            Complete verification
          </Link>
          <Link
            href="/sellers"
            className="inline-flex px-5 py-2.5 rounded-xl border border-gray-300 text-gray-800 text-sm font-semibold hover:bg-gray-50"
          >
            Browse sellers
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex px-5 py-2.5 rounded-xl border border-gray-300 text-gray-800 text-sm font-semibold hover:bg-gray-50"
          >
            How SparesX works
          </Link>
        </div>
      </article>
    </main>
  );
}
