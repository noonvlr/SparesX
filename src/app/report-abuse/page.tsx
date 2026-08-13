import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/legal/LegalPage";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/ui/cn";

export const metadata: Metadata = {
  title: "Report Abuse Policy",
  description: "How to report scams, fraud, or inappropriate content on SparesX.",
  alternates: { canonical: "/report-abuse" },
  robots: { index: true, follow: true },
};

export default function ReportAbusePage() {
  return (
    <LegalPage title="Report Abuse Policy" updated="9 August 2026">
      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">What to Report</h2>
        <p>Please report the following to Support:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Scams or fraudulent listings</li>
          <li>Harassment or threats</li>
          <li>Counterfeit or stolen goods</li>
          <li>Spam or abusive messages</li>
          <li>Impersonation or fake accounts</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">How to Report</h2>
        <p>
          Use the Support form so reports land in the admin queue. Include
          relevant links, screenshots, and usernames wherever possible. We aim
          to review reports within 3–5 business days.
        </p>
        <p className="mt-4">
          <Link
            href="/support?type=abuse&subject=Abuse%20report"
            className={cn(buttonVariants({ variant: "primary", size: "md" }))}
          >
            Open Support report form
          </Link>
        </p>
        <p className="mt-4 text-sm text-[var(--muted)]">
          Reports made in bad faith or with the intent to harass another user may
          themselves be subject to enforcement action.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">Contact</h2>
        <p>
          Prefer the{" "}
          <Link
            href="/support?type=abuse"
            className="text-[var(--brand)] font-semibold underline-offset-2 hover:underline"
          >
            Support form
          </Link>{" "}
          for abuse reports. You can also email{" "}
          <a href="mailto:noon.vlr@gmail.com">noon.vlr@gmail.com</a>
          {" | "}
          <a href="tel:8015606071">8015606071</a>
        </p>
      </section>
    </LegalPage>
  );
}
