"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPage } from "@/components/layout";
import { Card, EmptyState, PageHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { Input } from "@/components/ui/Input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { authFetch } from "@/lib/auth/clientAuth";
import { formatCtrDisplay } from "@/lib/ads/ctr";
import PromoDailyChart from "@/components/promo/PromoDailyChart";
import AdsSubnav from "../_components/AdsSubnav";

type AnalyticsPayload = {
  range: { from: string; to: string };
  totals: { impressions: number; clicks: number; ctr: number | null };
  daily: Array<{
    istDate: string;
    impressions: number;
    clicks: number;
    ctr: number | null;
  }>;
  byDevice: {
    desktop: { impressions: number; clicks: number; ctr: number | null };
    mobile: { impressions: number; clicks: number; ctr: number | null };
  };
  campaigns: Array<{
    campaignId: string;
    name: string;
    advertiserName: string;
    impressions: number;
    clicks: number;
    ctr: number | null;
  }>;
  placements: Array<{
    placementKey: string;
    name: string;
    impressions: number;
    clicks: number;
    ctr: number | null;
  }>;
  filters: {
    campaigns: Array<{ id: string; name: string }>;
    placements: Array<{ key: string; name: string }>;
  };
};

function ctrLabel(impressions: number, clicks: number, ctr: number | null) {
  if (ctr === null) return formatCtrDisplay(impressions, clicks);
  return `${ctr.toFixed(2)}%`;
}

export default function AdminAdsAnalyticsPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [placement, setPlacement] = useState("");
  const [device, setDevice] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (campaignId) params.set("campaignId", campaignId);
    if (placement) params.set("placement", placement);
    if (device) params.set("device", device);
    const res = await authFetch(`/api/admin/ads/analytics?${params}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || "Failed to load analytics");
    setData(json as AnalyticsPayload);
    if (!from && json.range?.from) setFrom(json.range.from);
    if (!to && json.range?.to) setTo(json.range.to);
  }, [from, to, campaignId, placement, device]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
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

  return (
    <AdminPage>
      <PageHeader
        title="Promo analytics"
        description="Impressions, clicks, and CTR from daily rollups (IST days). Source of truth: AdDailyStat."
      />
      <AdsSubnav />

      {error ? (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          type="date"
          className="max-w-[11rem]"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="From IST date"
        />
        <Input
          type="date"
          className="max-w-[11rem]"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          aria-label="To IST date"
        />
        <select
          className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
        >
          <option value="">All campaigns</option>
          {(data?.filters.campaigns || []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          value={placement}
          onChange={(e) => setPlacement(e.target.value)}
        >
          <option value="">All placements</option>
          {(data?.filters.placements || []).map((p) => (
            <option key={p.key} value={p.key}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          value={device}
          onChange={(e) => setDevice(e.target.value)}
        >
          <option value="">All devices</option>
          <option value="desktop">Desktop</option>
          <option value="mobile">Mobile</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : !data ? (
        <EmptyState title="No analytics" description="Could not load data." />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card padding="md">
              <p className="text-xs uppercase text-[var(--muted)]">
                Impressions
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {data.totals.impressions}
              </p>
            </Card>
            <Card padding="md">
              <p className="text-xs uppercase text-[var(--muted)]">Clicks</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {data.totals.clicks}
              </p>
            </Card>
            <Card padding="md">
              <p className="text-xs uppercase text-[var(--muted)]">CTR</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {ctrLabel(
                  data.totals.impressions,
                  data.totals.clicks,
                  data.totals.ctr,
                )}
              </p>
            </Card>
          </div>

          <Card padding="md" className="mb-6">
            <h2 className="mb-3 text-sm font-semibold">Daily (IST)</h2>
            <PromoDailyChart days={data.daily} />
          </Card>

          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card padding="md">
              <h2 className="mb-2 text-sm font-semibold">Desktop</h2>
              <p className="text-sm text-[var(--muted)]">
                {data.byDevice.desktop.impressions} imp ·{" "}
                {data.byDevice.desktop.clicks} clicks ·{" "}
                {ctrLabel(
                  data.byDevice.desktop.impressions,
                  data.byDevice.desktop.clicks,
                  data.byDevice.desktop.ctr,
                )}
              </p>
            </Card>
            <Card padding="md">
              <h2 className="mb-2 text-sm font-semibold">Mobile</h2>
              <p className="text-sm text-[var(--muted)]">
                {data.byDevice.mobile.impressions} imp ·{" "}
                {data.byDevice.mobile.clicks} clicks ·{" "}
                {ctrLabel(
                  data.byDevice.mobile.impressions,
                  data.byDevice.mobile.clicks,
                  data.byDevice.mobile.ctr,
                )}
              </p>
            </Card>
          </div>

          <h2 className="mb-2 text-sm font-semibold">By campaign</h2>
          {data.campaigns.length === 0 ? (
            <EmptyState
              className="mb-6"
              title="No campaign stats"
              description="Publish a campaign and wait for views, or run the demo seed in development."
            />
          ) : (
            <Table className="mb-6">
              <THead>
                <TR>
                  <TH>Campaign</TH>
                  <TH>Impressions</TH>
                  <TH>Clicks</TH>
                  <TH>CTR</TH>
                </TR>
              </THead>
              <TBody>
                {data.campaigns.map((c) => (
                  <TR key={c.campaignId}>
                    <TD>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {c.advertiserName}
                      </div>
                    </TD>
                    <TD className="tabular-nums">{c.impressions}</TD>
                    <TD className="tabular-nums">{c.clicks}</TD>
                    <TD className="tabular-nums">
                      {ctrLabel(c.impressions, c.clicks, c.ctr)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}

          <h2 className="mb-2 text-sm font-semibold">By placement</h2>
          {data.placements.length === 0 ? (
            <EmptyState
              title="No placement stats"
              description="No rollups match these filters."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Placement</TH>
                  <TH>Impressions</TH>
                  <TH>Clicks</TH>
                  <TH>CTR</TH>
                </TR>
              </THead>
              <TBody>
                {data.placements.map((p) => (
                  <TR key={p.placementKey}>
                    <TD>
                      <div className="font-medium">{p.name}</div>
                      <div className="font-mono text-xs text-[var(--muted)]">
                        {p.placementKey}
                      </div>
                    </TD>
                    <TD className="tabular-nums">{p.impressions}</TD>
                    <TD className="tabular-nums">{p.clicks}</TD>
                    <TD className="tabular-nums">
                      {ctrLabel(p.impressions, p.clicks, p.ctr)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </>
      )}
    </AdminPage>
  );
}
