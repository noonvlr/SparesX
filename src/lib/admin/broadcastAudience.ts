import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { Product } from "@/lib/models/Product";
import { RequestModel } from "@/lib/models/Request";

export type TriFilter = "any" | "yes" | "no";

export type BroadcastFilters = {
  /** Platform users are `technician`; admins are never eligible. */
  role?: "technician" | "all";
  phoneVerified?: TriFilter;
  emailVerified?: TriFilter;
  /** active = not blocked; blocked = blocked only; all = both */
  accountStatus?: "active" | "blocked" | "all";
  hasProducts?: TriFilter;
  hasApprovedProducts?: TriFilter;
  hasRequests?: TriFilter;
  hasOpenRequests?: TriFilter;
  isTrusted?: TriFilter;
  eliteApproved?: TriFilter;
  city?: string;
  state?: string;
  signedUpFrom?: string;
  signedUpTo?: string;
  /** Inactivity based on User.lastSeen (null/missing counts as inactive). */
  inactiveDays?: number | null;
  excludeUserId?: string;
};

export const BROADCAST_MAX_RECIPIENTS = 300;
export const BROADCAST_MAX_TEXT = 2000;

function triBool(value: TriFilter | undefined): boolean | undefined {
  if (value === "yes") return true;
  if (value === "no") return false;
  return undefined;
}

function pickTri(
  raw: Record<string, unknown>,
  key: string,
  fallback: TriFilter = "any",
): TriFilter {
  const v = String(raw[key] ?? fallback).toLowerCase();
  if (v === "yes" || v === "true" || v === "1") return "yes";
  if (v === "no" || v === "false" || v === "0") return "no";
  return "any";
}

