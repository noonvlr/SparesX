"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SupportCaseForm } from "@/components/support/SupportCaseForm";
import { isLoggedInClient } from "@/lib/auth/clientAuth";
import type { SupportTargetType } from "@/lib/support/constants";

function ReportInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const rawType = searchParams.get("type") || "";
  const targetType: SupportTargetType =
    rawType === "product" || rawType === "user" || rawType === "message"
      ? rawType
      : rawType === "abuse"
        ? searchParams.get("productId")
          ? "product"
          : searchParams.get("messageId")
            ? "message"
            : searchParams.get("reportedUserId")
              ? "user"
              : "user"
        : "none";

  const productId =
    searchParams.get("productId") ||
    (targetType === "product" ? searchParams.get("id") : "") ||
    "";
  const reportedUserId =
    searchParams.get("reportedUserId") ||
    (targetType === "user" ? searchParams.get("id") : "") ||
    "";
  const messageId =
    searchParams.get("messageId") ||
    (targetType === "message" ? searchParams.get("id") : "") ||
    "";
  const conversationId = searchParams.get("conversationId") || "";

  useEffect(() => {
    const ok = isLoggedInClient();
    setIsAuthenticated(ok);
    setAuthChecked(true);
    if (!ok) return;
    if (targetType === "none" && !searchParams.get("type")) {
      router.replace("/support");
    }
  }, [router, targetType, searchParams]);

  if (!authChecked) {
    return (
      <main className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--brand-muted)] border-t-[var(--brand)] rounded-full animate-spin" />
      </main>
    );
  }

  if (!isAuthenticated) {
    const next =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/support/report";
    return (
      <main className="min-h-screen bg-[var(--surface-2)] py-12 px-4">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <h1 className="text-2xl font-bold text-[var(--ink)] mb-2">
            Sign in to report
          </h1>
          <p className="text-[var(--muted)] mb-6">
            You need to be logged in so we can attach your account to this case.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              onClick={() =>
                router.push(`/login?next=${encodeURIComponent(next)}`)
              }
            >
              Login
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                router.push(`/register?next=${encodeURIComponent(next)}`)
              }
            >
              Sign up
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--surface-2)] py-8 sm:py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          title="Submit a report"
          description="We already know what you’re reporting. Choose a reason and add any extra detail."
        />
        <Card className="p-5 sm:p-6">
          <SupportCaseForm
            targetType={targetType === "none" ? "user" : targetType}
            productId={productId || undefined}
            reportedUserId={reportedUserId || undefined}
            conversationId={conversationId || undefined}
            messageId={messageId || undefined}
            sourcePageType={targetType}
          />
        </Card>
        <p className="text-sm text-[var(--muted)]">
          Need general help instead?{" "}
          <Link href="/support" className="font-semibold text-[var(--brand)] hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function SupportReportPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[50vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[var(--brand-muted)] border-t-[var(--brand)] rounded-full animate-spin" />
        </main>
      }
    >
      <ReportInner />
    </Suspense>
  );
}
