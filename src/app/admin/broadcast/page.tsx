"use client";

import { useCallback, useEffect, useState, startTransition } from "react";
import { AdminPage } from "@/components/layout";
import { Card, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Field } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { authFetch } from "@/lib/auth/clientAuth";

type Preview = {
  matched: number;
  willSend: number;
  capped: boolean;
  maxRecipients: number;
};

type Filters = {
  role: string;
  phoneVerified: string;
  emailVerified: string;
  isBlocked: string;
  hasProducts: string;
  hasApprovedProducts: string;
  hasRequests: string;
  isTrusted: string;
  eliteApproved: string;
  city: string;
  signedUpFrom: string;
  signedUpTo: string;
  inactiveDays: string;
};

const DEFAULT_FILTERS: Filters = {
  role: "technician",
  phoneVerified: "any",
  emailVerified: "any",
  isBlocked: "no",
  hasProducts: "any",
  hasApprovedProducts: "any",
  hasRequests: "any",
  isTrusted: "any",
  eliteApproved: "any",
  city: "",
  signedUpFrom: "",
  signedUpTo: "",
  inactiveDays: "",
};

function TriSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <Select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="any">Any</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </Select>
    </Field>
  );
}

export default function AdminBroadcastPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const setFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setSuccess("");
  };

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      const res = await authFetch(
        `/api/admin/broadcast/preview?${params.toString()}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to preview audience");
        setPreview(null);
        return;
      }
      setPreview(data);
    } catch {
      setError("Failed to preview audience");
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(() => {
      startTransition(() => {
        void loadPreview();
      });
    }, 350);
    return () => clearTimeout(t);
  }, [loadPreview]);

  async function handleSend() {
    setError("");
    setSuccess("");
    if (!text.trim()) {
      setError("Write a message before sending.");
      return;
    }
    const count = preview?.willSend ?? 0;
    if (
      !confirm(
        `Send this in-app chat message to ${count} user${count === 1 ? "" : "s"}?\n\nEach recipient gets a normal conversation with your admin account.`,
      )
    ) {
      return;
    }
    setSending(true);
    try {
      const res = await authFetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, filters }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Broadcast failed");
        return;
      }
      setSuccess(
        `Sent ${data.sent} message${data.sent === 1 ? "" : "s"}${
          data.failed ? ` (${data.failed} failed)` : ""
        }.${data.capped ? ` Audience capped at ${data.maxRecipients}.` : ""}`,
      );
      setText("");
      void loadPreview();
    } catch {
      setError("Broadcast failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <AdminPage>
      <PageHeader
        title="Bulk messaging"
        description="Filter users and send one in-app chat message from your admin account. Recipients get a normal thread under Messages (and email if they are offline)."
      />

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="md">
          <h2 className="font-semibold text-[var(--ink)] mb-3">
            Audience filters
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Role" htmlFor="bc-role">
              <Select
                id="bc-role"
                value={filters.role}
                onChange={(e) => setFilter("role", e.target.value)}
              >
                <option value="technician">Technicians</option>
                <option value="admin">Admins</option>
                <option value="all">All roles</option>
              </Select>
            </Field>
            <TriSelect
              id="bc-phone"
              label="Phone verified"
              value={filters.phoneVerified}
              onChange={(v) => setFilter("phoneVerified", v)}
            />
            <TriSelect
              id="bc-email"
              label="Email verified"
              value={filters.emailVerified}
              onChange={(v) => setFilter("emailVerified", v)}
            />
            <TriSelect
              id="bc-blocked"
              label="Blocked"
              value={filters.isBlocked}
              onChange={(v) => setFilter("isBlocked", v)}
            />
            <TriSelect
              id="bc-products"
              label="Has any product"
              value={filters.hasProducts}
              onChange={(v) => setFilter("hasProducts", v)}
            />
            <TriSelect
              id="bc-approved"
              label="Has live listing"
              value={filters.hasApprovedProducts}
              onChange={(v) => setFilter("hasApprovedProducts", v)}
            />
            <TriSelect
              id="bc-requests"
              label="Has spare request"
              value={filters.hasRequests}
              onChange={(v) => setFilter("hasRequests", v)}
            />
            <TriSelect
              id="bc-trusted"
              label="Trusted seller"
              value={filters.isTrusted}
              onChange={(v) => setFilter("isTrusted", v)}
            />
            <TriSelect
              id="bc-elite"
              label="Elite approved"
              value={filters.eliteApproved}
              onChange={(v) => setFilter("eliteApproved", v)}
            />
            <Field label="City (exact)" htmlFor="bc-city">
              <Input
                id="bc-city"
                value={filters.city}
                onChange={(e) => setFilter("city", e.target.value)}
                placeholder="e.g. Mumbai"
              />
            </Field>
            <Field label="Signed up from" htmlFor="bc-from">
              <Input
                id="bc-from"
                type="date"
                value={filters.signedUpFrom}
                onChange={(e) => setFilter("signedUpFrom", e.target.value)}
              />
            </Field>
            <Field label="Signed up to" htmlFor="bc-to">
              <Input
                id="bc-to"
                type="date"
                value={filters.signedUpTo}
                onChange={(e) => setFilter("signedUpTo", e.target.value)}
              />
            </Field>
            <Field label="Inactive for (days)" htmlFor="bc-inactive">
              <Input
                id="bc-inactive"
                type="number"
                min={1}
                value={filters.inactiveDays}
                onChange={(e) => setFilter("inactiveDays", e.target.value)}
                placeholder="Any activity"
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
            {previewLoading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> Counting…
              </span>
            ) : preview ? (
              <p>
                <span className="font-semibold text-[var(--ink)]">
                  {preview.matched}
                </span>{" "}
                matched
                {preview.capped
                  ? ` — will send to first ${preview.willSend} (cap ${preview.maxRecipients})`
                  : ` — will send to ${preview.willSend}`}
              </p>
            ) : (
              <p>Adjust filters to preview the audience.</p>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void loadPreview()}
              disabled={previewLoading}
            >
              Refresh
            </Button>
          </div>
        </Card>

        <Card padding="md">
          <h2 className="font-semibold text-[var(--ink)] mb-3">Message</h2>
          <Field label="In-app chat text" htmlFor="bc-text">
            <Textarea
              id="bc-text"
              className="min-h-[180px]"
              value={text}
              maxLength={2000}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write the message users will see in their chat with admin…"
            />
          </Field>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {text.length}/2000 · Offline users also get an email when SMTP is
            configured.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void handleSend()}
              loading={sending}
              disabled={sending || !preview?.willSend}
            >
              Send to {preview?.willSend ?? 0} users
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFilters(DEFAULT_FILTERS);
                setText("");
                setSuccess("");
              }}
            >
              Reset
            </Button>
          </div>
        </Card>
      </div>
    </AdminPage>
  );
}
