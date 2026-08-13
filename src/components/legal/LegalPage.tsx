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
    <main className="min-h-screen bg-[var(--surface-2)]">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand)] mb-2">
          SparesX Legal
        </p>
        <h1 className="text-heading text-[var(--ink)] mb-2">
          {title}
        </h1>
        {updated && (
          <p className="text-sm text-[var(--muted)] mb-8">
            Last updated: {updated}
          </p>
        )}
        <div
          className="prose-long max-w-none space-y-6 text-[var(--ink-secondary)] text-[15px] sm:text-base
            [&_h2]:text-[var(--ink)] [&_h2]:text-title [&_h2]:tracking-tight
            [&_h3]:text-[var(--ink)] [&_h3]:text-subtitle
            [&_strong]:text-[var(--ink)] [&_strong]:font-semibold
            [&_a]:text-[var(--brand)] [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-[var(--brand-hover)]
            [&_section]:bg-[var(--surface)] [&_section]:rounded-[var(--radius-lg)] [&_section]:border [&_section]:border-[var(--border)] [&_section]:p-5 sm:[&_section]:p-6 [&_section]:shadow-[var(--shadow-sm)]"
        >
          {children}
        </div>
      </article>
    </main>
  );
}
