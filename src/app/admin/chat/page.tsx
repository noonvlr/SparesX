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
    <main className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chat disputes</h1>
          <p className="text-gray-600 text-sm mt-1">
            Read-only access to user chats for dispute review. Delete only when
            content violates policy.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-semibold">
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
          className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
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
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
                        active ? "bg-blue-50" : "hover:bg-gray-50"
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

        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm min-h-[420px] flex flex-col overflow-hidden">
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
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
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
                          className="text-[11px] text-blue-600 hover:underline"
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
                      className="text-blue-600 hover:underline"
                    >
                      Open listing
                    </Link>
                  </div>
                )}
                <p className="mt-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 inline-block">
                  Admin audit view — use only for disputes / policy review
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f7f8fa] max-h-[60vh]">
                {messages.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No messages in this conversation.
                  </p>
                ) : (
                  messages.map((m) => {
                    const sender = participantMap.get(String(m.senderId));
                    return (
                      <div
                        key={m._id}
                        className="rounded-2xl bg-white border border-gray-100 p-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-xs font-semibold text-gray-800">
                            {nameOf(sender)}
                            <span className="font-normal text-gray-400">
                              {" "}
                              ·{" "}
                              {new Date(m.createdAt).toLocaleString("en-IN")}
                            </span>
                          </p>
                          <button
                            type="button"
                            disabled={deletingId === m._id}
                            onClick={() => void deleteMessage(m._id)}
                            className="text-[11px] text-rose-600 hover:underline disabled:opacity-50"
                          >
                            {deletingId === m._id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
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
                              className="max-h-56 rounded-xl border border-gray-100 object-contain bg-gray-50"
                            />
                          </a>
                        ) : (
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            {m.text || ""}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1">
                          {m.delivered ? "Delivered" : "Sent"}
                          {m.read ? " · Read" : ""}
                        </p>
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
