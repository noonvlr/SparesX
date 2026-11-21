"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { authFetch } from "@/lib/auth/clientAuth";
import { formatIstLocal } from "@/lib/ads/ist";
import { cn } from "@/lib/ui/cn";
import PromoSlot from "@/components/promo/PromoSlot";
import type { EligibleAdsPayload } from "@/lib/ads/rotation";

type PlacementRow = {
  key: string;
  name: string;
  pageLocation: string;
  desktop: { width: number; height: number };
  mobile: { width: number; height: number } | null;
  enabled: boolean;
  maxSlots: number;
  supportedDevices: string[];
};

type Creative = {
  placementKey: string;
  device: "desktop" | "mobile";
  url: string;
  width: number;
  height: number;
  altText: string;
  needsUpdate?: boolean;
};

type Campaign = {
  id: string;
  name: string;
  advertiserName: string;
  advertiserType: "paid" | "house";
  description: string;
  destinationUrl: string;
  ctaLabel: string;
  internalNotes: string;
  placementKeys: string[];
  creatives: Creative[];
  startDate: string | null;
  endDate: string | null;
  priority: number;
  status: string;
  effectiveStatus: string;
  publishReady?: boolean;
};

const STEPS = [
  "Details",
  "Placements",
  "Creatives",
  "Schedule",
  "Preview",
] as const;

function toIstInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return formatIstLocal(d);
}

