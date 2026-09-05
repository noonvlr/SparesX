import type { SiteUpdateKind } from "@/lib/models/SiteUpdate";

export function formatUpdateDate(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function kindLabel(kind: SiteUpdateKind | string): string {
  switch (kind) {
    case "bug_thanks":
      return "Bug fixed";
    case "feature":
      return "Feature";
    case "fix":
      return "Fix";
    case "notice":
    default:
      return "Notice";
  }
}

/** Public one-line display: "05 Sep 2026 · Bug fixed — message…" */
export function formatUpdateLine(update: {
  publishedAt: Date | string;
  kind: SiteUpdateKind | string;
  message: string;
}): string {
  const date = formatUpdateDate(update.publishedAt);
  const label = kindLabel(update.kind);
  return `${date} · ${label} — ${update.message.trim()}`;
}

export const DEFAULT_BUG_THANKS_POINTS = 5;

/** Hard ceiling so a mistype cannot dump absurd points (trust score itself caps at 100). */
export const MAX_BUG_THANKS_POINTS = 100;

/** @deprecated use DEFAULT_BUG_THANKS_POINTS */
export const BUG_THANKS_POINTS = DEFAULT_BUG_THANKS_POINTS;

export function normalizeBugThanksPoints(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return DEFAULT_BUG_THANKS_POINTS;
  return Math.max(0, Math.min(MAX_BUG_THANKS_POINTS, Math.round(n)));
}

export function buildBugThanksMessage(
  name: string,
  subject?: string,
  points: number = DEFAULT_BUG_THANKS_POINTS,
): string {
  const who = name.trim() || "a community member";
  const topic = subject?.trim()
    ? ` for reporting “${subject.trim().slice(0, 80)}”`
    : " for reporting a bug";
  const pts = normalizeBugThanksPoints(points);
  if (pts > 0) {
    return `Thanks ${who}${topic}. Now fixed — +${pts} trust score awarded.`;
  }
  return `Thanks ${who}${topic}. Now fixed.`;
}

export function serializeSiteUpdate(doc: {
  _id?: unknown;
  publishedAt?: Date | string;
  kind?: unknown;
  message?: unknown;
  mentionedName?: unknown;
  mentionedUser?: unknown;
  relatedCase?: unknown;
  isPublished?: unknown;
  rewardPoints?: unknown;
  pointsAwarded?: unknown;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}) {
  const rewardPoints =
    typeof doc.rewardPoints === "number" && Number.isFinite(doc.rewardPoints)
      ? doc.rewardPoints
      : undefined;
  return {
    _id: String(doc._id),
    publishedAt:
      doc.publishedAt instanceof Date
        ? doc.publishedAt.toISOString()
        : String(doc.publishedAt || ""),
    kind: doc.kind,
    message: doc.message,
    mentionedName: doc.mentionedName || undefined,
    mentionedUserId: doc.mentionedUser ? String(doc.mentionedUser) : undefined,
    relatedCaseId: doc.relatedCase ? String(doc.relatedCase) : undefined,
    rewardPoints,
    pointsAwarded: doc.pointsAwarded === true,
    isPublished: doc.isPublished !== false,
    line: formatUpdateLine({
      publishedAt: doc.publishedAt || new Date(),
      kind: String(doc.kind || "notice"),
      message: String(doc.message || ""),
    }),
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : undefined,
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : undefined,
  };
}
