"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { authFetch, isLoggedInClient } from "@/lib/auth/clientAuth";
import { ReportContextCard } from "@/components/support/ReportContextCard";
import UploadedImage from "@/components/ui/UploadedImage";

export default function SupportCaseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedInClient()) {
      router.replace(`/login?next=/support/cases/${params.id}`);
      return;
    }
    authFetch(`/api/support/${params.id}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.message || "Case not found");
          return;
        }
        setTicket(data.ticket);
        if (data.ticket?.userUnread) {
          void authFetch("/api/support", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticketId: params.id }),
          });
        }
      })
      .catch(() => setError("Failed to load this case"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  if (loading) {
    return (
      <main className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--brand-muted)] border-t-[var(--brand)] rounded-full animate-spin" />
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="max-w-lg mx-auto py-12 px-4">
        <Alert tone="danger">{error || "Case not found"}</Alert>
        <Link
          href="/support/cases"
          className="mt-4 inline-block text-sm font-semibold text-[var(--brand)]"
        >
          Back to your cases
        </Link>
      </main>
    );
  }

  const context = {
    targetType: ticket.targetType || "none",
    product: ticket.productSnapshot,
    reportedUser: ticket.reportedUserSnapshot,
    message: ticket.messageSnapshot,
  };

  return (
    <main className="min-h-screen bg-[var(--surface-2)] py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          title={ticket.caseNumber ? `Case #${ticket.caseNumber}` : ticket.subject}
          description={`${ticket.kindLabel || "Support"} · ${ticket.statusLabel || ticket.status}`}
        />
        <Card className="p-5 sm:p-6 space-y-4">
          <p className="text-sm text-[var(--muted)]">
            Submitted {new Date(ticket.createdAt).toLocaleString("en-IN")}
          </p>
          {ticket.reasonLabel ? (
            <p className="text-sm text-[var(--ink)]">
              <span className="font-semibold">Reason:</span> {ticket.reasonLabel}
            </p>
          ) : null}
          <p className="text-sm text-[var(--ink)] whitespace-pre-wrap">
            {ticket.message}
          </p>
          {context.product || context.reportedUser || context.message ? (
            <ReportContextCard context={context} />
          ) : null}
          {Array.isArray(ticket.attachments) && ticket.attachments.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ticket.attachments.map((url: string) => (
                <UploadedImage
                  key={url}
                  src={url}
                  alt="Attached evidence"
                  width={160}
                  height={160}
                  className="h-24 w-full rounded-lg object-cover border border-[var(--border)]"
                />
              ))}
            </div>
          ) : null}
          {ticket.adminReply ? (
            <Alert tone="info" title="Support reply">
              <p className="whitespace-pre-wrap">{ticket.adminReply}</p>
            </Alert>
          ) : null}
        </Card>
        <Link
          href="/support/cases"
          className="text-sm font-semibold text-[var(--brand)] hover:underline"
        >
          ← All your cases
        </Link>
      </div>
    </main>
  );
}
