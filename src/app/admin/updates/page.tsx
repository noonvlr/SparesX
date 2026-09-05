"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminPage } from "@/components/layout";
import { Card, PageHeader, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { authFetch } from "@/lib/auth/clientAuth";
import { buildBugThanksMessage } from "@/lib/updates/format";

type UpdateRow = {
  _id: string;
  publishedAt: string;
  kind: string;
  message: string;
  mentionedName?: string;
  isPublished: boolean;
  line: string;
};

type UserOption = {
  _id: string;
  name?: string;
  email?: string;
  mobile?: string;
  role?: string;
};

function userLabel(u: UserOption): string {
  return u.name?.trim() || u.email || u.mobile || "User";
}

function userSecondary(u: UserOption): string {
  const parts = [u.email, u.mobile, u.role].filter(Boolean);
  return parts.join(" · ");
}

const KIND_OPTIONS = [
  { value: "notice", label: "Notice" },
  { value: "feature", label: "Feature" },
  { value: "fix", label: "Fix" },
  { value: "bug_thanks", label: "Bug thanks" },
];

const DEFAULT_PLACEHOLDERS: Record<string, string> = {
  notice: "Scheduled maintenance this Sunday 2–4 AM IST.",
  feature: "Request browse filters now follow live demand categories.",
  fix: "Fixed model add Forbidden error for sellers.",
  bug_thanks: "Thanks {name} for reporting a bug. Now fixed — +5 trust score awarded.",
};

function isDefaultBugThanks(text: string): boolean {
  const t = text.trim().toLowerCase();
  return (
    !t ||
    (t.startsWith("thanks ") &&
      t.includes("for reporting") &&
      t.includes("now fixed"))
  );
}

export default function AdminUpdatesPage() {
  const [updates, setUpdates] = useState<UpdateRow[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userOpen, setUserOpen] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const userBoxRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [kind, setKind] = useState("notice");
  const [body, setBody] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [flash, setFlash] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authFetch("/api/admin/updates?limit=50");
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load updates");
        return;
      }
      setUpdates(data.updates || []);
    } catch {
      setError("Failed to load updates");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async (q: string) => {
    const query = q.trim();
    if (!query) {
      setUsers([]);
      setUsersLoading(false);
      return;
    }
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({ limit: "12", q: query });
      const res = await authFetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
        setHighlightIdx(0);
      }
    } catch {
      // keep previous list
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (selectedUser && userSearch === userLabel(selectedUser)) {
      setUsers([]);
      return;
    }
    const timer = setTimeout(() => void loadUsers(userSearch), 220);
    return () => clearTimeout(timer);
  }, [userSearch, selectedUser, loadUsers]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!userBoxRef.current?.contains(e.target as Node)) {
        setUserOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function applyBugThanksTemplate(name?: string) {
    setBody(buildBugThanksMessage(name || "a community member"));
  }

  function onKindChange(next: string) {
    setKind(next);
    if (next === "bug_thanks") {
      applyBugThanksTemplate(selectedUser?.name || selectedUser?.email);
      return;
    }
    if (isDefaultBugThanks(body)) {
      setBody("");
    }
  }

  function selectUser(user: UserOption) {
    setSelectedUser(user);
    setUserSearch(userLabel(user));
    setUserOpen(false);
    setUsers([]);
    if (kind === "bug_thanks" && (isDefaultBugThanks(body) || !body.trim())) {
      applyBugThanksTemplate(user.name || user.email);
    }
  }

  function clearSelectedUser() {
    setSelectedUser(null);
    setUserSearch("");
    setUsers([]);
    setUserOpen(false);
  }

  function onUserSearchChange(value: string) {
    setUserSearch(value);
    setUserOpen(true);
    if (selectedUser && value !== userLabel(selectedUser)) {
      setSelectedUser(null);
    }
  }

  async function createUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFlash("");
    setError("");
    try {
      const res = await authFetch("/api/admin/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          message: body,
          publishedAt: publishedAt || undefined,
          mentionedUserId: selectedUser?._id || undefined,
          mentionedName: selectedUser?.name || undefined,
          isPublished: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to publish");
        return;
      }
      setBody("");
      setPublishedAt("");
      setKind("notice");
      clearSelectedUser();
      setFlash("Update published — it will show on user dashboards.");
      await load();
    } catch {
      setError("Failed to publish");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(row: UpdateRow) {
    setError("");
    try {
      const res = await authFetch(`/api/admin/updates/${row._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !row.isPublished }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Update failed");
        return;
      }
      await load();
    } catch {
      setError("Update failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this update permanently?")) return;
    setError("");
    try {
      const res = await authFetch(`/api/admin/updates/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Delete failed");
        return;
      }
      await load();
    } catch {
      setError("Delete failed");
    }
  }

  const previewDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

  return (
    <AdminPage containerSize="md">
      <PageHeader
        title="Site updates"
        description="Dated public lines shown on the user dashboard — feature notes, fixes, and thanks for valid bug reports. Not shown on the homepage."
      />

      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      )}
      {flash && (
        <Alert tone="success" className="mb-4">
          {flash}
        </Alert>
      )}

      <Card padding="md" className="mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--ink)]">Publish update</h2>
        <form onSubmit={createUpdate} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Type" htmlFor="update-kind">
              <Select
                id="update-kind"
                value={kind}
                onChange={(e) => onKindChange(e.target.value)}
              >
                {KIND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Date (optional)"
              htmlFor="update-date"
              hint="Defaults to now"
            >
              <Input
                id="update-date"
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
              />
            </Field>
          </div>

          <Field
            label="Mention user (optional)"
            htmlFor="update-user-search"
            hint={
              kind === "bug_thanks"
                ? "Type a name to find the reporter — they get a private notification when published."
                : "Type a name, email, or mobile to credit someone."
            }
          >
            <div
              ref={userBoxRef}
              className={`relative ${userOpen ? "z-40" : "z-0"}`}
            >
              <div className="relative">
                <Input
                  id="update-user-search"
                  value={userSearch}
                  onChange={(e) => onUserSearchChange(e.target.value)}
                  onFocus={() => setUserOpen(true)}
                  onKeyDown={(e) => {
                    if (!userOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
                      setUserOpen(true);
                    }
                    if (e.key === "Escape") {
                      setUserOpen(false);
                      return;
                    }
                    if (!userOpen || users.length === 0) return;
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setHighlightIdx((i) =>
                        Math.min(i + 1, users.length - 1),
                      );
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setHighlightIdx((i) => Math.max(i - 1, 0));
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      const pick = users[highlightIdx];
                      if (pick) selectUser(pick);
                    }
                  }}
                  placeholder="Start typing a name…"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={userOpen}
                  aria-controls="update-user-listbox"
                  aria-autocomplete="list"
                  className={selectedUser ? "pr-20" : "pr-10"}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
                  {usersLoading && <Spinner size="sm" />}
                  {selectedUser ? (
                    <button
                      type="button"
                      className="pointer-events-auto rounded p-1 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]"
                      aria-label="Clear selected user"
                      onClick={clearSelectedUser}
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  ) : (
                    <span
                      aria-hidden
                      className="flex w-8 items-center justify-center text-[var(--muted)]"
                    >
                      <svg
                        className={`h-4 w-4 transition-transform ${userOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </span>
                  )}
                </div>
              </div>

              {selectedUser && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] px-3 py-1 text-sm font-semibold border border-[var(--brand)]/20">
                  <span>✓ {userLabel(selectedUser)}</span>
                  {selectedUser.email ? (
                    <span className="font-normal text-[var(--muted)] truncate max-w-[14rem]">
                      {selectedUser.email}
                    </span>
                  ) : null}
                </div>
              )}

              {userOpen &&
                (userSearch.trim().length > 0 || usersLoading) &&
                !selectedUser && (
                  <div
                    id="update-user-listbox"
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-72 overflow-y-auto border border-[var(--border-strong)] rounded-[var(--radius)] bg-[var(--surface)] shadow-[var(--shadow-lg)]"
                  >
                    {usersLoading && users.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-[var(--muted)] flex items-center gap-2">
                        <Spinner size="sm" /> Searching…
                      </div>
                    ) : users.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-[var(--muted)] text-center">
                        No users match “{userSearch.trim()}”
                      </div>
                    ) : (
                      users.map((u, idx) => {
                        const secondary = userSecondary(u);
                        return (
                          <button
                            key={u._id}
                            type="button"
                            role="option"
                            aria-selected={idx === highlightIdx}
                            onMouseEnter={() => setHighlightIdx(idx)}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectUser(u);
                            }}
                            className={`w-full px-4 py-3 text-left border-b border-[var(--border)] last:border-b-0 transition ${
                              idx === highlightIdx
                                ? "bg-[var(--brand-soft)]"
                                : "hover:bg-[var(--brand-soft)]"
                            }`}
                          >
                            <span className="block font-medium text-[var(--ink-secondary)]">
                              {userLabel(u)}
                            </span>
                            {secondary ? (
                              <span className="block text-xs text-[var(--muted)] mt-0.5 truncate">
                                {secondary}
                              </span>
                            ) : null}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
            </div>
          </Field>

          <Field
            label="Message"
            htmlFor="update-body"
            hint="Shown as: date · type — your message"
          >
            <Textarea
              id="update-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={DEFAULT_PLACEHOLDERS[kind] || DEFAULT_PLACEHOLDERS.notice}
              required
              maxLength={400}
            />
          </Field>
          {kind === "bug_thanks" && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => applyBugThanksTemplate(selectedUser?.name)}
            >
              Use default bug-thanks message
            </Button>
          )}
          {body.trim() ? (
            <p className="text-sm text-[var(--muted)] rounded-[var(--radius)] bg-[var(--surface-2)] px-3 py-2 border border-[var(--border)]">
              Preview:{" "}
              <span className="text-[var(--ink)]">
                {previewDate +
                  " · " +
                  (KIND_OPTIONS.find((o) => o.value === kind)?.label ||
                    "Notice") +
                  " — " +
                  body.trim()}
              </span>
            </p>
          ) : null}
          <Button type="submit" loading={saving} disabled={!body.trim()}>
            Publish
          </Button>
        </form>
      </Card>

      <Card padding="md" className="space-y-3">
        <h2 className="text-lg font-semibold text-[var(--ink)]">All updates</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[var(--muted)] py-6">
            <Spinner size="sm" /> Loading…
          </div>
        ) : updates.length === 0 ? (
          <p className="text-sm text-[var(--muted)] py-4">No updates yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {updates.map((row) => (
              <li
                key={row._id}
                className="py-3 flex flex-col sm:flex-row sm:items-start gap-3 justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge tone={row.isPublished ? "success" : "neutral"}>
                      {row.isPublished ? "Live" : "Hidden"}
                    </Badge>
                    <span className="text-xs text-[var(--muted)] uppercase tracking-wide">
                      {row.kind.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--ink)] leading-relaxed">
                    {row.line}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => void togglePublished(row)}
                  >
                    {row.isPublished ? "Hide" : "Publish"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void remove(row._id)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AdminPage>
  );
}
