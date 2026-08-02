"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Participant = {
  _id: string;
  name?: string;
  email?: string;
  profilePicture?: string;
  role?: string;
  lastSeen?: string;
  isBlocked?: boolean;
  online?: boolean;
};

type AdminConversation = {
  _id: string;
  participants: Participant[];
  productId?: {
    _id: string;
    name?: string;
    images?: string[];
    price?: number;
    brand?: string;
    status?: string;
  };
  lastMessage?: string;
  lastMessageTime?: string;
  messageCount?: number;
  updatedAt?: string;
};

type AdminMessage = {
  _id: string;
  senderId: string;
  receiverId: string;
  type: "text" | "image";
  text?: string;
  mediaUrl?: string;
  createdAt: string;
  delivered?: boolean;
  read?: boolean;
};

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function nameOf(p?: Participant) {
  return p?.name || p?.email || "Unknown user";
}

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [stats, setStats] = useState({ conversationCount: 0, messageCount: 0 });
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [selected, setSelected] = useState<AdminConversation | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadList = useCallback(async (query = search) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "40" });
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/admin/chat/conversations?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load chats");
        return;
      }
      setConversations(data.conversations || []);
      setStats(data.stats || { conversationCount: 0, messageCount: 0 });
      setError("");
    } catch {
      setError("Failed to load chats");
    } finally {
      setLoading(false);
    }
  }, [search]);

  const openConversation = useCallback(async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/chat/conversations/${id}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to open conversation");
        return;
      }
      setSelected(data.conversation);
      setMessages(data.messages || []);
    } catch {
      setError("Failed to open conversation");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  async function deleteMessage(messageId: string) {
    if (
      !confirm(
        "Permanently delete this message? This cannot be undone and is for moderation only.",
      )
    ) {
      return;
    }
    setDeletingId(messageId);
    try {
      const res = await fetch(`/api/admin/chat/messages/${messageId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Delete failed");
        return;
      }
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      if (selectedId) void openConversation(selectedId);
      void loadList();
    } catch {
      alert("Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  const participantMap = useMemo(() => {
    const map = new Map<string, Participant>();
    for (const p of selected?.participants || []) {
      map.set(String(p._id), p);
    }
    return map;
  }, [selected]);

  return (
    <main className="chat-ui max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chat disputes</h1>
          <p className="text-gray-600 text-sm mt-1">
            Read-only access to user chats for dispute review. Delete only when
            content violates policy.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-full bg-[var(--brand-soft)] text-[var(--brand-hover)] border border-[var(--brand-muted)] font-semibold">
            {stats.conversationCount} conversations
          </span>
          <span className="px-3 py-1.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200 font-semibold">
            {stats.messageCount} messages
          </span>
        </div>
      </div>

      <form
        className="flex gap-2 mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(q);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, email, user id, or conversation id"
          className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold hover:bg-[var(--brand-hover)]"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setSearch("");
            }}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600"
          >
            Clear
          </button>
        )}
      </form>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-white rounded-[var(--radius-lg)] border border-[var(--border)] shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading chats…</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No conversations found.</div>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-[75vh] overflow-y-auto">
              {conversations.map((c) => {
                const [a, b] = c.participants || [];
                const active = selectedId === c._id;
                return (
                  <li key={c._id}>
                    <button
                      type="button"
                      onClick={() => void openConversation(c._id)}
                      className={`w-full text-left p-4 transition ${
                        active ? "bg-[var(--brand-soft)]" : "hover:bg-gray-50"
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {nameOf(a)} ↔ {nameOf(b)}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {c.lastMessage || "No messages yet"}
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-2 text-[11px] text-gray-400">
                        <span>
                          {c.messageCount || 0} msgs
                          {c.productId && typeof c.productId === "object"
                            ? ` · ${c.productId.name || "Product"}`
                            : ""}
                        </span>
                        <span>
                          {c.lastMessageTime
                            ? new Date(c.lastMessageTime).toLocaleString("en-IN")
                            : ""}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="lg:col-span-3 bg-white rounded-[var(--radius-lg)] border border-[var(--border)] shadow-sm min-h-[420px] flex flex-col overflow-hidden">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-500 p-8">
              Select a conversation to review the full thread.
            </div>
          ) : detailLoading ? (
            <div className="p-6 text-sm text-gray-500">Loading thread…</div>
          ) : !selected ? (
            <div className="p-6 text-sm text-gray-500">Conversation not found.</div>
          ) : (
            <>
              <div className="border-b border-gray-100 p-4 bg-slate-50">
                <div className="flex flex-wrap gap-3">
                  {selected.participants?.map((p) => (
                    <div
                      key={p._id}
                      className="flex items-center gap-2 rounded-xl bg-white border border-gray-100 px-3 py-2"
                    >
                      {p.profilePicture ? (
                        <img
                          src={p.profilePicture}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[var(--brand)] text-white flex items-center justify-center text-xs font-bold">
                          {(p.name || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {nameOf(p)}
                          {p.isBlocked ? (
                            <span className="ml-1 text-[10px] text-rose-600">
                              blocked
                            </span>
                          ) : null}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {p.email} · {p.role || "user"} ·{" "}
                          {p.online ? "Online" : "Offline"}
                        </p>
                        <Link
                          href={`/admin/users`}
                          className="text-[11px] text-[var(--brand)] hover:underline"
                        >
                          Manage in Users
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                {selected.productId && typeof selected.productId === "object" && (
                  <div className="mt-3 text-xs text-gray-600">
                    Product context:{" "}
                    <span className="font-semibold text-gray-900">
                      {selected.productId.name}
                    </span>
                    {selected.productId.brand
                      ? ` · ${selected.productId.brand}`
                      : ""}
                    {typeof selected.productId.price === "number"
                      ? ` · ₹${selected.productId.price}`
                      : ""}
                    {" · "}
                    <Link
                      href={`/product/${selected.productId._id}`}
                      className="text-[var(--brand)] hover:underline"
                    >
                      Open listing
                    </Link>
                  </div>
                )}
                <p className="mt-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 inline-block">
                  Admin audit view — use only for disputes / policy review
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[#efeae2] max-h-[62vh]">
                {messages.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No messages in this conversation.
                  </p>
                ) : (
                  messages.map((m, idx) => {
                    const sender = participantMap.get(String(m.senderId));
                    const participants = selected.participants || [];
                    const isFirst =
                      String(m.senderId) === String(participants[0]?._id);
                    const prev = messages[idx - 1];
                    const showName =
                      !prev || String(prev.senderId) !== String(m.senderId);
                    return (
                      <div
                        key={m._id}
                        className={`flex ${isFirst ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[88%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-sm border ${
                            isFirst
                              ? "bg-white border-gray-100 rounded-bl-md"
                              : "bg-[var(--brand)] text-white border-[var(--brand)] rounded-br-md"
                          }`}
                        >
                          {showName && (
                            <div
                              className={`flex items-center justify-between gap-3 mb-1 ${
                                isFirst ? "text-[var(--brand-hover)]" : "text-[var(--brand-muted)]"
                              }`}
                            >
                              <p className="text-xs font-semibold truncate">
                                {nameOf(sender)}
                              </p>
                              <button
                                type="button"
                                disabled={deletingId === m._id}
                                onClick={() => void deleteMessage(m._id)}
                                className={`text-[11px] shrink-0 disabled:opacity-50 ${
                                  isFirst
                                    ? "text-rose-600 hover:underline"
                                    : "text-white/80 hover:underline"
                                }`}
                              >
                                {deletingId === m._id ? "Deleting…" : "Delete"}
                              </button>
                            </div>
                          )}
                          {m.type === "image" && m.mediaUrl ? (
                            <a
                              href={m.mediaUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block"
                            >
                              <img
                                src={m.mediaUrl}
                                alt="Chat attachment"
                                className="max-h-64 rounded-xl border border-black/5 object-contain bg-white/80"
                              />
                            </a>
                          ) : (
                            <p
                              className={`chat-bubble-text whitespace-pre-wrap break-words ${
                                isFirst ? "text-gray-900" : "text-white"
                              }`}
                            >
                              {m.text || ""}
                            </p>
                          )}
                          <p
                            className={`text-[10px] mt-1.5 text-right ${
                              isFirst ? "text-gray-400" : "text-white/70"
                            }`}
                          >
                            {new Date(m.createdAt).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {m.read ? " · Read" : m.delivered ? " · Delivered" : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
