"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ToastHost";
import { openChatUi } from "@/components/chat/openChat";

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
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-800 border-amber-200",
    approved: "bg-green-50 text-green-800 border-green-200",
    declined: "bg-red-50 text-red-700 border-red-200",
    expired: "bg-gray-100 text-gray-600 border-gray-200",
    revoked: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${
        styles[status] || styles.expired
      }`}
    >
      {status}
    </span>
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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/40">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            WhatsApp connections
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Approve a request once and that buyer can WhatsApp you for{" "}
            <span className="font-medium text-gray-800">any of your listings</span>
            . In-app chat stays available without approval.
          </p>
        </div>

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
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                tab === key
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white/80 p-10 text-center">
            <p className="text-gray-600 text-sm">
              {tab === "incoming"
                ? "No WhatsApp requests yet."
                : "You haven't sent any WhatsApp requests."}
            </p>
            <Link
              href="/products"
              className="inline-block mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Browse products →
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-bold text-gray-500">
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
                          className="font-semibold text-gray-900 hover:text-blue-700 truncate"
                        >
                          {item.peer.name}
                        </Link>
                      ) : (
                        <span className="font-semibold text-gray-900">
                          {item.peer.name}
                        </span>
                      )}
                      <StatusPill status={item.status} />
                    </div>
                    {item.peer.city && (
                      <p className="text-xs text-gray-500 mt-0.5">{item.peer.city}</p>
                    )}
                    {item.product && (
                      <p className="text-sm text-gray-600 mt-1">
                        About:{" "}
                        <Link
                          href={`/product/${item.product._id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {item.product.name}
                        </Link>
                      </p>
                    )}
                    {item.message && (
                      <p className="text-sm text-gray-700 mt-2 bg-gray-50 rounded-lg px-3 py-2">
                        {item.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Requested {formatDate(item.createdAt)}
                      {item.respondedAt
                        ? ` · Responded ${formatDate(item.respondedAt)}`
                        : ""}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {tab === "incoming" && item.status === "pending" && (
                        <>
                          <button
                            type="button"
                            disabled={actionId === item._id}
                            onClick={() => act(item._id, "approve")}
                            className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={actionId === item._id}
                            onClick={() => act(item._id, "decline")}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </>
                      )}
                      {tab === "incoming" && item.status === "approved" && (
                        <button
                          type="button"
                          disabled={actionId === item._id}
                          onClick={() => act(item._id, "revoke")}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
                        >
                          Revoke access
                        </button>
                      )}
                      {tab === "outgoing" && item.status === "pending" && (
                        <button
                          type="button"
                          disabled={actionId === item._id}
                          onClick={() => act(item._id, "revoke")}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
                        >
                          Cancel request
                        </button>
                      )}
                      {item.peer._id && (
                        <button
                          type="button"
                          onClick={() =>
                            openChatUi({
                              peerId: item.peer._id,
                              productId: item.product?._id,
                            })
                          }
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                        >
                          In-app chat
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