function parseDate(value?: string): Date | undefined {
  if (!value?.trim()) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function normalizeBroadcastFilters(
  raw: Record<string, unknown>,
): BroadcastFilters {
  const roleRaw = String(raw.role ?? "technician").toLowerCase();
  // Never allow targeting admins via role filter.
  const role: "technician" | "all" =
    roleRaw === "all" ? "all" : "technician";

  let accountStatus: "active" | "blocked" | "all" = "active";
  const statusRaw = String(
    raw.accountStatus ?? raw.isBlocked ?? "active",
  ).toLowerCase();
  if (statusRaw === "blocked" || statusRaw === "yes") accountStatus = "blocked";
  else if (statusRaw === "all" || statusRaw === "any") accountStatus = "all";
  else if (statusRaw === "no" || statusRaw === "active") accountStatus = "active";

  // Legacy isBlocked yes/no/any from older clients
  if (raw.accountStatus == null && raw.isBlocked != null) {
    const b = pickTri(raw, "isBlocked", "no");
    if (b === "yes") accountStatus = "blocked";
    else if (b === "any") accountStatus = "all";
    else accountStatus = "active";
  }

  const inactiveRaw = raw.inactiveDays;
  const inactiveDays =
    typeof inactiveRaw === "number"
      ? inactiveRaw
      : typeof inactiveRaw === "string" && inactiveRaw.trim()
        ? Number(inactiveRaw)
        : null;

  return {
    role,
    phoneVerified: pickTri(raw, "phoneVerified"),
    emailVerified: pickTri(raw, "emailVerified"),
    accountStatus,
    hasProducts: pickTri(raw, "hasProducts"),
    hasApprovedProducts: pickTri(raw, "hasApprovedProducts"),
    hasRequests: pickTri(raw, "hasRequests"),
    hasOpenRequests: pickTri(raw, "hasOpenRequests"),
    isTrusted: pickTri(raw, "isTrusted"),
    eliteApproved: pickTri(raw, "eliteApproved"),
    city: typeof raw.city === "string" ? raw.city.trim() : "",
    state: typeof raw.state === "string" ? raw.state.trim() : "",
    signedUpFrom:
      typeof raw.signedUpFrom === "string" ? raw.signedUpFrom : undefined,
    signedUpTo: typeof raw.signedUpTo === "string" ? raw.signedUpTo : undefined,
    inactiveDays:
      inactiveDays != null && Number.isFinite(inactiveDays) && inactiveDays > 0
        ? Math.min(Math.floor(inactiveDays), 3650)
        : null,
    excludeUserId:
      typeof raw.excludeUserId === "string" ? raw.excludeUserId : undefined,
  };
}

export function describeAudience(filters: BroadcastFilters): string {
  const parts: string[] = [];

  if (filters.role === "all") parts.push("all platform users");
  else parts.push("technicians");

  if (filters.accountStatus === "blocked") parts.push("who are blocked");
  else if (filters.accountStatus === "all")
    parts.push("including blocked accounts");
  else parts.push("who are not blocked");

  if (filters.phoneVerified === "yes") parts.push("with verified phone");
  if (filters.phoneVerified === "no") parts.push("with unverified phone");
  if (filters.emailVerified === "yes") parts.push("with verified email");
  if (filters.emailVerified === "no") parts.push("with unverified email");

  if (filters.hasProducts === "yes") parts.push("who uploaded at least one product");
  if (filters.hasProducts === "no") parts.push("with no products");
  if (filters.hasApprovedProducts === "yes")
    parts.push("with live listings");
  if (filters.hasApprovedProducts === "no")
    parts.push("without live listings");
  if (filters.hasRequests === "yes") parts.push("who created spare requests");
  if (filters.hasRequests === "no") parts.push("who never created a spare request");
  if (filters.hasOpenRequests === "yes")
    parts.push("with open spare requests");
  if (filters.hasOpenRequests === "no")
    parts.push("without open spare requests");

  if (filters.isTrusted === "yes") parts.push("trusted sellers");
  if (filters.isTrusted === "no") parts.push("not marked trusted");
  if (filters.eliteApproved === "yes") parts.push("elite-approved");
  if (filters.eliteApproved === "no") parts.push("not elite-approved");

  if (filters.city) parts.push(`in ${filters.city}`);
  if (filters.state) parts.push(`in state ${filters.state}`);

  if (filters.signedUpFrom || filters.signedUpTo) {
    const from = filters.signedUpFrom || "…";
    const to = filters.signedUpTo || "…";
    parts.push(`signed up between ${from} and ${to}`);
  }

  if (filters.inactiveDays) {
    parts.push(`inactive for ${filters.inactiveDays}+ days (by lastSeen)`);
  }

  const sentence = parts.join(", ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}

export function filterChips(filters: BroadcastFilters): string[] {
  const chips: string[] = [];
  chips.push(filters.role === "all" ? "All users" : "Technicians");
  if (filters.accountStatus === "active") chips.push("Active");
  if (filters.accountStatus === "blocked") chips.push("Blocked only");
  if (filters.accountStatus === "all") chips.push("Active + blocked");
  if (filters.phoneVerified === "yes") chips.push("Phone verified");
  if (filters.phoneVerified === "no") chips.push("Phone not verified");
  if (filters.emailVerified === "yes") chips.push("Email verified");
  if (filters.emailVerified === "no") chips.push("Email not verified");
  if (filters.hasProducts === "yes") chips.push("Has products");
  if (filters.hasProducts === "no") chips.push("No products");
  if (filters.hasApprovedProducts === "yes") chips.push("Has live listings");
  if (filters.hasApprovedProducts === "no") chips.push("No live listings");
  if (filters.hasRequests === "yes") chips.push("Has requests");
  if (filters.hasRequests === "no") chips.push("No requests");
  if (filters.hasOpenRequests === "yes") chips.push("Has open requests");
  if (filters.hasOpenRequests === "no") chips.push("No open requests");
  if (filters.isTrusted === "yes") chips.push("Trusted");
  if (filters.isTrusted === "no") chips.push("Not trusted");
  if (filters.eliteApproved === "yes") chips.push("Elite");
  if (filters.eliteApproved === "no") chips.push("Not elite");
  if (filters.city) chips.push(`City: ${filters.city}`);
  if (filters.state) chips.push(`State: ${filters.state}`);
  if (filters.signedUpFrom) chips.push(`From ${filters.signedUpFrom}`);
  if (filters.signedUpTo) chips.push(`To ${filters.signedUpTo}`);
  if (filters.inactiveDays) chips.push(`Inactive ${filters.inactiveDays}+ days`);
  return chips;
}

type LeanUserId = { _id: Types.ObjectId; role?: string; isBlocked?: boolean };

async function applyActivityFilters(
  ids: string[],
  filters: BroadcastFilters,
): Promise<string[]> {
  let next = ids;

  const needProducts =
    filters.hasProducts !== "any" || filters.hasApprovedProducts !== "any";
  if (needProducts && next.length) {
    const oids = next.map((id) => new Types.ObjectId(id));
    const withAny = await Product.distinct("technician", {
      technician: { $in: oids },
    });
    const withApproved = await Product.distinct("technician", {
      technician: { $in: oids },
      status: "approved",
    });
    const anySet = new Set(withAny.map(String));
    const approvedSet = new Set(withApproved.map(String));
    next = next.filter((id) => {
      if (filters.hasProducts === "yes" && !anySet.has(id)) return false;
      if (filters.hasProducts === "no" && anySet.has(id)) return false;
      if (filters.hasApprovedProducts === "yes" && !approvedSet.has(id))
        return false;
      if (filters.hasApprovedProducts === "no" && approvedSet.has(id))
        return false;
      return true;
    });
  }

  if (filters.hasRequests !== "any" && next.length) {
    const oids = next.map((id) => new Types.ObjectId(id));
    const withReq = await RequestModel.distinct("userId", {
      userId: { $in: oids },
    });
    const reqSet = new Set(withReq.map(String));
    next = next.filter((id) =>
      filters.hasRequests === "yes" ? reqSet.has(id) : !reqSet.has(id),
    );
  }

  if (filters.hasOpenRequests !== "any" && next.length) {
    const oids = next.map((id) => new Types.ObjectId(id));
    const withOpen = await RequestModel.distinct("userId", {
      userId: { $in: oids },
      status: "open",
    });
    const openSet = new Set(withOpen.map(String));
    next = next.filter((id) =>
      filters.hasOpenRequests === "yes" ? openSet.has(id) : !openSet.has(id),
    );
  }

  return next;
}

/**
 * Resolve matching audience. Admins are always stripped from eligibility.
 * Does NOT silently truncate — callers must refuse send when overLimit.
 */
export async function resolveBroadcastAudience(
  filters: BroadcastFilters,
): Promise<{
  userIds: string[];
  matchedCount: number;
  eligibleCount: number;
  overLimit: boolean;
  maxRecipients: number;
  exclusions: {
    admins: number;
    blocked: number;
    self: number;
  };
  description: string;
  chips: string[];
}> {
  await connectDB();

  const query: Record<string, unknown> = {};

  // Always query technicians only at DB level when role=technician;
  // when role=all we still load both then strip admins for eligibility.
  if (filters.role === "technician") {
    query.role = "technician";
  }

  const phone = triBool(filters.phoneVerified);
  if (phone !== undefined) query.phoneVerified = phone;

  const email = triBool(filters.emailVerified);
  if (email !== undefined) query.emailVerified = email;

  if (filters.accountStatus === "active") query.isBlocked = false;
  else if (filters.accountStatus === "blocked") query.isBlocked = true;
  // "all" — no isBlocked constraint

  const trusted = triBool(filters.isTrusted);
  if (trusted !== undefined) query.isTrusted = trusted;

  const elite = triBool(filters.eliteApproved);
  if (elite !== undefined) query.eliteApproved = elite;

  if (filters.city) {
    query.city = new RegExp(
      `^${filters.city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      "i",
    );
  }
  if (filters.state) {
    query.state = new RegExp(
      `^${filters.state.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      "i",
    );
  }

  const from = parseDate(filters.signedUpFrom);
  const to = parseDate(filters.signedUpTo);
  if (from || to) {
    const createdAt: Record<string, Date> = {};
    if (from) createdAt.$gte = from;
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      createdAt.$lte = end;
    }
    query.createdAt = createdAt;
  }

  if (filters.inactiveDays) {
    const cutoff = new Date(
      Date.now() - filters.inactiveDays * 24 * 60 * 60 * 1000,
    );
    query.$or = [
      { lastSeen: { $exists: false } },
      { lastSeen: null },
      { lastSeen: { $lt: cutoff } },
    ];
  }

  const users = (await User.find(query)
    .select("_id role isBlocked")
    .lean()) as LeanUserId[];

  let adminExcluded = 0;
  let blockedExcluded = 0;
  let selfExcluded = 0;
  const excludeSelf = filters.excludeUserId;

  let ids = users
    .filter((u) => {
      const id = String(u._id);
      if (u.role === "admin") {
        adminExcluded += 1;
        return false;
      }
      if (excludeSelf && id === excludeSelf) {
        selfExcluded += 1;
        return false;
      }
      // Extra safety: never include blocked unless explicitly requested
      if (filters.accountStatus === "active" && u.isBlocked) {
        blockedExcluded += 1;
        return false;
      }
      return true;
    })
    .map((u) => String(u._id));

  ids = await applyActivityFilters(ids, filters);

  const matchedCount = ids.length;
  const overLimit = matchedCount > BROADCAST_MAX_RECIPIENTS;
  const eligibleCount = overLimit ? 0 : matchedCount;

  return {
    userIds: overLimit ? [] : ids,
    matchedCount,
    eligibleCount,
    overLimit,
    maxRecipients: BROADCAST_MAX_RECIPIENTS,
    exclusions: {
      admins: adminExcluded,
      blocked: blockedExcluded,
      self: selfExcluded,
    },
    description: describeAudience(filters),
    chips: filterChips(filters),
  };
}

export type BroadcastRecipientRow = {
  _id: string;
  name: string;
  email: string;
  role: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  isBlocked: boolean;
  isTrusted: boolean;
  eliteApproved: boolean;
  city: string;
  state: string;
  lastSeen: string | null;
  createdAt: string;
  productCount: number;
  liveListingCount: number;
  requestCount: number;
  openRequestCount: number;
};

export async function listBroadcastRecipients(params: {
  filters: BroadcastFilters;
  page?: number;
  limit?: number;
}): Promise<{
  rows: BroadcastRecipientRow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  audience: Awaited<ReturnType<typeof resolveBroadcastAudience>>;
}> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 25));
  const audience = await resolveBroadcastAudience(params.filters);

  // For preview, show matched users even when over limit (paginate matched set).
  // Re-resolve without overLimit truncation for listing:
  const listingFilters = { ...params.filters };
  const listing = await resolveMatchedIdsForPreview(listingFilters);
  const total = listing.length;
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  const slice = listing.slice((page - 1) * limit, page * limit);
  if (slice.length === 0) {
    return { rows: [], page, limit, total, totalPages, audience };
  }

  const oids = slice.map((id) => new Types.ObjectId(id));
  const users = await User.find({ _id: { $in: oids } })
    .select(
      "name email role phoneVerified emailVerified isBlocked isTrusted eliteApproved city state lastSeen createdAt",
    )
    .lean();

  const productCounts = await Product.aggregate<{
    _id: Types.ObjectId;
    total: number;
    live: number;
  }>([
    { $match: { technician: { $in: oids } } },
    {
      $group: {
        _id: "$technician",
        total: { $sum: 1 },
        live: {
          $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
        },
      },
    },
  ]);
  const requestCounts = await RequestModel.aggregate<{
    _id: Types.ObjectId;
    total: number;
    open: number;
  }>([
    { $match: { userId: { $in: oids } } },
    {
      $group: {
        _id: "$userId",
        total: { $sum: 1 },
        open: {
          $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] },
        },
      },
    },
  ]);

  const pMap = new Map(productCounts.map((p) => [String(p._id), p]));
  const rMap = new Map(requestCounts.map((r) => [String(r._id), r]));
  const uMap = new Map(users.map((u) => [String(u._id), u]));

  const rows: BroadcastRecipientRow[] = slice.map((id) => {
    const u = uMap.get(id);
    const p = pMap.get(id);
    const r = rMap.get(id);
    return {
      _id: id,
      name: u?.name || "—",
      email: u?.email || "—",
      role: String(u?.role || "technician"),
      phoneVerified: Boolean(u?.phoneVerified),
      emailVerified: Boolean(u?.emailVerified),
      isBlocked: Boolean(u?.isBlocked),
      isTrusted: Boolean(u?.isTrusted),
      eliteApproved: Boolean(u?.eliteApproved),
      city: String(u?.city || ""),
      state: String(u?.state || ""),
      lastSeen: u?.lastSeen ? new Date(u.lastSeen).toISOString() : null,
      createdAt: u?.createdAt
        ? new Date(u.createdAt).toISOString()
        : new Date(0).toISOString(),
      productCount: p?.total || 0,
      liveListingCount: p?.live || 0,
      requestCount: r?.total || 0,
      openRequestCount: r?.open || 0,
    };
  });

  return { rows, page, limit, total, totalPages, audience };
}

