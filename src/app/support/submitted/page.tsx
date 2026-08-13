"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/ui/cn";

function SubmittedInner() {
  const params = useSearchParams();
  const caseNumber = params.get("n");
  const id = params.get("id");
  const duplicate = params.get("dup") === "1";

  return (
    <main className="min-h-screen bg-[var(--surface-2)] py-12 px-4">
      <Card className="max-w-lg mx-auto p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-[var(--ink)]">
          {duplicate ? "You already have an open case" : "Report submitted successfully"}
        </h1>
        {caseNumber ? (
          <p className="text-lg font-semibold text-[var(--brand)]">
            Case #{caseNumber}
          </p>
        ) : null}
        <p className="text-[var(--muted)]">
          {duplicate
            ? "We did not create a second report for the same issue. Our team will continue reviewing the existing case."
            : "Our team will review your report. You can follow progress from your support cases."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href={id ? `/support/cases/${id}` : "/support/cases"}
            className={cn(buttonVariants({ variant: "primary" }))}
          >
            View support cases
          </Link>
          <Link href="/" className={cn(buttonVariants({ variant: "secondary" }))}>
            Return to SparesX
          </Link>
        </div>
      </Card>
    </main>
  );
}

export default function SupportSubmittedPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[50vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[var(--brand-muted)] border-t-[var(--brand)] rounded-full animate-spin" />
        </main>
      }
    >
      <SubmittedInner />
    </Suspense>
  );
}
