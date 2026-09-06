import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { Product } from "@/lib/models/Product";
import { RequestModel } from "@/lib/models/Request";

export type BroadcastFilters = {
  role?: "all" | "technician" | "admin";
  phoneVerified?: "any" | "yes" | "no";
  emailVerified?: "any" | "yes" | "no";
  isBlocked?: "any" | "yes" | "no";
  hasProducts?: "any" | "yes" | "no";
  hasApprovedProducts?: "any" | "yes" | "no";
  hasRequests?: "any" | "yes" | "no";
  isTrusted?: "any" | "yes" | "no";
  eliteApproved?: "any" | "yes" | "no";
  city?: string;
  signedUpFrom?: string;
  signedUpTo?: string;
  inactiveDays?: number | null;
  excludeUserId?: string;
};

export const BROADCAST_MAX_RECIPIENTS = 300;

function triBool(
  value: "any" | "yes" | "no" | undefined,
): boolean | undefined {
  if (value === "yes") return true;
  if (value === "no") return false;
  return undefined;
}

function parseDate(value?: string): Date | undefined {
  if (!value?.trim()) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function normalizeBroadcastFilters(
  raw: Record<string, unknown>,
): BroadcastFilters {
  const pickTri = (key: string): "any" | "yes" | "no" => {
    const v = String(raw[key] ?? "any").toLowerCase();
    if (v === "yes" || v === "true" || v === "1") return "yes";
    if (v === "no" || v === "false" || v === "0") return "no";
    return "any";
  };
  const roleRaw = String(raw.role ?? "technician").toLowerCase();
  const role =
    roleRaw === "all" || roleRaw === "admin" || roleRaw === "technician"
      ? roleRaw
      : "technician";

  const inactiveRaw = raw.inactiveDays;
  const inactiveDays =
    typeof inactiveRaw === "number"
      ? inactiveRaw
      : typeof inactiveRaw === "string" && inactiveRaw.trim()
        ? Number(inactiveRaw)
        : null;

  return {
    role,
    phoneVerified: pickTri("phoneVerified"),
    emailVerified: pickTri("emailVerified"),
    isBlocked: pickTri("isBlocked"),
    hasProducts: pickTri("hasProducts"),
    hasApprovedProducts: pickTri("hasApprovedProducts"),
    hasRequests: pickTri("hasRequests"),
    isTrusted: pickTri("isTrusted"),
    eliteApproved: pickTri("eliteApproved"),
    city: typeof raw.city === "string" ? raw.city.trim() : "",
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

/**
 * Resolve matching user IDs for admin broadcast (cap applied by caller).
 */
export async function resolveBroadcastAudience(
  filters: BroadcastFilters,
): Promise<{ userIds: string[]; totalMatched: number }> {
  await connectDB();

  const query: Record<string, unknown> = {};
  if (filters.role && filters.role !== "all") {
    query.role = filters.role;
  }

  const phone = triBool(filters.phoneVerified);
  if (phone !== undefined) query.phoneVerified = phone;

  const email = triBool(filters.emailVerified);
  if (email !== undefined) query.emailVerified = email;

  const blocked = triBool(filters.isBlocked);
  if (blocked !== undefined) query.isBlocked = blocked;
  else query.isBlocked = false; // default: skip blocked

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

  if (filters.excludeUserId && Types.ObjectId.isValid(filters.excludeUserId)) {
    query._id = { $ne: new Types.ObjectId(filters.excludeUserId) };
  }

  let users = await User.find(query).select("_id").lean();
  let ids = users.map((u) => String(u._id));

  const needProducts =
    filters.hasProducts !== "any" || filters.hasApprovedProducts !== "any";
  if (needProducts && ids.length) {
    const oids = ids.map((id) => new Types.ObjectId(id));
    const withAny = await Product.distinct("technician", {
      technician: { $in: oids },
    });
    const withApproved = await Product.distinct("technician", {
      technician: { $in: oids },
      status: "approved",
    });
    const anySet = new Set(withAny.map(String));
    const approvedSet = new Set(withApproved.map(String));

    ids = ids.filter((id) => {
      if (filters.hasProducts === "yes" && !anySet.has(id)) return false;
      if (filters.hasProducts === "no" && anySet.has(id)) return false;
      if (filters.hasApprovedProducts === "yes" && !approvedSet.has(id))
        return false;
      if (filters.hasApprovedProducts === "no" && approvedSet.has(id))
        return false;
      return true;
    });
  }

  if (filters.hasRequests !== "any" && ids.length) {
    const oids = ids.map((id) => new Types.ObjectId(id));
    const withReq = await RequestModel.distinct("userId", {
      userId: { $in: oids },
    });
    const reqSet = new Set(withReq.map(String));
    ids = ids.filter((id) =>
      filters.hasRequests === "yes" ? reqSet.has(id) : !reqSet.has(id),
    );
  }

  const totalMatched = ids.length;
  return {
    userIds: ids.slice(0, BROADCAST_MAX_RECIPIENTS),
    totalMatched,
  };
}
