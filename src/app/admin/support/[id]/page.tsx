"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminPage } from "@/components/layout";
import { Card, Badge, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { authFetch } from "@/lib/auth/clientAuth";
import UploadedImage from "@/components/ui/UploadedImage";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "Under review" },
  { value: "waiting_user", label: "Waiting for user" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export default function AdminSupportCasePage() {
  const params = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [upholdComplaint, setUpholdComplaint] = useState(true);
  const [admins, setAdmins] = useState<{ _id: string; name: string }[]>([]);

  async function load() {
    setLoading(true);
    try {
      const res = await authFetch(`/api/admin/support/${params.id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load case");
        return;
      }
      setTicket(data.ticket);
      setReply(data.ticket?.adminReply || "");
      setUpholdComplaint(data.ticket?.complaintUpheld !== false);
      setError("");
      if (data.ticket?.adminUnread) {
        void authFetch(`/api/admin/support/${params.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markRead: true }),
        }).then((r) => r.json()).then((d) => {
          if (typeof d.unreadCount === "number") {
            window.dispatchEvent(
              new CustomEvent("support-unread-updated", {
                detail: { unreadCount: d.unreadCount },
              }),
            );
          }
        });
      }
    } catch {
      setError("Failed to load case");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    authFetch("/api/admin/users?role=admin&limit=50")
      .then((r) => r.json())
      .then((data) => setAdmins(data.users || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await authFetch(`/api/admin/support/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Update failed");
        return;
      }
      setTicket(data.ticket);
      setReply(data.ticket?.adminReply || "");
      setNote("");
      if (typeof data.unreadCount === "number") {
        window.dispatchEvent(
          new CustomEvent("support-unread-updated", {
            detail: { unreadCount: data.unreadCount },
          }),
        );
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminPage title="Case">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Spinner size="sm" /> Loading case…
        </div>
      </AdminPage>
    );
  }

  if (error && !ticket) {
    return (
      <AdminPage title="Case">
        <Alert tone="danger">{error}</Alert>
        <Link href="/admin/support" className="mt-4 inline-block text-sm font-semibold text-[var(--brand)]">
          Back to inbox
        </Link>
      </AdminPage>
    );
  }

  const snap = ticket.productSnapshot || {};
  const userSnap = ticket.reportedUserSnapshot || {};
  const msg = ticket.messageSnapshot || {};
  const reporter = ticket.reporter || {};

  return (
    <AdminPage>
      <PageHeader
        title={ticket.caseNumber ? `Case #${ticket.caseNumber}` : ticket.subject}
        description={`${ticket.kindLabel} · ${ticket.statusLabel}`}
        actions={
          <Link href="/admin/support">
            <Button type="button" size="sm" variant="outline">
              ← Back
            </Button>
          </Link>
        }
      />

      {error ? <Alert tone="danger" className="mb-4">{error}</Alert> : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <Card className="p-5 space-y-3">
            <h2 className="font-bold text-[var(--ink)]">Case information</h2>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-[var(--muted)]">Type</dt>
                <dd>{ticket.kindLabel}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Priority</dt>
                <dd className="capitalize">
                  {ticket.priority === "high" ? (
                    <span className="font-semibold text-[var(--danger)]">High</span>
                  ) : (
                    ticket.priority
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Status</dt>
                <dd>
                  <Badge>{ticket.statusLabel}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Created</dt>
                <dd>{new Date(ticket.createdAt).toLocaleString("en-IN")}</dd>
              </div>
            </dl>
            {ticket.reasonLabel ? (
              <p className="text-sm">
                <span className="font-semibold">Reason:</span> {ticket.reasonLabel}
              </p>
            ) : null}
            <p className="text-sm whitespace-pre-wrap border border-[var(--border)] rounded-[var(--radius)] p-3 bg-[var(--surface-2)]">
              {ticket.message}
            </p>
            {Array.isArray(ticket.attachments) && ticket.attachments.length > 0 ? (
              <div>
                <p className="text-sm font-semibold mb-2">Evidence</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ticket.attachments.map((url: string) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer">
                      <UploadedImage
                        src={url}
                        alt="Evidence"
                        width={160}
                        height={160}
                        className="h-24 w-full object-cover rounded-lg border border-[var(--border)]"
                      />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>

          <Card className="p-5 space-y-3">
            <h2 className="font-bold text-[var(--ink)]">Reporter</h2>
            <p className="text-sm">
              {reporter.name} · {reporter.email}
            </p>
            <p className="text-xs text-[var(--muted)]">
              User ID: {reporter.userId}
              {reporter.isBlocked ? " · Blocked" : " · Active"}
            </p>
            {reporter.userId ? (
              <Link
                href={`/u/${reporter.userId}`}
                className="text-sm font-semibold text-[var(--brand)] hover:underline"
              >
                View profile
              </Link>
            ) : null}
          </Card>

          {snap.productId ? (
            <Card className="p-5 space-y-3">
              <h2 className="font-bold text-[var(--ink)]">Reported product (snapshot)</h2>
              <div className="flex gap-3">
                {snap.image ? (
                  <UploadedImage
                    src={snap.image}
                    alt={snap.productTitle || "Product"}
                    width={80}
                    height={80}
                    className="h-20 w-20 object-cover rounded-lg border border-[var(--border)]"
                  />
                ) : null}
                <div className="text-sm">
                  <p className="font-semibold">{snap.productTitle}</p>
                  <p className="text-[var(--muted)]">
                    {[snap.brand, snap.deviceModel].filter(Boolean).join(" / ")}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    ID {snap.productId} · {snap.listingStatus}
                    {typeof snap.price === "number" ? ` · ₹${snap.price}` : ""}
                  </p>
                  {snap.productUrl ? (
                    <a
                      href={snap.productUrl}
                      className="text-[var(--brand)] font-semibold hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open listing
                    </a>
                  ) : null}
                </div>
              </div>
              {ticket.productLive?.status &&
              ticket.productLive.status !== snap.listingStatus ? (
                <Alert tone="warning">
                  Live listing status is now {ticket.productLive.status} (snapshot was{" "}
                  {snap.listingStatus}).
                </Alert>
              ) : null}
            </Card>
          ) : null}

          {userSnap.userId ? (
            <Card className="p-5 space-y-2">
              <h2 className="font-bold text-[var(--ink)]">Reported user (snapshot)</h2>
              <p className="text-sm">{userSnap.name}</p>
              {userSnap.email ? (
                <p className="text-sm text-[var(--muted)]">{userSnap.email}</p>
              ) : null}
              <p className="text-xs text-[var(--muted)]">
                ID {userSnap.userId} · {userSnap.accountStatus}
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link
                  href={`/u/${userSnap.userId}`}
                  className="font-semibold text-[var(--brand)] hover:underline"
                >
                  Public profile
                </Link>
                {snap.sellerProfileUrl ? (
                  <span className="text-[var(--muted)]">
                    Seller at report time: {snap.sellerName}
                  </span>
                ) : null}
              </div>
            </Card>
          ) : null}

          {msg.messageId ? (
            <Card className="p-5 space-y-2">
              <h2 className="font-bold text-[var(--ink)]">Reported message</h2>
              <p className="text-sm whitespace-pre-wrap border border-[var(--border)] rounded-lg p-3 bg-[var(--surface-2)]">
                {msg.messageContent}
              </p>
              <p className="text-xs text-[var(--muted)]">
                From {msg.messageSenderName || msg.messageSenderId}
                {msg.messageTimestamp
                  ? ` · ${new Date(msg.messageTimestamp).toLocaleString("en-IN")}`
                  : ""}
              </p>
                  {ticket.conversationId ? (
                <Link
                  href="/admin/chat"
                  className="text-sm font-semibold text-[var(--brand)] hover:underline"
                >
                  Open admin chat
                </Link>
              ) : null}
            </Card>
          ) : null}

          {ticket.source?.pageUrl ? (
            <Card className="p-5">
              <h2 className="font-bold text-[var(--ink)] mb-1">Source</h2>
              <p className="text-xs break-all text-[var(--muted)]">
                {ticket.source.pageType}: {ticket.source.pageUrl}
              </p>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <h2 className="font-bold text-[var(--ink)]">Admin actions</h2>
            <Field label="Status" htmlFor="case-status">
              <Select
                id="case-status"
                value={ticket.status}
                disabled={saving}
                onChange={(e) => void patch({ status: e.target.value, markRead: true })}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priority" htmlFor="case-priority">
              <Select
                id="case-priority"
                value={ticket.priority || "normal"}
                disabled={saving}
                onChange={(e) => void patch({ priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </Select>
            </Field>
            <Field label="Assigned to" htmlFor="case-assignee">
              <Select
                id="case-assignee"
                value={ticket.assignedTo?.userId || ""}
                disabled={saving}
                onChange={(e) =>
                  void patch({ assignedTo: e.target.value || null })
                }
              >
                <option value="">Unassigned</option>
                {admins.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Reply to reporter" htmlFor="admin-reply">
              <Textarea
                id="admin-reply"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Visible to the reporter on their case page"
              />
            </Field>
            {ticket.type === "abuse" && ticket.reportedUserId ? (
              <label className="flex items-start gap-2.5 text-sm text-[var(--ink-secondary)]">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-[var(--brand)]"
                  checked={upholdComplaint}
                  onChange={(e) => setUpholdComplaint(e.target.checked)}
                />
                <span>
                  Count as upheld complaint when resolved or closed
                </span>
              </label>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={saving}
                loading={saving}
                onClick={() =>
                  void patch({
                    adminReply: reply,
                    markRead: true,
                    complaintUpheld: upholdComplaint,
                  })
                }
              >
                Save reply
              </Button>
              <Button
                type="button"
                variant="success"
                disabled={saving}
                onClick={() =>
                  void patch({
                    status: "resolved",
                    adminReply: reply,
                    complaintUpheld: upholdComplaint,
                  })
                }
              >
                Resolve
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => void patch({ status: "closed" })}
              >
                Close
              </Button>
              {(ticket.status === "resolved" || ticket.status === "closed") && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={saving}
                  onClick={() => void patch({ status: "open" })}
                >
                  Reopen
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <h2 className="font-bold text-[var(--ink)]">Internal notes</h2>
            <p className="text-xs text-[var(--muted)]">
              Never visible to the reporter.
            </p>
            <ul className="space-y-2 max-h-56 overflow-y-auto">
              {(ticket.adminNotes || []).length === 0 ? (
                <li className="text-sm text-[var(--muted)]">No notes yet.</li>
              ) : (
                (ticket.adminNotes || []).map((n: any, i: number) => (
                  <li
                    key={n._id || i}
                    className="text-sm border border-[var(--border)] rounded-lg p-2"
                  >
                    <p className="text-xs text-[var(--muted)]">
                      {n.name} · {n.createdAt ? new Date(n.createdAt).toLocaleString("en-IN") : ""}
                    </p>
                    <p className="whitespace-pre-wrap">{n.note}</p>
                  </li>
                ))
              )}
            </ul>
            <Field label="Add note" htmlFor="admin-note">
              <Textarea
                id="admin-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>
            <Button
              type="button"
              size="sm"
              disabled={saving || !note.trim()}
              onClick={() => void patch({ note })}
            >
              Add note
            </Button>
          </Card>

          <Card className="p-5 space-y-2">
            <h2 className="font-bold text-[var(--ink)]">Audit trail</h2>
            <ul className="space-y-2 max-h-64 overflow-y-auto text-xs text-[var(--muted)]">
              {(ticket.audit || []).length === 0 ? (
                <li>No events recorded.</li>
              ) : (
                [...(ticket.audit || [])].reverse().map((e: any, i: number) => (
                  <li key={e._id || i}>
                    {e.createdAt ? new Date(e.createdAt).toLocaleString("en-IN") : ""}{" "}
                    · {e.actorName || "System"} · {String(e.action).replace(/_/g, " ")}
                    {e.from || e.to ? ` (${e.from || "—"} → ${e.to || "—"})` : ""}
                  </li>
                ))
              )}
            </ul>
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}
