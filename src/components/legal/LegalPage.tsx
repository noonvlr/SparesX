import Link from "next/link";
import type { ReactNode } from "react";

export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">
          SparesX Legal
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          {title}
        </h1>
        {updated && (
          <p className="text-sm text-gray-500 mb-8">Last updated: {updated}</p>
        )}
        <div className="prose prose-slate max-w-none space-y-6 text-gray-700 text-[15px] leading-relaxed">
          {children}
        </div>
        <div className="mt-10 pt-6 border-t border-gray-200 text-sm text-gray-500">
          <p className="mb-2">
            These documents are a strong starting point for the website and are
            not a substitute for legal advice. Have an Indian lawyer review them
            before launch, especially if you later add payments, escrow, or
            shipping.
          </p>
          <p>
            Questions?{" "}
            <Link href="/support" className="text-blue-600 hover:underline">
              Contact support
            </Link>{" "}
            or email{" "}
            <a
              href="mailto:support@sparesx.in"
              className="text-blue-600 hover:underline"
            >
              support@sparesx.in
            </a>
            .
          </p>
        </div>
      </article>
    </main>
  );
}
