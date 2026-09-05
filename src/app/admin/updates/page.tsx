"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  role?: string;
};

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
  bug_thanks: "Thanks {name} for reporting a bug. Now fixed.",
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [kind, setKind] = useState("notice");
  const [body, setBody] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [mentionedUserId, setMentionedUserId] = useState("");
  const [flash, setFlash] = useState("");

  const selectedUser = useMemo(
    () => users.find((u) => u._id === mentionedUserId),
    [users, mentionedUserId],
  );

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
    try {
      const params = new URLSearchParams({ limit: "40" });
      if (q.trim()) params.set("q", q.trim());
      const res = await authFetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } catch {
      // keep previous list
    }
  }, []);

  useEffect(() => {
    void load();
    void loadUsers("");
  }, [load, loadUsers]);

  useEffect(() => {
    const timer = setTimeout(() => void loadUsers(userSearch), 250);
    return () => clearTimeout(timer);
  }, [userSearch, loadUsers]);

  function applyBugThanksTemplate(name?: string) {
    setBody(buildBugThanksMessage(name || "a community member"));
  }

  function onKindChange(next: string) {
    setKind(next);
    if (next === "bug_thanks") {
      applyBugThanksTemplate(selectedUser?.name);
      return;
    }
    if (isDefaultBugThanks(body)) {
      setBody("");
    }
  }

  function onUserChange(userId: string) {
    setMentionedUserId(userId);
    const user = users.find((u) => u._id === userId);
    if (kind === "bug_thanks" && (isDefaultBugThanks(body) || !body.trim())) {
      applyBugThanksTemplate(user?.name);
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
          mentionedUserId: mentionedUserId || undefined,
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
      setMentionedUserId("");
      setUserSearch("");
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
                ? "Pick the reporter — they get a private notification when published."
                : "Optional credit in the update; used for bug thanks."
            }
          >
            <Input
              id="update-user-search"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by name, email, or mobile"
              className="mb-2"
            />
            <Select
              id="update-user"
              value={mentionedUserId}
              onChange={(e) => onUserChange(e.target.value)}
            >
              <option value="">No user selected</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name || "User"}
                  {u.email ? ` · ${u.email}` : ""}
                  {u.role ? ` (${u.role})` : ""}
                </option>
              ))}
            </Select>
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