/** Matched eligible IDs without the send-cap empty truncation (for preview table). */
async function resolveMatchedIdsForPreview(
  filters: BroadcastFilters,
): Promise<string[]> {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (filters.role === "technician") query.role = "technician";

  const phone = triBool(filters.phoneVerified);
  if (phone !== undefined) query.phoneVerified = phone;
  const email = triBool(filters.emailVerified);
  if (email !== undefined) query.emailVerified = email;

  if (filters.accountStatus === "active") query.isBlocked = false;
  else if (filters.accountStatus === "blocked") query.isBlocked = true;

  const trusted = triBool(filters.isTrusted);
  if (trusted !== undefined) query.isTrusted = trusted;
  const elite = triBool(filters.eliteApproved);
  if (elite !== undefined) query.eliteApproved = elite;

  if (filters.city) {
    query.city = new RegExp(
      `^${filters.city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      "i",
    );
  }
  if (filters.state) {
    query.state = new RegExp(
      `^${filters.state.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      "i",
    );
  }

  const from = parseDate(filters.signedUpFrom);
  const to = parseDate(filters.signedUpTo);
  if (from || to) {
    const createdAt: Record<string, Date> = {};
    if (from) createdAt.$gte = from;
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      createdAt.$lte = end;
    }
    query.createdAt = createdAt;
  }

  if (filters.inactiveDays) {
    const cutoff = new Date(
      Date.now() - filters.inactiveDays * 24 * 60 * 60 * 1000,
    );
    query.$or = [
      { lastSeen: { $exists: false } },
      { lastSeen: null },
      { lastSeen: { $lt: cutoff } },
    ];
  }

  const users = (await User.find(query)
    .select("_id role")
    .lean()) as LeanUserId[];
  const excludeSelf = filters.excludeUserId;
  let ids = users
    .filter((u) => {
      if (u.role === "admin") return false;
      if (excludeSelf && String(u._id) === excludeSelf) return false;
      return true;
    })
    .map((u) => String(u._id));

  return applyActivityFilters(ids, filters);
}

export function applyMessageVariables(
  template: string,
  vars: { name?: string },
): string {
  const name = (vars.name || "there").trim() || "there";
  return template.replace(/\{\{\s*name\s*\}\}/gi, name);
}