export default function CampaignWizard({
  campaignId: initialId,
}: {
  campaignId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [campaignId, setCampaignId] = useState(initialId || "");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [placements, setPlacements] = useState<PlacementRow[]>([]);
  const [loading, setLoading] = useState(Boolean(initialId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [coverageWarnings, setCoverageWarnings] = useState<Record<string, string>>(
    {},
  );

  const [details, setDetails] = useState({
    name: "",
    advertiserName: "",
    advertiserType: "paid" as "paid" | "house",
    description: "",
    destinationUrl: "",
    ctaLabel: "",
    internalNotes: "",
  });
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [schedule, setSchedule] = useState({
    startDate: "",
    endDate: "",
    priority: 3,
  });
  const [uploading, setUploading] = useState<string | null>(null);

  const loadCampaign = useCallback(async (id: string) => {
    const res = await authFetch(`/api/admin/ads/campaigns/${id}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || "Failed to load campaign");
    const c = json.campaign as Campaign;
    setCampaign(c);
    setCampaignId(c.id);
    setDetails({
      name: c.name,
      advertiserName: c.advertiserName,
      advertiserType: c.advertiserType,
      description: c.description || "",
      destinationUrl: c.destinationUrl || "",
      ctaLabel: c.ctaLabel || "",
      internalNotes: c.internalNotes || "",
    });
    setSelectedKeys(c.placementKeys || []);
    setSchedule({
      startDate: toIstInput(c.startDate),
      endDate: toIstInput(c.endDate),
      priority: c.priority || 3,
    });
    if (Array.isArray(json.placements)) {
      setPlacements(json.placements);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (initialId) {
          await loadCampaign(initialId);
        } else {
          const res = await authFetch("/api/admin/ads/placements");
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json.message || "Failed to load placements");
          if (!cancelled) setPlacements(json.placements || []);
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
  }, [initialId, loadCampaign]);

  const selectedPlacements = useMemo(
    () => placements.filter((p) => selectedKeys.includes(p.key)),
    [placements, selectedKeys],
  );

  async function createDraft() {
    setSaving(true);
    setError("");
    try {
      const res = await authFetch("/api/admin/ads/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Failed to create draft");
      const id = json.campaign.id as string;
      setCampaignId(id);
      setCampaign(json.campaign);
      router.replace(`/admin/ads/campaigns/${id}`);
      setStep(1);
      setSuccess("Draft saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  }

  async function patchCampaign(body: Record<string, unknown>) {
    if (!campaignId) throw new Error("No campaign id");
    const res = await authFetch(`/api/admin/ads/campaigns/${campaignId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || "Save failed");
    setCampaign(json.campaign);
    return json.campaign as Campaign;
  }

  async function saveDetailsAndNext() {
    if (!details.name.trim() || !details.advertiserName.trim()) {
      setError("Name and advertiser name are required");
      return;
    }
    if (!campaignId) {
      await createDraft();
      return;
    }
    setSaving(true);
    setError("");
    try {
      await patchCampaign(details);
      setStep(1);
      setSuccess("Details saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function savePlacementsAndNext() {
    if (!selectedKeys.length) {
      setError("Select at least one placement");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await patchCampaign({ placementKeys: selectedKeys });
      setStep(2);
      setSuccess("Placements saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function refreshCoverage(keys: string[]) {
    if (!keys.length) {
      setCoverageWarnings({});
      return;
    }
    const warnings: Record<string, string> = {};
    await Promise.all(
      keys.map(async (key) => {
        const params = new URLSearchParams({ placementKey: key });
        if (schedule.startDate) params.set("start", schedule.startDate);
        if (schedule.endDate) params.set("end", schedule.endDate);
        if (campaignId) params.set("excludeId", campaignId);
        const res = await authFetch(
          `/api/admin/ads/placements/coverage?${params}`,
        );
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.warning) warnings[key] = json.warning;
      }),
    );
    setCoverageWarnings(warnings);
  }

  useEffect(() => {
    if (step === 1 && selectedKeys.length) {
      void refreshCoverage(selectedKeys);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selectedKeys.join(","), schedule.startDate, schedule.endDate]);

  async function uploadCreative(
    placementKey: string,
    device: "desktop" | "mobile",
    file: File,
    altText: string,
  ) {
    if (!campaignId) return;
    const key = `${placementKey}:${device}`;
    setUploading(key);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("placementKey", placementKey);
      form.append("device", device);
      form.append("altText", altText || details.name);
      const res = await authFetch(
        `/api/admin/ads/campaigns/${campaignId}/creatives`,
        { method: "POST", body: form },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Upload failed");
      await loadCampaign(campaignId);
      setSuccess(`${device} creative uploaded for ${placementKey}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function removeCreative(
    placementKey: string,
    device: "desktop" | "mobile",
  ) {
    if (!campaignId) return;
    setSaving(true);
    setError("");
    try {
      const params = new URLSearchParams({ placementKey, device });
      const res = await authFetch(
        `/api/admin/ads/campaigns/${campaignId}/creatives?${params}`,
        { method: "DELETE" },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Remove failed");
      await loadCampaign(campaignId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveScheduleAndNext() {
    if (!schedule.startDate || !schedule.endDate) {
      setError("Start and end (IST) are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await patchCampaign({
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        priority: schedule.priority,
      });
      setStep(4);
      setSuccess("Schedule saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function runAction(action: "publish" | "activate") {
    if (!campaignId) return;
    setSaving(true);
    setError("");
    try {
      // Persist latest details/schedule first
      await patchCampaign({
        ...details,
        placementKeys: selectedKeys,
        startDate: schedule.startDate || null,
        endDate: schedule.endDate || null,
        priority: schedule.priority,
      });
      const res = await authFetch(
        `/api/admin/ads/campaigns/${campaignId}/actions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Action failed");
      setSuccess(json.message || "Done");
      router.push("/admin/ads/campaigns");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setSaving(false);
    }
  }

  function creativeFor(key: string, device: "desktop" | "mobile") {
    return campaign?.creatives.find(
      (c) => c.placementKey === key && c.device === device,
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <ol className="mb-6 flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              disabled={!campaignId && i > 0}
              onClick={() => {
                if (campaignId || i === 0) setStep(i);
              }}
              className={cn(
                "rounded-[var(--radius)] px-3 py-1.5 text-sm font-medium",
                step === i
                  ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                  : "bg-[var(--surface-3)] text-[var(--muted)]",
              )}
            >
              {i + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      {error ? (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert tone="success" className="mb-4">
          {success}
        </Alert>
      ) : null}

      {step === 0 ? (
        <Card padding="md" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Campaign name" required>
              <Input
                value={details.name}
                onChange={(e) =>
                  setDetails({ ...details, name: e.target.value })
                }
              />
            </Field>
            <Field label="Advertiser name" required>
              <Input
                value={details.advertiserName}
                onChange={(e) =>
                  setDetails({ ...details, advertiserName: e.target.value })
                }
              />
            </Field>
          </div>
          <Field label="Advertiser type">
            <select
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              value={details.advertiserType}
              onChange={(e) =>
                setDetails({
                  ...details,
                  advertiserType: e.target.value as "paid" | "house",
                })
              }
            >
              <option value="paid">Paid</option>
              <option value="house">House</option>
            </select>
          </Field>
          <Field label="Description">
            <Textarea
              rows={3}
              value={details.description}
              onChange={(e) =>
                setDetails({ ...details, description: e.target.value })
              }
            />
          </Field>
          <Field label="Destination URL" hint="Absolute https URL">
            <Input
              value={details.destinationUrl}
              onChange={(e) =>
                setDetails({ ...details, destinationUrl: e.target.value })
              }
              placeholder="https://"
            />
          </Field>
          <Field label="CTA label (accessible name)">
            <Input
              value={details.ctaLabel}
              onChange={(e) =>
                setDetails({ ...details, ctaLabel: e.target.value })
              }
            />
          </Field>
          <Field label="Internal notes">
            <Textarea
              rows={2}
              value={details.internalNotes}
              onChange={(e) =>
                setDetails({ ...details, internalNotes: e.target.value })
              }
            />
          </Field>
          <Button
            type="button"
            onClick={() => void saveDetailsAndNext()}
            disabled={saving}
          >
            {saving
              ? "Saving…"
              : campaignId
                ? "Save & continue"
                : "Create draft & continue"}
          </Button>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card padding="md" className="space-y-3">
          {placements.map((p) => {
            const checked = selectedKeys.includes(p.key);
            return (
              <label
                key={p.key}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-[var(--radius)] border p-3",
                  checked
                    ? "border-[var(--brand)] bg-[var(--brand-soft)]/30"
                    : "border-[var(--border)]",
                )}
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={checked}
                  onChange={(e) => {
                    setSelectedKeys((prev) =>
                      e.target.checked
                        ? [...prev, p.key]
                        : prev.filter((k) => k !== p.key),
                    );
                  }}
                />
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-[var(--ink)]">
                    {p.name}
                  </span>
                  {!p.enabled ? (
                    <span className="ml-2 text-xs text-[var(--warning)]">
                      disabled
                    </span>
                  ) : null}
                  <span className="mt-1 block text-sm text-[var(--muted)]">
                    {p.pageLocation}
                  </span>
                  <span className="mt-1 block text-xs text-[var(--muted)]">
                    Desktop {p.desktop.width}×{p.desktop.height}
                    {p.mobile
                      ? ` · Mobile ${p.mobile.width}×${p.mobile.height}`
                      : " · Mobile N/A"}
                    {` · maxSlots ${p.maxSlots}`}
                  </span>
                  {coverageWarnings[p.key] ? (
                    <span className="mt-2 block text-xs text-[var(--warning)]">
                      {coverageWarnings[p.key]}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button
              type="button"
              onClick={() => void savePlacementsAndNext()}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save & continue"}
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          {selectedPlacements.map((p) => {
            const desktop = creativeFor(p.key, "desktop");
            const mobile = creativeFor(p.key, "mobile");
            const needsMobile = Boolean(p.mobile);
            return (
              <Card key={p.key} padding="md" className="space-y-4">
                <div>
                  <h3 className="font-semibold text-[var(--ink)]">{p.name}</h3>
                  <p className="text-xs text-[var(--muted)]">
                    Desktop {p.desktop.width}×{p.desktop.height} (or{" "}
                    {p.desktop.width * 2}×{p.desktop.height * 2}) · AR{" "}
                    {p.desktop.width}:{p.desktop.height}
                    {needsMobile && p.mobile
                      ? ` · Mobile ${p.mobile.width}×${p.mobile.height}`
                      : ""}
                    · Max 2 MB · JPEG/PNG/WebP
                  </p>
                </div>
                {(["desktop", ...(needsMobile ? (["mobile"] as const) : [])] as const).map(
                  (device) => {
                    const creative = device === "desktop" ? desktop : mobile;
                    const req =
                      device === "desktop" ? p.desktop : p.mobile!;
                    const uploadKey = `${p.key}:${device}`;
                    return (
                      <div
                        key={device}
                        className="rounded-[var(--radius)] border border-[var(--border)] p-3"
                      >
                        <p className="mb-2 text-sm font-medium capitalize">
                          {device} ({req.width}×{req.height})
                        </p>
                        {creative ? (
                          <div className="mb-3 flex flex-wrap items-start gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={creative.url}
                              alt={creative.altText}
                              width={Math.min(creative.width, 320)}
                              height={Math.round(
                                (Math.min(creative.width, 320) /
                                  creative.width) *
                                  creative.height,
                              )}
                              className="max-h-40 rounded border border-[var(--border)] object-contain"
                            />
                            <div className="min-w-0 flex-1 space-y-2">
                              <Field label="Alt text">
                                <Input
                                  defaultValue={creative.altText}
                                  onBlur={(e) => {
                                    const altText = e.target.value.trim();
                                    if (!altText || !campaignId) return;
                                    void patchCampaign({
                                      creativeAltUpdates: [
                                        {
                                          placementKey: p.key,
                                          device,
                                          altText,
                                        },
                                      ],
                                    }).then(() => loadCampaign(campaignId));
                                  }}
                                />
                              </Field>
                              {creative.needsUpdate ? (
                                <p className="text-xs text-[var(--danger)]">
                                  Needs update — dimensions no longer match
                                  placement.
                                </p>
                              ) : null}
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() =>
                                  void removeCreative(p.key, device)
                                }
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ) : null}
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={uploading === uploadKey}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (!file) return;
                            void uploadCreative(
                              p.key,
                              device,
                              file,
                              details.name,
                            );
                          }}
                        />
                        {uploading === uploadKey ? (
                          <p className="mt-2 text-xs text-[var(--muted)]">
                            Uploading…
                          </p>
                        ) : null}
                      </div>
                    );
                  },
                )}
              </Card>
            );
          })}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="button" onClick={() => setStep(3)}>
              Continue to schedule
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <Card padding="md" className="space-y-4">
          <Alert tone="info">
            Enter times in Asia/Kolkata (IST). Start is inclusive; end is
            exclusive.
          </Alert>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Start (IST)" required>
              <Input
                type="datetime-local"
                value={schedule.startDate}
                onChange={(e) =>
                  setSchedule({ ...schedule, startDate: e.target.value })
                }
              />
            </Field>
            <Field label="End (IST)" required>
              <Input
                type="datetime-local"
                value={schedule.endDate}
                onChange={(e) =>
                  setSchedule({ ...schedule, endDate: e.target.value })
                }
              />
            </Field>
          </div>
          <Field label="Priority (1–5, higher = more weight)">
            <Input
              type="number"
              min={1}
              max={5}
              value={schedule.priority}
              onChange={(e) =>
                setSchedule({
                  ...schedule,
                  priority: Math.min(
                    5,
                    Math.max(1, parseInt(e.target.value, 10) || 1),
                  ),
                })
              }
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              type="button"
              onClick={() => void saveScheduleAndNext()}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save & preview"}
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 4 ? (
        <Card padding="md" className="space-y-4">
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--muted)]">Name</dt>
              <dd className="font-medium">{details.name}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Advertiser</dt>
              <dd className="font-medium">
                {details.advertiserName} ({details.advertiserType})
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Destination</dt>
              <dd className="break-all font-medium">
                {details.destinationUrl || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Schedule (IST)</dt>
              <dd className="font-medium">
                {schedule.startDate || "—"} → {schedule.endDate || "—"} ·
                priority {schedule.priority}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Status</dt>
              <dd className="font-medium">
                {campaign?.effectiveStatus || campaign?.status || "draft"}
              </dd>
            </div>
          </dl>
          <div className="space-y-4">
            {selectedPlacements.map((p) => {
              const desktop = creativeFor(p.key, "desktop");
              const mobile = creativeFor(p.key, "mobile");
              if (!desktop) {
                return (
                  <p key={p.key} className="text-xs text-[var(--danger)]">
                    {p.name}: missing desktop creative
                  </p>
                );
              }
              const previewPayload: EligibleAdsPayload = {
                placementKey: p.key,
                maxSlots: 1,
                fallbackToHouseAds: false,
                aspectDesktop: p.desktop,
                aspectMobile: p.mobile,
                fetchedAt: new Date().toISOString(),
                items: [
                  {
                    campaignId: campaignId || "preview",
                    placementKey: p.key,
                    priority: schedule.priority,
                    advertiserType: details.advertiserType,
                    destinationLabel:
                      details.ctaLabel || details.name || "Sponsored",
                    startDate: new Date(Date.now() - 60_000).toISOString(),
                    endDate: new Date(Date.now() + 86400000).toISOString(),
                    token: "preview",
                    desktop: {
                      url: desktop.url,
                      width: desktop.width,
                      height: desktop.height,
                      altText: desktop.altText,
                    },
                    mobile: mobile
                      ? {
                          url: mobile.url,
                          width: mobile.width,
                          height: mobile.height,
                          altText: mobile.altText,
                        }
                      : null,
                  },
                ],
              };
              return (
                <div key={p.key}>
                  <p className="mb-2 text-sm font-medium">{p.name}</p>
                  <PromoSlot
                    placement={p.key}
                    previewMode
                    previewPayload={previewPayload}
                  />
                </div>
              );
            })}
          </div>
          <p className="text-xs text-[var(--muted)]">
            Preview uses PromoSlot in preview mode (no tracking, no public
            fetch).
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                setError("");
                try {
                  await patchCampaign({
                    ...details,
                    placementKeys: selectedKeys,
                    startDate: schedule.startDate || null,
                    endDate: schedule.endDate || null,
                    priority: schedule.priority,
                  });
                  setSuccess("Draft saved.");
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Save failed");
                } finally {
                  setSaving(false);
                }
              }}
            >
              Save draft
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() => void runAction("publish")}
            >
              Publish
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
