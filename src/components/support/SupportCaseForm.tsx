"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { authFetch } from "@/lib/auth/clientAuth";
import { useImageUpload } from "@/hooks/useImageUpload";
import {
  DESCRIPTION_REQUIRED_REASONS,
  GENERAL_SUPPORT_TYPES,
  reasonsForTarget,
  type SupportTargetType,
} from "@/lib/support/constants";
import {
  ReportContextCard,
  type PublicReportContext,
} from "@/components/support/ReportContextCard";

type Props = {
  targetType: SupportTargetType;
  productId?: string;
  reportedUserId?: string;
  conversationId?: string;
  messageId?: string;
  sourcePage?: string;
  sourcePageType?: string;
  heading?: string;
  initialType?: string;
};

export function SupportCaseForm({
  targetType,
  productId,
  reportedUserId,
  conversationId,
  messageId,
  sourcePage,
  sourcePageType,
  heading,
  initialType,
}: Props) {
  const router = useRouter();
  const { uploadImages, uploading, uploadError } = useImageUpload();
  const [context, setContext] = useState<PublicReportContext | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  const [loadingContext, setLoadingContext] = useState(targetType !== "none");
  const [type, setType] = useState(
    initialType && GENERAL_SUPPORT_TYPES.some((t) => t.value === initialType)
      ? initialType
      : initialType === "abuse"
        ? "safety"
        : "issue",
  );
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasons = useMemo(() => reasonsForTarget(targetType), [targetType]);
  const detailsRequired =
    targetType === "none" || DESCRIPTION_REQUIRED_REASONS.has(reason);

  useEffect(() => {
    if (targetType === "none") {
      setLoadingContext(false);
      return;
    }
    const params = new URLSearchParams({ type: targetType });
    if (targetType === "product" && productId) params.set("id", productId);
    if (targetType === "user" && reportedUserId) params.set("id", reportedUserId);
    if (targetType === "message" && messageId) params.set("id", messageId);
    if (productId && targetType !== "product") params.set("productId", productId);
    if (conversationId) params.set("conversationId", conversationId);
    if (sourcePage) params.set("source", sourcePage);
    if (sourcePageType) params.set("pageType", sourcePageType);

    let cancelled = false;
    setLoadingContext(true);
    authFetch(`/api/support/context?${params}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setContextError(data.message || "Could not load report context");
          return;
        }
        setContext(data.context);
      })
      .catch(() => {
        if (!cancelled) setContextError("Could not load report context");
      })
      .finally(() => {
        if (!cancelled) setLoadingContext(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    targetType,
    productId,
    reportedUserId,
    conversationId,
    messageId,
    sourcePage,
    sourcePageType,
  ]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const result = await uploadImages(Array.from(files).slice(0, 4));
    if (result.urls.length) {
      setAttachments((prev) => [...prev, ...result.urls].slice(0, 4));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await authFetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: targetType === "none" ? type : "abuse",
          targetType,
          reason: targetType === "none" ? undefined : reason,
          subject: context?.subjectHint,
          message: details,
          productId: productId || context?.product?.productId,
          reportedUserId: reportedUserId || context?.reportedUser?.userId,
          conversationId:
            conversationId || context?.message?.conversationId,
          messageId: messageId || context?.message?.messageId,
          sourcePage:
            sourcePage ||
            (typeof window !== "undefined" ? window.location.href : undefined),
          sourcePageType: sourcePageType || targetType,
          attachments,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Failed to submit");
        return;
      }
      const caseNumber = data.ticket?.caseNumber || "";
      const id = data.ticket?._id || "";
      const qs = new URLSearchParams();
      if (caseNumber) qs.set("n", caseNumber);
      if (id) qs.set("id", id);
      if (data.duplicate) qs.set("dup", "1");
      router.push(`/support/submitted?${qs.toString()}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const title =
    heading ||
    (targetType === "product"
      ? "Report this product"
      : targetType === "user"
        ? "Report user"
        : targetType === "message"
          ? "Report this message"
          : "Contact support");

  if (loadingContext) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--muted)] py-8">
        <div className="h-5 w-5 rounded-full border-2 border-[var(--brand-muted)] border-t-[var(--brand)] animate-spin" />
        Loading context…
      </div>
    );
  }

  if (contextError) {
    return <Alert tone="danger">{contextError}</Alert>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-bold text-[var(--ink)]">{title}</h2>
      {context && targetType !== "none" ? (
        <ReportContextCard context={context} />
      ) : null}

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {targetType === "none" ? (
        <Field label="What do you need help with?" htmlFor="support-type" required>
          <Select
            id="support-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
          >
            {GENERAL_SUPPORT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        <Field label="Reason" htmlFor="support-reason" required>
          <Select
            id="support-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          >
            <option value="">Select a reason</option>
            {reasons.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field
        label="Additional details"
        htmlFor="support-details"
        required={detailsRequired}
        hint={
          detailsRequired
            ? undefined
            : "Optional — add anything that would help us investigate."
        }
      >
        <Textarea
          id="support-details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="min-h-[140px]"
          maxLength={4000}
          required={detailsRequired}
          placeholder={
            targetType === "none"
              ? "Describe the issue in detail…"
              : "Anything else we should know?"
          }
        />
      </Field>

      <Field
        label="Evidence (optional)"
        htmlFor="support-files"
        hint="Up to 4 images, 5MB each. JPEG, PNG, WebP, or GIF."
        error={uploadError || undefined}
      >
        <input
          id="support-files"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={(e) => void onFiles(e.target.files)}
          className="block w-full text-sm text-[var(--ink-secondary)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--brand-soft)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[var(--brand-hover)]"
        />
        {attachments.length > 0 ? (
          <p className="mt-1 text-xs text-[var(--muted)]">
            {attachments.length} image{attachments.length === 1 ? "" : "s"} attached
            {uploading ? " · uploading…" : ""}
          </p>
        ) : null}
      </Field>

      <Button
        type="submit"
        disabled={submitting || uploading}
        className="w-full sm:w-auto"
      >
        {submitting ? "Submitting…" : "Submit"}
      </Button>
    </form>
  );
}
