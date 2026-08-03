"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ToastHost";
import { openChatUi } from "@/components/chat/openChat";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type ConnectItem = {
  _id: string;
  status: string;
  message?: string;
  createdAt: string;
  respondedAt?: string;
  expiresAt?: string;
  product?: { _id: string; name: string } | null;
  peer: {
    _id: string;
    name: string;
    profilePicture?: string;
    city?: string;
  };
};

function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function StatusPill({ status }: { status: string }) {
  const tones: Record<string, "warning" | "success" | "danger" | "neutral"> = {
    pending: "warning",
    approved: "success",
    declined: "danger",
    expired: "neutral",
    revoked: "neutral",
  };
  return (
    <Badge tone={tones[status] || "neutral"} className="capitalize">
      {status}
    </Badge>
  );
}

export default function WhatsAppConnectClient() {
  const router = useRouter();
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const [items, setItems] = useState<ConnectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async (box: "incoming" | "outgoing") => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push(`/login?next=${encodeURIComponent("/whatsapp-connect")}`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/whatsapp-connect?box=${box}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.message || "Failed to load requests", "error");
        return;
      }
      setItems(data.items || []);
    } catch {
      showToast("Failed to load requests", "error");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load(tab);
  }, [tab, load]);

  const act = async (id: string, action: "approve" | "decline" | "revoke") => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setActionId(id);
    try {
      const res = await fetch(`/api/whatsapp-connect/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.message || "Action failed", "error");
        return;
      }
      showToast(data.message || "Updated");
      window.dispatchEvent(new Event("sparesx-wa-connect-changed"));
      await load(tab);
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setActionId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <PageHeader
          title="WhatsApp connections"
          description="Approve a request once and that buyer can WhatsApp you for any of your listings. In-app chat stays available without approval."
        />

        <div className="flex gap-2 mb-6">
          {(
            [
              ["incoming", "Incoming"],
              ["outgoing", "Outgoing"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-[var(--radius)] text-sm font-semibold transition ${
                tab === key
                  ? "bg-[var(--brand)] text-[var(--primary-foreground)]"
                  : "bg-[var(--surface)] text-[var(--ink-secondary)] border border-[var(--border)] hover:bg-[var(--surface-2)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-10 h-10 border-4 border-[var(--brand-muted)] border-t-[var(--brand)] rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <Card className="border-dashed">
            <EmptyState
              title={
                tab === "incoming"
                  ? "No WhatsApp requests yet"
                  : "No requests sent yet"
              }
              description={
                tab === "incoming"
                  ? "Incoming buyer requests will appear here."
                  : "You haven't sent any WhatsApp requests."
              }
              action={
                <Link href="/products">
                  <Button variant="soft">Browse products →</Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item._id}>
              <Card className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-[var(--surface-3)] overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-bold text-[var(--muted)]">
                    {item.peer.profilePicture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.peer.profilePicture}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (item.peer.name || "?").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.peer._id ? (
                        <Link
                          href={`/u/${item.peer._id}`}
                          className="font-semibold text-[var(--ink)] hover:text-[var(--brand)] truncate"
                        >
                          {item.peer.name}
                        </Link>
                      ) : (
                        <span className="font-semibold text-[var(--ink)]">
                          {item.peer.name}
                        </span>
                      )}
                      <StatusPill status={item.status} />
                    </div>
                    {item.peer.city && (
                      <p className="text-xs text-[var(--muted)] mt-0.5">{item.peer.city}</p>
                    )}
                    {item.product && (
                      <p className="text-sm text-[var(--ink-secondary)] mt-1">
                        About:{" "}
                        <Link
                          href={`/product/${item.product._id}`}
                          className="text-[var(--brand)] hover:underline"
                        >
                          {item.product.name}
                        </Link>
                      </p>
                    )}
                    {item.message && (
                      <p className="text-sm text-[var(--ink-secondary)] mt-2 bg-[var(--surface-2)] rounded-[var(--radius)] px-3 py-2">
                        {item.message}
                      </p>
                    )}
                    <p className="text-xs text-[var(--muted)] mt-2">
                      Requested {formatDate(item.createdAt)}
                      {item.respondedAt
                        ? ` · Responded ${formatDate(item.respondedAt)}`
                        : ""}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {tab === "incoming" && item.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="success"
                            disabled={actionId === item._id}
                            onClick={() => act(item._id, "approve")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={actionId === item._id}
                            onClick={() => act(item._id, "decline")}
                          >
                            Decline
                          </Button>
                        </>
                      )}
                      {tab === "incoming" && item.status === "approved" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="border-[var(--danger)]/30 text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                          disabled={actionId === item._id}
                          onClick={() => act(item._id, "revoke")}
                        >
                          Revoke access
                        </Button>
                      )}
                      {tab === "outgoing" && item.status === "pending" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={actionId === item._id}
                          onClick={() => act(item._id, "revoke")}
                        >
                          Cancel request
                        </Button>
                      )}
                      {item.peer._id && (
                        <Button
                          size="sm"
                          onClick={() =>
                            openChatUi({
                              peerId: item.peer._id,
                              productId: item.product?._id,
                            })
                          }
                        >
                          In-app chat
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
