"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPage } from "@/components/layout";
import { AdminPageHeader } from "@/components/admin/AdminPageChrome";
import { Badge, EmptyState } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/ui/cn";
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

const STATUS_TONE: Record<
  string,
  "success" | "warning" | "danger" | "neutral" | "info"
> = {
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
  const [busyId, setBusyId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ limit: "50" });
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    const res = await authFetch(`/api/admin/ads/campaigns?${params}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || "Failed to load campaigns");
    setCampaigns(json.campaigns || []);
    setTotal(json.total ?? 0);
  }, [q, status]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await load();
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
  }, [load]);

  async function runAction(
    id: string,
    action: "publish" | "pause" | "activate" | "archive" | "duplicate",
  ) {
    setBusyId(id);
    setError("");
    try {
      const res = await authFetch(`/api/admin/ads/campaigns/${id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Action failed");
      if (action === "duplicate" && json.campaign?.id) {
        window.location.href = `/admin/ads/campaigns/${json.campaign.id}`;
        return;
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminPage>
      <AdminPageHeader
        title="Campaigns"
        description="Create, schedule, pause, and archive sponsored or house promos."
        actions={
          <Link
            href="/admin/ads/campaigns/new"
            className={cn(buttonVariants())}
          >
            New campaign
          </Link>
        }
      />
      <AdsSubnav />

      {error ? (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          className="max-w-xs"
          placeholder="Search name or advertiser"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All stored statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Create a draft, upload creatives, schedule in IST, then publish."
          action={
            <Link
              href="/admin/ads/campaigns/new"
              className={cn(buttonVariants())}
            >
              New campaign
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
                <TH>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {campaigns.map((c) => (
                <TR key={c.id}>
                  <TD>
                    <Link
                      href={`/admin/ads/campaigns/${c.id}`}
                      className="font-medium text-[var(--brand)] hover:underline"
                    >
                      {c.name}
                    </Link>
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
                  <TD>
                    <div className="flex flex-wrap gap-1">
                      <Link
                        href={`/admin/ads/campaigns/${c.id}`}
                        className={cn(
                          buttonVariants({ variant: "secondary", size: "sm" }),
                        )}
                      >
                        Edit
                      </Link>
                      {c.status === "active" ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busyId === c.id}
                          onClick={() => void runAction(c.id, "pause")}
                        >
                          Pause
                        </Button>
                      ) : null}
                      {c.status === "paused" || c.status === "draft" ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busyId === c.id}
                          onClick={() =>
                            void runAction(
                              c.id,
                              c.status === "draft" ? "publish" : "activate",
                            )
                          }
                        >
                          {c.status === "draft" ? "Publish" : "Resume"}
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === c.id}
                        onClick={() => void runAction(c.id, "duplicate")}
                      >
                        Duplicate
                      </Button>
                      {c.status !== "archived" ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busyId === c.id}
                          onClick={() => {
                            if (
                              !window.confirm(
                                c.status === "draft"
                                  ? "Delete this draft? (Hard-delete only if it has no events.)"
                                  : "Archive this campaign? Analytics are kept.",
                              )
                            ) {
                              return;
                            }
                            void runAction(c.id, "archive");
                          }}
                        >
                          {c.status === "draft" ? "Delete" : "Archive"}
                        </Button>
                      ) : null}
                    </div>
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
