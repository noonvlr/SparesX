"use client";

import { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import Link from "next/link";
import { AdminPage } from "@/components/layout";
import { Card, PageHeader, Badge, Skeleton } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import {
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from "@/components/ui/Table";
import MessageBubble from "@/components/chat/MessageBubble";
import { authFetch } from "@/lib/auth/clientAuth";
import type { ChatMessage } from "@/types/chat";
import { AudienceFilters } from "./_components/AudienceFilters";
import {
  DEFAULT_FILTERS,
  filtersToApiBody,
  filtersToQuery,
  type AudiencePreview,
  type BroadcastFilterState,
} from "./_components/types";

const MAX_TEXT = 2000;

function applyName(template: string, name: string) {
  return template.replace(/\{\{\s*name\s*\}\}/gi, name || "there");
}

function newIdempotencyKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `bc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

type RecipientRow = {
  _id: string;
  name: string;
  email: string;
  role: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  isBlocked: boolean;
  isTrusted: boolean;
  eliteApproved: boolean;
  city: string;
  lastSeen: string | null;
  productCount: number;
  liveListingCount: number;
  requestCount: number;
  openRequestCount: number;
};

export default function AdminBroadcastPage() {
  const [filters, setFilters] = useState<BroadcastFilterState>(DEFAULT_FILTERS);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<AudiencePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [recipientsOpen, setRecipientsOpen] = useState(false);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [recipients, setRecipients] = useState<RecipientRow[]>([]);
  const [recipientPage, setRecipientPage] = useState(1);
  const [recipientTotal, setRecipientTotal] = useState(0);
  const [recipientTotalPages, setRecipientTotalPages] = useState(1);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    setError("");
    try {
      const params = new URLSearchParams(filtersToQuery(filters));
      const res = await authFetch(
        `/api/admin/broadcast/preview?${params.toString()}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to calculate audience");
        setPreview(null);
        return;
      }
      setPreview(data);
    } catch {
      setError("Failed to calculate audience");
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
    }, 400);
    return () => clearTimeout(t);
  }, [loadPreview]);

  const previewText = useMemo(() => {
    const name = preview?.sampleName || "Ahmed";
    return applyName(text || "Your message will appear here…", name);
  }, [text, preview?.sampleName]);

  const previewMessage: ChatMessage = useMemo(
    () => ({
      _id: "preview",
      conversationId: "preview",
      senderId: "admin",
      receiverId: "user",
      type: "text",
      text: previewText,
      delivered: false,
      read: false,
      createdAt: new Date().toISOString(),
    }),
    [previewText],
  );

  async function loadRecipients(page: number) {
    setRecipientsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams(filtersToQuery(filters));
      params.set("page", String(page));
      params.set("limit", "25");
      const res = await authFetch(
        `/api/admin/broadcast/recipients?${params.toString()}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load recipients");
        return;
      }
      setRecipients(data.rows || []);
      setRecipientPage(data.page || page);
      setRecipientTotal(data.total || 0);
      setRecipientTotalPages(data.totalPages || 1);
    } catch {
      setError("Failed to load recipients");
    } finally {
      setRecipientsLoading(false);
    }
  }

  function openRecipients() {
    setRecipientsOpen(true);
    void loadRecipients(1);
  }

  function openReview() {
    setError("");
    if (!text.trim()) {
      setError("Write a message before reviewing.");
      return;
    }
    if (!preview?.canSend) {
      setError(
        preview?.overLimit
          ? `Too many matches (${preview.matched}). Narrow filters to ${preview.maxRecipients} or fewer.`
          : "No eligible recipients for these filters.",
      );
      return;
    }
    setReviewOpen(true);
  }

  async function confirmSend() {
    setSending(true);
    setError("");
    setSuccess("");
    try {
      const res = await authFetch("/api/admin/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          text,
          filters: filtersToApiBody(filters),
          idempotencyKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Broadcast failed");
        return;
      }
      setSuccess(
        data.message ||
          `Broadcast ${data.status}: ${data.sentCount} sent` +
            (data.failedCount ? `, ${data.failedCount} failed` : ""),
      );
      setConfirmOpen(false);
      setReviewOpen(false);
      setText("");
      setIdempotencyKey(newIdempotencyKey());
      void loadPreview();
    } catch {
      setError("Broadcast failed");
    } finally {
      setSending(false);
    }
  }

  const eligible = preview?.eligible ?? 0;
  const largeAudience = eligible > 100;

  return (
    <AdminPage>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <PageHeader
          title="Broadcast Messages"
          description="Send targeted in-app messages to users based on account activity and profile."
        />
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void loadPreview()}
            disabled={previewLoading}
          >
            Refresh
          </Button>
          <Link href="/admin/broadcast/history">
            <Button type="button" variant="secondary" size="sm">
              Broadcast history
            </Button>
          </Link>
        </div>
      </div>

      {error ? (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert tone="success" className="mb-4">
          {success}{" "}
          <Link
            href="/admin/broadcast/history"
            className="underline font-medium"
          >
            View history
          </Link>
        </Alert>
      ) : null}

      {/* Step 1 */}
      <Card padding="md" className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">
          Step 1 — Define audience
        </p>
        <AudienceFilters
          filters={filters}
          onChange={(next) => {
            setFilters(next);
            setSuccess("");
          }}
          onClear={() => setFilters(DEFAULT_FILTERS)}
        />
      </Card>

      {/* Audience summary */}
      <Card padding="md" className="mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <h2 className="text-base font-semibold text-[var(--ink)]">
            Audience summary
          </h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={openRecipients}
            disabled={!preview || preview.matched === 0}
          >
            Preview recipients
          </Button>
        </div>

        {previewLoading && !preview ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
        ) : preview ? (
          <div className="space-y-3">
            <p className="text-2xl font-semibold text-[var(--ink)]">
              {preview.matched.toLocaleString()}{" "}
              <span className="text-base font-medium text-[var(--muted)]">
                user{preview.matched === 1 ? "" : "s"} match your filters
              </span>
              {previewLoading ? (
                <Spinner className="inline-block ml-2 align-middle" />
              ) : null}
            </p>
            <p className="text-sm text-[var(--ink-secondary)]">
              {preview.description}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {preview.chips.map((c) => (
                <Badge key={c} tone="neutral">
                  {c}
                </Badge>
              ))}
            </div>

            {preview.overLimit ? (
              <Alert tone="warning">
                {preview.matched.toLocaleString()} users match, but broadcasts
                are limited to {preview.maxRecipients} recipients. Narrow your
                filters until the match count is {preview.maxRecipients} or
                fewer. Sending is disabled until then.
              </Alert>
            ) : preview.eligible > 0 ? (
              <p className="text-sm text-[var(--ink)]">
                <span className="font-semibold">
                  {preview.eligible.toLocaleString()}
                </span>{" "}
                users are eligible to receive this message.
              </p>
            ) : (
              <Alert tone="warning">
                {preview.matched > 0
                  ? "Users match your filters, but none are currently eligible to receive this message."
                  : "No users match these filters."}
              </Alert>
            )}

            {(preview.exclusions.admins > 0 ||
              preview.exclusions.blocked > 0 ||
              preview.exclusions.self > 0) && (
              <ul className="text-sm text-[var(--muted)] list-disc pl-5 space-y-0.5">
                {preview.exclusions.admins > 0 ? (
                  <li>
                    {preview.exclusions.admins} admin account
                    {preview.exclusions.admins === 1 ? "" : "s"} excluded
                  </li>
                ) : null}
                {preview.exclusions.blocked > 0 ? (
                  <li>
                    {preview.exclusions.blocked} blocked user
                    {preview.exclusions.blocked === 1 ? "" : "s"} excluded
                  </li>
                ) : null}
                {preview.exclusions.self > 0 ? (
                  <li>Your admin account is excluded</li>
                ) : null}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Adjust filters to calculate the audience.
          </p>
        )}
      </Card>

      {/* Step 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card padding="md">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">
            Step 2 — Compose message
          </p>
          <Field
            label="Message"
            htmlFor="bc-text"
            hint="Delivered as an in-app chat from your admin account. Offline users may also get an email if SMTP is configured."
          >
            <Textarea
              id="bc-text"
              className="min-h-[140px]"
              value={text}
              maxLength={MAX_TEXT}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write the message users will receive from the SparesX admin…"
            />
          </Field>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
            <span>
              Personalize with{" "}
              <button
                type="button"
                className="font-mono text-[var(--brand)] hover:underline"
                onClick={() =>
                  setText((t) =>
                    t.includes("{{name}}") ? t : `Hi {{name}}, ${t}`.trim(),
                  )
                }
              >
                {"{{name}}"}
              </button>
            </span>
            <span>
              {text.length}/{MAX_TEXT}
            </span>
          </div>
          <p className="mt-3 text-sm text-[var(--ink-secondary)]">
            Delivery: <strong>In-app message</strong>. Users who are offline may
            also receive an email notification if email is configured.
          </p>
        </Card>

        <Card padding="md">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">
            Message preview
          </p>
          <p className="text-sm text-[var(--muted)] mb-3">
            As seen in chat · SparesX Admin
            {preview?.sampleName
              ? ` → sample recipient “${preview.sampleName}”`
              : ""}
          </p>
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)] p-4 min-h-[160px]">
            <MessageBubble message={previewMessage} mine />
          </div>
        </Card>
      </div>

      {/* Step 3 CTA */}
      <Card padding="md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Step 3 — Review before sending
            </p>
            <p className="text-sm text-[var(--ink-secondary)] mt-1">
              You will confirm the audience and message before anything is sent.
            </p>
          </div>
          <Button
            type="button"
            onClick={openReview}
            disabled={
              sending ||
              !preview?.canSend ||
              !text.trim() ||
              text.length > MAX_TEXT
            }
          >
            Review broadcast
          </Button>
        </div>
      </Card>

      {/* Recipients modal */}
      <Modal
        open={recipientsOpen}
        onClose={() => setRecipientsOpen(false)}
        title="Preview recipients"
        className="max-w-5xl"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <p className="text-sm text-[var(--muted)]">
              Showing {(recipientPage - 1) * 25 + 1}–
              {Math.min(recipientPage * 25, recipientTotal)} of {recipientTotal}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={recipientPage <= 1 || recipientsLoading}
                onClick={() => void loadRecipients(recipientPage - 1)}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={
                  recipientPage >= recipientTotalPages || recipientsLoading
                }
                onClick={() => void loadRecipients(recipientPage + 1)}
              >
                Next
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setRecipientsOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        }
      >
        {recipientsLoading ? (
          <div className="flex items-center gap-2 py-8 text-[var(--muted)]">
            <Spinner /> Loading recipients…
          </div>
        ) : recipients.length === 0 ? (
          <p className="text-sm text-[var(--muted)] py-6">
            No recipients for these filters.
          </p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>User</TH>
                <TH>Role</TH>
                <TH>Phone</TH>
                <TH>Email</TH>
                <TH>Products</TH>
                <TH>Listings</TH>
                <TH>Requests</TH>
                <TH>City</TH>
                <TH>Last activity</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {recipients.map((r) => (
                <TR key={r._id}>
                  <TD>
                    <div className="font-medium text-[var(--ink)]">
                      {r.name}
                    </div>
                    <div className="text-xs text-[var(--muted)]">{r.email}</div>
                  </TD>
                  <TD>{r.role}</TD>
                  <TD>
                    {r.phoneVerified ? (
                      <Badge tone="success">Verified</Badge>
                    ) : (
                      <Badge tone="neutral">No</Badge>
                    )}
                  </TD>
                  <TD>
                    {r.emailVerified ? (
                      <Badge tone="success">Verified</Badge>
                    ) : (
                      <Badge tone="neutral">No</Badge>
                    )}
                  </TD>
                  <TD>{r.productCount}</TD>
                  <TD>{r.liveListingCount}</TD>
                  <TD>
                    {r.requestCount}
                    {r.openRequestCount
                      ? ` (${r.openRequestCount} open)`
                      : ""}
                  </TD>
                  <TD>{r.city || "—"}</TD>
                  <TD className="whitespace-nowrap">
                    {r.lastSeen
                      ? new Date(r.lastSeen).toLocaleDateString("en-IN")
                      : "Never"}
                  </TD>
                  <TD>
                    {r.isBlocked ? (
                      <Badge tone="danger">Blocked</Badge>
                    ) : (
                      <Badge tone="success">Active</Badge>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Modal>

      {/* Review modal */}
      <Modal
        open={reviewOpen}
        onClose={() => !sending && setReviewOpen(false)}
        title="Review broadcast"
        className="max-w-lg"
        footer={
          <div className="flex flex-wrap justify-end gap-2 w-full">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setReviewOpen(false)}
              disabled={sending}
            >
              Back to edit
            </Button>
            <Button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={sending}
            >
              Confirm &amp; Send
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold text-[var(--ink)]">Audience</p>
            <p className="text-[var(--ink-secondary)]">
              {preview?.matched} matched · {preview?.eligible} eligible
            </p>
            <p className="mt-1 text-[var(--muted)]">{preview?.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {preview?.chips.map((c) => (
                <Badge key={c} tone="neutral">
                  {c}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold text-[var(--ink)]">Message</p>
            <p className="mt-1 whitespace-pre-wrap rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3 text-[var(--ink)]">
              {text}
            </p>
          </div>
          <div>
            <p className="font-semibold text-[var(--ink)]">Delivery</p>
            <p className="text-[var(--ink-secondary)]">
              In-app chat message. Offline users may also receive an email if
              SMTP is configured.
            </p>
          </div>
          {largeAudience ? (
            <Alert tone="warning">
              You are sending to more than 100 users. Verify the audience before
              continuing.
            </Alert>
          ) : null}
        </div>
      </Modal>

      {/* Final confirm */}
      <Modal
        open={confirmOpen}
        onClose={() => !sending && setConfirmOpen(false)}
        title="Send this broadcast?"
        className="max-w-md"
        footer={
          <div className="flex flex-wrap justify-end gap-2 w-full">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmOpen(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void confirmSend()}
              loading={sending}
              disabled={sending}
            >
              {sending
                ? "Sending broadcast…"
                : `Send to ${eligible.toLocaleString()} users`}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[var(--ink-secondary)]">
          You are about to send this message to{" "}
          <strong>{eligible.toLocaleString()}</strong> users. This creates
          individual messages in their conversations with the admin account.
        </p>
        {sending ? (
          <p className="mt-3 text-sm text-[var(--muted)] flex items-center gap-2">
            <Spinner /> Processing messages — please keep this window open.
          </p>
        ) : null}
      </Modal>
    </AdminPage>
  );
}
