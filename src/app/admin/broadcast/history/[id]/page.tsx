"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminPage } from "@/components/layout";
import { Card, PageHeader, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import {
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from "@/components/ui/Table";
import { authFetch } from "@/lib/auth/clientAuth";

type Detail = {
  broadcast: {
    _id: string;
    text: string;
    filters: Record<string, unknown>;
    audienceDescription: string;
    status: string;
    matchedCount: number;
    eligibleCount: number;
    attemptedCount: number;
    sentCount: number;
    failedCount: number;
    errorSummary: string[];
    createdAt: string;
    completedAt: string | null;
    admin: { name: string; email: string } | null;
  };
  recipients: Array<{
    _id: string;
    status: string;
    error: string | null;
    sentAt: string | null;
    user: {
      _id: string;
      name: string;
      email: string;
      role: string;
      city: string;
    };
  }>;
};

export default function BroadcastDetailPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    authFetch(`/api/admin/broadcast/history/${id}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Not found");
        setData(json);
      })
      .catch((e: Error) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <AdminPage>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <PageHeader
          title="Broadcast details"
          description="Filters, message, and per-recipient delivery status."
        />
        <div className="flex gap-2">
          <Link href="/admin/broadcast/history">
            <Button type="button" variant="secondary" size="sm">
              Back to history
            </Button>
          </Link>
          <Link href="/admin/broadcast">
            <Button type="button" size="sm">
              New broadcast
            </Button>
          </Link>
        </div>
      </div>

      {error ? (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-[var(--muted)]">
          <Spinner /> Loading…
        </div>
      ) : data ? (
        <div className="space-y-4">
          <Card padding="md">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge tone="neutral">{data.broadcast.status}</Badge>
              <span className="text-sm text-[var(--muted)]">
                {new Date(data.broadcast.createdAt).toLocaleString("en-IN")}
              </span>
              <span className="text-sm text-[var(--muted)]">
                by {data.broadcast.admin?.name || "Admin"}
              </span>
            </div>
            <p className="text-sm text-[var(--ink-secondary)] mb-2">
              {data.broadcast.audienceDescription}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
              <div>
                <p className="text-[var(--muted)]">Matched</p>
                <p className="font-semibold">{data.broadcast.matchedCount}</p>
              </div>
              <div>
                <p className="text-[var(--muted)]">Eligible</p>
                <p className="font-semibold">{data.broadcast.eligibleCount}</p>
              </div>
              <div>
                <p className="text-[var(--muted)]">Sent</p>
                <p className="font-semibold">{data.broadcast.sentCount}</p>
              </div>
              <div>
                <p className="text-[var(--muted)]">Failed</p>
                <p className="font-semibold">{data.broadcast.failedCount}</p>
              </div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1">
              Message
            </p>
            <p className="whitespace-pre-wrap rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm">
              {data.broadcast.text}
            </p>
            {data.broadcast.errorSummary?.length ? (
              <Alert tone="warning" className="mt-3">
                {data.broadcast.errorSummary.join(" · ")}
              </Alert>
            ) : null}
          </Card>

          <Card padding="md">
            <h2 className="font-semibold text-[var(--ink)] mb-3">
              Recipients (up to 100 shown)
            </h2>
            <Table>
              <THead>
                <TR>
                  <TH>User</TH>
                  <TH>City</TH>
                  <TH>Status</TH>
                  <TH>Sent at</TH>
                  <TH>Error</TH>
                </TR>
              </THead>
              <TBody>
                {data.recipients.map((r) => (
                  <TR key={r._id}>
                    <TD>
                      <div className="font-medium">{r.user.name}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {r.user.email}
                      </div>
                    </TD>
                    <TD>{r.user.city || "—"}</TD>
                    <TD>
                      <Badge
                        tone={
                          r.status === "sent"
                            ? "success"
                            : r.status === "failed"
                              ? "danger"
                              : "neutral"
                        }
                      >
                        {r.status}
                      </Badge>
                    </TD>
                    <TD>
                      {r.sentAt
                        ? new Date(r.sentAt).toLocaleString("en-IN")
                        : "—"}
                    </TD>
                    <TD className="max-w-[200px] text-xs text-[var(--muted)]">
                      {r.error || "—"}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        </div>
      ) : null}
    </AdminPage>
  );
}
