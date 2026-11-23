"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPage } from "@/components/layout";
import { AdminPageHeader } from "@/components/admin/AdminPageChrome";
import { Badge, Card, EmptyState } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { authFetch } from "@/lib/auth/clientAuth";
import AdsSubnav from "../_components/AdsSubnav";
import type { AdminPlacement } from "../_components/placementTypes";

type EditForm = {
  name: string;
  description: string;
  pageLocation: string;
  desktopW: string;
  desktopH: string;
  mobileEnabled: boolean;
  mobileW: string;
  mobileH: string;
  enabled: boolean;
  maxSlots: string;
  fallbackToHouseAds: boolean;
};

function toForm(p: AdminPlacement): EditForm {
  return {
    name: p.name,
    description: p.description || "",
    pageLocation: p.pageLocation,
    desktopW: String(p.desktop.width),
    desktopH: String(p.desktop.height),
    mobileEnabled: Boolean(p.mobile),
    mobileW: p.mobile ? String(p.mobile.width) : "",
    mobileH: p.mobile ? String(p.mobile.height) : "",
    enabled: p.enabled,
    maxSlots: String(p.maxSlots),
    fallbackToHouseAds: p.fallbackToHouseAds,
  };
}

export default function AdminAdsPlacementsPage() {
  const [placements, setPlacements] = useState<AdminPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    const res = await authFetch("/api/admin/ads/placements");
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || "Failed to load placements");
    setPlacements(json.placements || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
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

  function startEdit(p: AdminPlacement) {
    setEditingKey(p.key);
    setForm(toForm(p));
    setError("");
    setSuccess("");
  }

  function cancelEdit() {
    setEditingKey(null);
    setForm(null);
  }

  async function handleSeed() {
    setSeeding(true);
    setError("");
    setSuccess("");
    try {
      const res = await authFetch("/api/admin/ads/placements/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Seed failed");
      setPlacements(json.placements || []);
      setSuccess(
        json.upserted
          ? `Inserted ${json.upserted} missing placement(s).`
          : "All seed placements already present.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  }

  async function handleSave(key: string) {
    if (!form) return;
    const desktopW = parseInt(form.desktopW, 10);
    const desktopH = parseInt(form.desktopH, 10);
    const maxSlots = parseInt(form.maxSlots, 10);
    if (!Number.isFinite(desktopW) || !Number.isFinite(desktopH)) {
      setError("Desktop width and height must be numbers");
      return;
    }
    if (!Number.isInteger(maxSlots) || maxSlots < 1 || maxSlots > 10) {
      setError("maxSlots must be an integer from 1 to 10");
      return;
    }

    let mobile: { width: number; height: number } | null = null;
    const supportedDevices: Array<"desktop" | "mobile"> = ["desktop"];
    if (form.mobileEnabled) {
      const mw = parseInt(form.mobileW, 10);
      const mh = parseInt(form.mobileH, 10);
      if (!Number.isFinite(mw) || !Number.isFinite(mh)) {
        setError("Mobile width and height must be numbers");
        return;
      }
      mobile = { width: mw, height: mh };
      supportedDevices.push("mobile");
    }

    setSavingKey(key);
    setError("");
    setSuccess("");
    try {
      const res = await authFetch(`/api/admin/ads/placements/${encodeURIComponent(key)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          pageLocation: form.pageLocation,
          desktop: { width: desktopW, height: desktopH },
          mobile,
          supportedDevices,
          enabled: form.enabled,
          maxSlots,
          fallbackToHouseAds: form.fallbackToHouseAds,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Save failed");
      setPlacements((prev) =>
        prev.map((p) => (p.key === key ? (json.placement as AdminPlacement) : p)),
      );
      setSuccess(`Saved ${key}.`);
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <AdminPage>
      <AdminPageHeader
        title="Placements"
        description="Slot keys are immutable. Creatives must match exact size or 2×. Changing dimensions flags mismatched creatives as needing update (not served)."
      />
      <AdsSubnav />

      <Alert tone="info" className="mb-4">
        Rules: WebP/JPEG/PNG only, max 2 MB. Accept exact dimensions or exactly
        2×. Placements are never deleted — disable instead. Public pages use
        promo naming; this admin area keeps readable “ads” labels.
      </Alert>

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

      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => void handleSeed()}
          disabled={seeding}
        >
          {seeding ? "Seeding…" : "Seed missing placements"}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : placements.length === 0 ? (
        <EmptyState
          title="No placements"
          description="Run seed to insert the default homepage, listing, product, and sidebar slots."
          action={
            <Button type="button" onClick={() => void handleSeed()} disabled={seeding}>
              Seed placements
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {placements.map((p) => {
            const isEditing = editingKey === p.key && form;
            return (
              <Card key={p.key} padding="md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-[var(--ink)]">
                        {p.name}
                      </h2>
                      <Badge tone={p.enabled ? "success" : "neutral"}>
                        {p.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      {p.fallbackToHouseAds ? (
                        <Badge tone="info">House fallback</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 font-mono text-xs text-[var(--muted)]">
                      {p.key}
                    </p>
                    <p className="mt-2 text-sm text-[var(--ink-secondary)]">
                      {p.pageLocation}
                    </p>
                  </div>
                  {!isEditing ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => startEdit(p)}
                    >
                      Edit
                    </Button>
                  ) : null}
                </div>

                {!isEditing ? (
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <dt className="text-[var(--muted)]">Desktop</dt>
                      <dd className="font-medium tabular-nums">
                        {p.desktop.width}×{p.desktop.height}
                        <span className="ml-1 text-xs text-[var(--muted)]">
                          ({p.desktopAspect})
                        </span>
                      </dd>
                      <dd className="text-xs text-[var(--muted)]">
                        or {p.desktop.width * 2}×{p.desktop.height * 2}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[var(--muted)]">Mobile</dt>
                      <dd className="font-medium tabular-nums">
                        {p.mobile
                          ? `${p.mobile.width}×${p.mobile.height}`
                          : "N/A"}
                        {p.mobileAspect ? (
                          <span className="ml-1 text-xs text-[var(--muted)]">
                            ({p.mobileAspect})
                          </span>
                        ) : null}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[var(--muted)]">Max slots</dt>
                      <dd className="font-medium">{p.maxSlots}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--muted)]">Devices</dt>
                      <dd className="font-medium">
                        {p.supportedDevices.join(", ")}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <div className="mt-4 space-y-4 border-t border-[var(--border)] pt-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Name">
                        <Input
                          value={form.name}
                          onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                          }
                        />
                      </Field>
                      <Field label="Page location">
                        <Input
                          value={form.pageLocation}
                          onChange={(e) =>
                            setForm({ ...form, pageLocation: e.target.value })
                          }
                        />
                      </Field>
                    </div>
                    <Field label="Description">
                      <Textarea
                        rows={2}
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Field label="Desktop width">
                        <Input
                          inputMode="numeric"
                          value={form.desktopW}
                          onChange={(e) =>
                            setForm({ ...form, desktopW: e.target.value })
                          }
                        />
                      </Field>
                      <Field label="Desktop height">
                        <Input
                          inputMode="numeric"
                          value={form.desktopH}
                          onChange={(e) =>
                            setForm({ ...form, desktopH: e.target.value })
                          }
                        />
                      </Field>
                      <Field label="Max slots">
                        <Input
                          inputMode="numeric"
                          value={form.maxSlots}
                          onChange={(e) =>
                            setForm({ ...form, maxSlots: e.target.value })
                          }
                        />
                      </Field>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">Mobile creative</p>
                        <p className="text-xs text-[var(--muted)]">
                          Off = desktop-only (e.g. sidebar)
                        </p>
                      </div>
                      <Switch
                        checked={form.mobileEnabled}
                        onCheckedChange={(checked) =>
                          setForm({ ...form, mobileEnabled: checked })
                        }
                        aria-label="Enable mobile creative"
                      />
                    </div>
                    {form.mobileEnabled ? (
                      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
                        <Field label="Mobile width">
                          <Input
                            inputMode="numeric"
                            value={form.mobileW}
                            onChange={(e) =>
                              setForm({ ...form, mobileW: e.target.value })
                            }
                          />
                        </Field>
                        <Field label="Mobile height">
                          <Input
                            inputMode="numeric"
                            value={form.mobileH}
                            onChange={(e) =>
                              setForm({ ...form, mobileH: e.target.value })
                            }
                          />
                        </Field>
                      </div>
                    ) : null}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <Switch
                          id={`enabled-${p.key}`}
                          checked={form.enabled}
                          onCheckedChange={(checked) =>
                            setForm({ ...form, enabled: checked })
                          }
                          aria-label="Placement enabled"
                        />
                        <label
                          htmlFor={`enabled-${p.key}`}
                          className="text-sm"
                        >
                          Enabled
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          id={`house-${p.key}`}
                          checked={form.fallbackToHouseAds}
                          onCheckedChange={(checked) =>
                            setForm({ ...form, fallbackToHouseAds: checked })
                          }
                          aria-label="Fallback to house ads"
                        />
                        <label htmlFor={`house-${p.key}`} className="text-sm">
                          Fallback to house ads
                        </label>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--muted)]">
                      Key <span className="font-mono">{p.key}</span> cannot be
                      changed. Aspect (desktop):{" "}
                      {Number(form.desktopW) && Number(form.desktopH)
                        ? `${form.desktopW}×${form.desktopH}`
                        : "—"}
                      . Accepted 2× upload when dimensions are valid.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => void handleSave(p.key)}
                        disabled={savingKey === p.key}
                      >
                        {savingKey === p.key ? "Saving…" : "Save"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={cancelEdit}
                        disabled={savingKey === p.key}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
