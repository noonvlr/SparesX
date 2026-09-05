"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPage } from "@/components/layout";
import { Card, Badge, PageHeader, Avatar } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { authFetch } from "@/lib/auth/clientAuth";

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

const PAGE_SIZE = 30;

function nameOf(p?: Participant) {
  return p?.name || p?.email || "Unknown user";
}

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [stats, setStats] = useState({ conversationCount: 0, messageCount: 0 });
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [selected, setSelected] = useState<AdminConversation | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadList = useCallback(
    async (opts: { query?: string; pageNum?: number; append?: boolean } = {}) => {
      const query = opts.query ?? search;
      const pageNum = opts.pageNum ?? 1;
      const append = opts.append ?? false;

      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          page: String(pageNum),
        });
        if (query.trim()) params.set("q", query.trim());
        const res = await authFetch(
          `/api/admin/chat/conversations?${params}`,
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Failed to load chats");
          return;
        }
        const next = (data.conversations || []) as AdminConversation[];
        setConversations((prev) => (append ? [...prev, ...next] : next));
        setStats(data.stats || { conversationCount: 0, messageCount: 0 });
        setPage(data.page || pageNum);
        setPages(data.pages || 1);
        setError("");
      } catch {
        setError("Failed to load chats");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search],
  );

  const openConversation = useCallback(async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const res = await authFetch(`/api/admin/chat/conversations/${id}`);
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
    setPage(1);
    void loadList({ query: search, pageNum: 1, append: false });
  }, [search, loadList]);

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
      const res = await authFetch(`/api/admin/chat/messages/${messageId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Delete failed");
        return;
      }
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      if (selectedId) void openConversation(selectedId);
      void loadList({ pageNum: 1, append: false });
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
    <AdminPage>
      <PageHeader
        title="Chat disputes"
        description="Read-only access to user chats for dispute review. Delete only when content violates policy."
        actions={
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              href="/admin/disputes"
              className="text-sm font-semibold text-[var(--brand)] hover:underline"
            >
              Dispute SOP
            </Link>
            <Badge tone="brand">
              {stats.conversationCount} conversations
            </Badge>
            <Badge tone="neutral">{stats.messageCount} messages</Badge>
          </div>
        }
      />

      <form
        className="flex gap-2 mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(q);
        }}
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, email, user id, or conversation id"
          className="flex-1"
          size="sm"
        />
        <Button type="submit" size="sm">
          Search
        </Button>
        {search && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setQ("");
              setSearch("");
            }}
          >
            Clear
          </Button>
        )}
      </form>

      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card padding="none" className="lg:col-span-2 overflow-hidden">
          {loading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-[var(--muted)]">
              <Spinner size="sm" /> Loading chats…
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-sm text-[var(--muted)]">No conversations found.</div>
          ) : (
            <div className="max-h-[75vh] overflow-y-auto">
              <ul className="divide-y divide-[var(--divider)]">
                {conversations.map((c) => {
                  const [a, b] = c.participants || [];
                  const active = selectedId === c._id;
                  return (
                    <li key={c._id}>
                      <button
                        type="button"
                        onClick={() => void openConversation(c._id)}
                        className={`w-full text-left p-4 transition ${
                          active
                            ? "bg-[var(--brand-soft)]"
                            : "hover:bg-[var(--surface-hover)]"
                        }`}
                      >
                        <p className="text-sm font-semibold text-[var(--ink)] truncate">
                          {nameOf(a)} ↔ {nameOf(b)}
                        </p>
                        <p className="text-xs text-[var(--muted)] truncate mt-0.5">
                          {c.lastMessage || "No messages yet"}
                        </p>
                        <div className="flex items-center justify-between gap-2 mt-2 text-[11px] text-[var(--muted)]">
                          <span>
                            {c.messageCount || 0} msgs
                            {c.productId && typeof c.productId === "object"
                              ? ` · ${c.productId.name || "Product"}`
                              : ""}
                          </span>
                          <span>
                            {c.lastMessageTime
                              ? new Date(c.lastMessageTime).toLocaleString(
                                  "en-IN",
                                )
                              : ""}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {page < pages ? (
                <div className="p-3 border-t border-[var(--divider)]">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={loadingMore}
                    onClick={() =>
                      void loadList({
                        pageNum: page + 1,
                        append: true,
                      })
                    }
                  >
                    {loadingMore ? "Loading…" : "Load more"}
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </Card>

        <Card padding="none" className="lg:col-span-3 min-h-[420px] flex flex-col overflow-hidden">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-sm text-[var(--muted)] p-8">
              Select a conversation to review the full thread.
            </div>
          ) : detailLoading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-[var(--muted)]">
              <Spinner size="sm" /> Loading thread…
            </div>
          ) : !selected ? (
            <div className="p-6 text-sm text-[var(--muted)]">Conversation not found.</div>
          ) : (
            <>
              <div className="border-b border-[var(--divider)] p-4 bg-[var(--surface-2)]">
                <div className="flex flex-wrap gap-3">
                  {selected.participants?.map((p) => (
                    <div
                      key={p._id}
                      className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--surface)] border border-[var(--border)] px-3 py-2"
                    >
                      <Avatar src={p.profilePicture} name={p.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--ink)] truncate">
                          {nameOf(p)}
                          {p.isBlocked ? (
                            <span className="ml-1 text-[10px] text-[var(--danger)]">
                              blocked
                            </span>
                          ) : null}
                        </p>
                        <p className="text-[11px] text-[var(--muted)] truncate">
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
                  <div className="mt-3 text-xs text-[var(--ink-secondary)]">
                    Product context:{" "}
                    <span className="font-semibold text-[var(--ink)]">
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
                <Alert tone="warning" className="mt-2 inline-block text-[11px] py-1 px-2">
                  Admin audit view — use only for disputes / policy review
                </Alert>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[var(--surface-2)] max-h-[62vh]">
                {messages.length === 0 ? (
                  <p className="text-sm text-[var(--muted)] text-center py-8">
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
                          className={`max-w-[88%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-[var(--shadow-sm)] border ${
                            isFirst
                              ? "bg-[var(--chat-bubble-incoming)] text-[var(--ink)] border-[var(--chat-bubble-incoming-border)] rounded-bl-md"
                              : "bg-[var(--chat-bubble-outgoing)] text-[var(--chat-bubble-outgoing-fg)] border-transparent rounded-br-md"
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
                                    ? "text-[var(--danger)] hover:underline"
                                    : "text-[var(--chat-bubble-outgoing-fg)]/80 hover:underline"
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
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={m.mediaUrl}
                                alt="Chat attachment"
                                className="max-h-64 rounded-xl border border-[var(--border)] object-contain bg-[var(--surface)]/80"
                              />
                            </a>
                          ) : (
                            <p
                              className={`chat-bubble-text whitespace-pre-wrap break-words ${
                                isFirst
                                  ? "text-[var(--ink)]"
                                  : "text-[var(--chat-bubble-outgoing-fg)]"
                              }`}
                            >
                              {m.text || ""}
                            </p>
                          )}
                          <p
                            className={`text-[10px] mt-1.5 text-right ${
                              isFirst
                                ? "text-[var(--chat-timestamp)]"
                                : "text-[var(--chat-timestamp-outgoing)]"
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
        </Card>
      </div>
    </AdminPage>
  );
}
