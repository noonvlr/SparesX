"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { authFetch, isLoggedInClient } from "@/lib/auth/clientAuth";
import { formatUpdateDate, kindLabel } from "@/lib/updates/format";
import { cn } from "@/lib/ui/cn";

type UpdateRow = {
  _id: string;
  line: string;
  kind: string;
  message: string;
  publishedAt: string;
  mentionedName?: string;
  mentionedUserId?: string;
};

function kindTone(kind: string): string {
  switch (kind) {
    case "bug_thanks":
      return "bg-[var(--success-soft)] text-[var(--success)]";
    case "feature":
      return "bg-[var(--brand-soft)] text-[var(--brand-hover)]";
    case "fix":
      return "bg-[var(--info-soft)] text-[var(--info)]";
    default:
      return "bg-[var(--surface-3)] text-[var(--muted)]";
  }
}

function kindChip(kind: string): string {
  switch (kind) {
    case "bug_thanks":
      return "Thanks";
    case "feature":
      return "Feature";
    case "fix":
      return "Fix";
    default:
      return "Notice";
  }
}

function MessageWithMention({
  message,
  mentionedName,
  mentionedUserId,
}: {
  message: string;
  mentionedName?: string;
  mentionedUserId?: string;
}) {
  const name = mentionedName?.trim();
  if (!name) return <>{message}</>;

  const idx = message.indexOf(name);
  if (idx < 0) return <>{message}</>;

  const before = message.slice(0, idx);
  const after = message.slice(idx + name.length);
  const nameNode = mentionedUserId ? (
    <Link
      href={`/u/${mentionedUserId}`}
      className="font-semibold text-[var(--brand)] underline-offset-2 hover:underline focus-visible:underline"
    >
      {name}
    </Link>
  ) : (
    <span className="font-semibold text-[var(--brand)]">{name}</span>
  );

  return (
    <>
      {before}
      {nameNode}
      {after}
    </>
  );
}

/**
 * Compact dated feed of site updates (features, fixes, bug thanks).
 * Dashboard-only — never mounted on the public homepage.
 */
export default function DashboardUpdates() {
  const [updates, setUpdates] = useState<UpdateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedInClient()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/api/updates?limit=8");
        const data = await res.json();
        if (!cancelled && res.ok) {
          setUpdates(data.updates || []);
        }
      } catch {
        if (!cancelled) setUpdates([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card className="dash-updates p-5 mb-6 md:mb-8">
        <div
          aria-hidden
          className="dash-updates__bar pointer-events-none"
        />
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Spinner size="sm" /> Loading updates…
        </div>
      </Card>
    );
  }

  if (updates.length === 0) return null;

  return (
    <Card className="dash-updates p-5 md:p-6 mb-6 md:mb-8">
      <div aria-hidden className="dash-updates__bar pointer-events-none" />

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="dash-updates__dot flex-shrink-0" aria-hidden />
          <h3 className="text-lg md:text-xl font-semibold text-[var(--ink)] tracking-tight">
            Updates
          </h3>
          <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-hover)] bg-[var(--brand-muted)]/60 px-2 py-0.5 rounded-full">
            What’s new
          </span>
        </div>
        <p className="text-xs text-[var(--muted)] flex-shrink-0">Newest first</p>
      </div>

      <ul className="space-y-2">
        {updates.map((u, index) => {
          const date = formatUpdateDate(u.publishedAt);
          const label = kindLabel(u.kind);
          return (
            <li
              key={u._id}
              className={cn(
                "dash-updates__row rounded-[var(--radius)] border border-transparent px-3 py-2.5",
                "text-sm text-[var(--ink-secondary)] leading-relaxed",
              )}
              style={{ animationDelay: `${Math.min(index, 7) * 55}ms` }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded",
                    kindTone(u.kind),
                  )}
                >
                  {kindChip(u.kind)}
                </span>
                {index === 0 ? (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--brand)]">
                    Latest
                  </span>
                ) : null}
              </div>
              <p>
                {date ? (
                  <span className="text-[var(--muted)]">{date} · </span>
                ) : null}
                <span className="text-[var(--muted)]">{label} — </span>
                <MessageWithMention
                  message={u.message || u.line}
                  mentionedName={u.mentionedName}
                  mentionedUserId={u.mentionedUserId}
                />
              </p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
