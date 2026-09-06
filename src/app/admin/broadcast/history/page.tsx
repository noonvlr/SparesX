"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

type HistoryRow = {
  _id: string;
  text: string;
  audienceDescription: string;
  status: string;
  matchedCount: number;
  eligibleCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  admin: { name: string; email: string } | null;
};

function statusTone(
  status: string,
): "success" | "warning" | "danger" | "neutral" | "brand" {
  if (status === "completed") return "success";
  if (status === "partial") return "warning";
  if (status === "failed") return "danger";
  if (status === "processing" || status === "queued") return "brand";
  return "neutral";
}

export default function BroadcastHistoryPage() {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(p: number) {
    setLoading(true);
    setError("");
    try {
      const res = await authFetch(
        `/api/admin/broadcast/history?page=${p}&limit=20`,
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load history");
        return;
      }
      setRows(data.rows || []);
      setPage(data.page || p);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      setError("Failed to load history");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(1);
  }, []);

  return (
    <AdminPage>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <PageHeader
          title="Broadcast history"
          description="Past admin broadcasts with delivery status."
        />
        <Link href="/admin/broadcast">
          <Button type="button" size="sm">
            New broadcast
          </Button>
        </Link>
      </div>

      {error ? (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <Card padding="md">
        {loading ? (
          <div className="flex items-center gap-2 py-10 text-[var(--muted)]">
            <Spinner /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-[var(--muted)] py-8">
            No broadcasts yet.{" "}
            <Link href="/admin/broadcast" className="text-[var(--brand)] underline">
              Create one
            </Link>
          </p>
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Date</TH>
                  <TH>Admin</TH>
                  <TH>Audience</TH>
                  <TH>Message</TH>
                  <TH>Recipients</TH>
                  <TH>Sent</TH>
                  <TH>Failed</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((r) => (
                  <TR key={r._id}>
                    <TD className="whitespace-nowrap">
                      <Link
                        href={`/admin/broadcast/history/${r._id}`}
                        className="text-[var(--brand)] font-medium hover:underline"
                      >
                        {new Date(r.createdAt).toLocaleString("en-IN")}
                      </Link>
                    </TD>
                    <TD>{r.admin?.name || "Admin"}</TD>
                    <TD className="max-w-[220px]">
                      <span className="line-clamp-2 text-[var(--ink-secondary)]">
                        {r.audienceDescription || "—"}
                      </span>
                    </TD>
                    <TD className="max-w-[240px]">
                      <span className="line-clamp-2">{r.text}</span>
                    </TD>
                    <TD>{r.eligibleCount}</TD>
                    <TD>{r.sentCount}</TD>
                    <TD>{r.failedCount}</TD>
                    <TD>
                      <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-[var(--muted)]">
                Page {page} of {totalPages} · {total} total
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => void load(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => void load(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </AdminPage>
  );
}
