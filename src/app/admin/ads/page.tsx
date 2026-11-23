"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPage } from "@/components/layout";
import { Card, PageHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/ui/cn";
import { authFetch } from "@/lib/auth/clientAuth";
import { formatCtrDisplay } from "@/lib/ads/ctr";
import AdsSubnav from "./_components/AdsSubnav";

type OverviewData = {
  campaigns: {
    total: number;
    live: number;
    scheduled: number;
    paused: number;
    expired: number;
    draft: number;
    archived: number;
  };
  placements: { total: number; enabled: number };
  analytics: {
    impressions: number;
    clicks: number;
    ctr: number | null;
  };
};

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href?: string;
}) {
  const inner = (
    <Card padding="md" hover={Boolean(href)} className="h-full">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--ink)]">
        {value}
      </p>
    </Card>
  );
  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export default function AdminAdsOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/api/admin/ads/overview");
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.message || "Failed to load overview");
        }
        if (!cancelled) setData(json as OverviewData);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const c = data?.campaigns;
  const a = data?.analytics;

  return (
    <AdminPage>
      <PageHeader
        title="Ads"
        description="Placements, campaigns, and promo performance"
      />
      <AdsSubnav />

      {error ? (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : data ? (
        <>
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard label="Total campaigns" value={c!.total} href="/admin/ads/campaigns" />
            <StatCard label="Live" value={c!.live} href="/admin/ads/campaigns" />
            <StatCard label="Scheduled" value={c!.scheduled} />
            <StatCard label="Paused" value={c!.paused} />
            <StatCard label="Expired" value={c!.expired} />
            <StatCard label="Draft" value={c!.draft} />
            <StatCard label="Archived" value={c!.archived} />
            <StatCard
              label="Placements on"
              value={`${data.placements.enabled}/${data.placements.total}`}
              href="/admin/ads/placements"
            />
          </div>

          <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              label="Impressions"
              value={a!.impressions}
              href="/admin/ads/analytics"
            />
            <StatCard
              label="Clicks"
              value={a!.clicks}
              href="/admin/ads/analytics"
            />
            <StatCard
              label="CTR"
              value={formatCtrDisplay(a!.impressions, a!.clicks)}
              href="/admin/ads/analytics"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/ads/placements"
              className={cn(buttonVariants({ variant: "secondary" }))}
            >
              Manage placements
            </Link>
            <Link
              href="/admin/ads/campaigns"
              className={cn(buttonVariants())}
            >
              View campaigns
            </Link>
            <Link
              href="/admin/ads/analytics"
              className={cn(buttonVariants({ variant: "secondary" }))}
            >
              Analytics
            </Link>
          </div>
        </>
      ) : null}
    </AdminPage>
  );
}
