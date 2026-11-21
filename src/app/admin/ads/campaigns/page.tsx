"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPage } from "@/components/layout";
import { Badge, EmptyState, PageHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { authFetch } from "@/lib/auth/clientAuth";
import AdsSubnav from "../_components/AdsSubnav";

type CampaignRow = {
  id: string;
  name: string;
  advertiserName: string;
  advertiserType: string;
  status: string;
  effectiveStatus: string;
  priority: number;
  placementKeys: string[];
  startDate: string | null;
  endDate: string | null;
};

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral" | "info"> = {
  live: "success",
  scheduled: "info",
  paused: "warning",
  expired: "neutral",
  draft: "neutral",
  archived: "danger",
  active: "info",
};

function formatIstDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export default function AdminAdsCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/api/admin/ads/campaigns?limit=50");
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.message || "Failed to load campaigns");
        }
        if (!cancelled) {
          setCampaigns(json.campaigns || []);
          setTotal(json.total ?? 0);
        }
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

  return (
    <AdminPage>
      <PageHeader
        title="Campaigns"
        description="Sponsored and house promo campaigns. Create/edit wizard ships next."
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
      ) : campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Placements are ready. Campaign creation wizard arrives in the next phase — you can manage slot sizes now."
          action={
            <Link
              href="/admin/ads/placements"
              className="text-sm font-medium text-[var(--brand)] hover:underline"
            >
              Review placements
            </Link>
          }
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-[var(--muted)]">
            {total} campaign{total === 1 ? "" : "s"}
          </p>
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Advertiser</TH>
                <TH>Placements</TH>
                <TH>Start (IST)</TH>
                <TH>End (IST)</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {campaigns.map((c) => (
                <TR key={c.id}>
                  <TD>
                    <div className="font-medium text-[var(--ink)]">{c.name}</div>
                    <div className="text-xs text-[var(--muted)]">
                      Priority {c.priority}
                    </div>
                  </TD>
                  <TD>
                    {c.advertiserName}
                    <span className="ml-1 text-xs text-[var(--muted)]">
                      ({c.advertiserType})
                    </span>
                  </TD>
                  <TD className="text-sm">
                    {c.placementKeys.length
                      ? c.placementKeys.join(", ")
                      : "—"}
                  </TD>
                  <TD className="whitespace-nowrap text-sm">
                    {formatIstDate(c.startDate)}
                  </TD>
                  <TD className="whitespace-nowrap text-sm">
                    {formatIstDate(c.endDate)}
                  </TD>
                  <TD>
                    <Badge tone={STATUS_TONE[c.effectiveStatus] || "neutral"}>
                      {c.effectiveStatus}
                    </Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </>
      )}
    </AdminPage>
  );
}
