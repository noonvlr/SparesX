"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DashboardPage } from "@/components/layout";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/feedback";
import { authFetch, isLoggedInClient } from "@/lib/auth/clientAuth";

type Status = {
  phoneVerified?: boolean;
  emailVerified?: boolean;
  kycVerified?: boolean;
  businessVerified?: boolean;
  addressVerified?: boolean;
  isTrusted?: boolean;
};

function Flag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge tone={ok ? "success" : "warning"} className="border border-transparent">
      {label}: {ok ? "Yes" : "No"}
    </Badge>
  );
}

/**
 * Honest verification status (phone/email + admin badges).
 * No KYC upload product yet — links to /verify for OTP.
 */
export default function SellerVerificationPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Status | null>(null);

  const load = useCallback(async () => {
    if (!isLoggedInClient()) {
      setError("Please log in");
      setLoading(false);
      return;
    }
    try {
      const res = await authFetch("/api/auth/me");
      const data = await res.json();
      if (!res.ok || !data.user) {
        setError(data.message || "Could not load verification status");
        return;
      }
      setStatus(data.user);
    } catch {
      setError("Could not load verification status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <DashboardPage title="Verification">
        <LoadingState />
      </DashboardPage>
    );
  }

  if (error || !status) {
    return (
      <DashboardPage title="Verification">
        <ErrorState title={error || "Unavailable"} />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage
      title="Verification"
      description="Phone verification is required to list parts. KYC/business badges are admin-approved when available — SparesX does not claim every seller is KYC-verified."
      actions={
        <Button asChild size="sm" variant="secondary">
          <Link href="/verify">Verify phone / email</Link>
        </Button>
      }
    >
      <Card className="p-6 space-y-4 max-w-xl">
        <div className="flex flex-wrap gap-2">
          <Flag ok={!!status.phoneVerified} label="Phone" />
          <Flag ok={!!status.emailVerified} label="Email" />
          <Flag ok={!!status.businessVerified} label="Business" />
          <Flag ok={!!status.kycVerified} label="KYC" />
          <Flag ok={!!status.addressVerified} label="Address" />
          <Flag ok={!!status.isTrusted} label="Trusted" />
        </div>
        <p className="text-sm text-[var(--muted)]">
          Manage contact details and password on your{" "}
          <Link
            href="/technician/profile#verification"
            className="text-[var(--brand)] font-semibold underline-offset-2 hover:underline"
          >
            profile
          </Link>
          .
        </p>
      </Card>
    </DashboardPage>
  );
}
