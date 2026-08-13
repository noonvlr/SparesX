import { SupportRequest } from "@/lib/models/SupportRequest";
import { User } from "@/lib/models/User";
import { sanitizeStoredImageUrl } from "@/lib/security/allowedImageUrl";
import { nextCaseNumber } from "@/lib/support/caseNumber";
import {
  DESCRIPTION_REQUIRED_REASONS,
  HIGH_PRIORITY_REASONS,
  SUPPORT_TYPE_SET,
  caseKindLabel,
  isValidReason,
  type SupportTargetType,
  type SupportType,
} from "@/lib/support/constants";
import { notifyAdminsOfNewCase } from "@/lib/support/notifyAdmins";
import {
  resolveSupportContext,
  type ResolvedSupportContext,
} from "@/lib/support/resolveContext";

const MAX_SUBJECT = 140;
const MAX_MESSAGE = 4000;
const MAX_ATTACHMENTS = 4;

export type CreateSupportCaseInput = {
  reporterId: string;
  type?: string;
  reason?: string;
  subject?: string;
  message?: string;
  targetType?: string;
  productId?: string;
  reportedUserId?: string;
  conversationId?: string;
  messageId?: string;
  sourcePage?: string;
  sourcePageType?: string;
  attachments?: unknown;
};

function inferTargetType(input: CreateSupportCaseInput): SupportTargetType {
  if (input.targetType === "product" || input.targetType === "user" || input.targetType === "message") {
    return input.targetType;
  }
  if (input.messageId) return "message";
  if (input.productId && !input.reportedUserId) return "product";
  if (input.reportedUserId && input.productId) return "product";
  if (input.reportedUserId) return "user";
  return "none";
}

function sanitizeAttachments(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const urls: string[] = [];
  for (const item of raw.slice(0, MAX_ATTACHMENTS)) {
    const url = sanitizeStoredImageUrl(item);
    if (url) urls.push(url);
  }
  return urls;
}

function stripText(value: unknown, max: number): string {
  return String(value || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, max);
}

export async function createSupportCase(input: CreateSupportCaseInput): Promise<
  | { ok: true; ticket: InstanceType<typeof SupportRequest>; duplicate?: boolean }
  | { ok: false; status: number; message: string }
> {
  const targetType = inferTargetType(input);
  const isReport = targetType !== "none";
  const ticketType: SupportType = isReport
    ? "abuse"
    : SUPPORT_TYPE_SET.has(String(input.type))
      ? (input.type as SupportType)
      : "issue";

  const description = stripText(input.message, MAX_MESSAGE);

  if (isReport) {
    if (!input.reason) {
      if (!description) {
        return { ok: false, status: 400, message: "Please select a valid reason" };
      }
      input.reason = "other";
    } else if (!isValidReason(targetType, input.reason)) {
      return { ok: false, status: 400, message: "Please select a valid reason" };
    }
  }

  if (isReport && DESCRIPTION_REQUIRED_REASONS.has(String(input.reason)) && !description) {
    return {
      ok: false,
      status: 400,
      message: "Please describe the issue for this reason",
    };
  }
  if (!isReport && !description) {
    return { ok: false, status: 400, message: "Please describe your request" };
  }

  const resolved = await resolveSupportContext({
    reporterId: input.reporterId,
    targetType,
    productId: input.productId,
    reportedUserId: input.reportedUserId,
    conversationId: input.conversationId,
    messageId: input.messageId,
    sourcePage: stripText(input.sourcePage, 500),
    sourcePageType: stripText(input.sourcePageType, 80),
    forAdminSnapshot: true,
  });
  if (!resolved.ok) {
    return { ok: false, status: resolved.status, message: resolved.message };
  }
  const context: ResolvedSupportContext = resolved.context;

  const reporter = await User.findById(input.reporterId).select("name email");
  if (!reporter) {
    return { ok: false, status: 404, message: "User not found" };
  }

  const reason = isReport ? String(input.reason) : undefined;
  const subject = stripText(
    input.subject || context.subjectHint || "Support request",
    MAX_SUBJECT,
  );
  if (!subject) {
    return { ok: false, status: 400, message: "Subject is required" };
  }

  const duplicateQuery: Record<string, unknown> = {
    user: input.reporterId,
    status: { $in: ["open", "in_progress", "waiting_user"] },
    createdAt: { $gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
  };
  if (isReport) {
    duplicateQuery.type = "abuse";
    duplicateQuery.reason = reason;
    duplicateQuery.targetType = targetType;
    if (context.product) duplicateQuery.product = context.product;
    if (context.reportedUser) duplicateQuery.reportedUser = context.reportedUser;
    if (context.messageId) duplicateQuery.messageId = context.messageId;
  } else {
    duplicateQuery.type = ticketType;
    duplicateQuery.subject = subject;
  }

  const existing = await SupportRequest.findOne(duplicateQuery).sort({
    createdAt: -1,
  });
  if (existing) {
    return { ok: true, ticket: existing, duplicate: true };
  }

  const attachments = sanitizeAttachments(input.attachments);
  const priority = reason && HIGH_PRIORITY_REASONS.has(reason) ? "high" : "normal";
  const caseNumber = await nextCaseNumber();
  const now = new Date();

  const ticket = await SupportRequest.create({
    user: input.reporterId,
    name: reporter.name,
    email: reporter.email,
    type: ticketType,
    targetType: context.targetType,
    reason,
    subject,
    message: description || subject,
    status: "open",
    priority,
    caseNumber,
    reportedUser: context.reportedUser,
    product: context.product,
    conversationId: context.conversationId,
    messageId: context.messageId,
    productSnapshot: context.productSnapshot,
    reportedUserSnapshot: context.reportedUserSnapshot,
    messageSnapshot: context.messageSnapshot,
    source: context.source,
    attachments,
    adminUnread: true,
    userUnread: false,
    audit: [
      {
        actorId: input.reporterId,
        actorName: reporter.name,
        action: "case_created",
        createdAt: now,
      },
    ],
  });

  const kindLabel = caseKindLabel({
    type: ticketType,
    targetType: context.targetType,
  });
  void notifyAdminsOfNewCase({
    caseId: String(ticket._id),
    caseNumber,
    kindLabel,
    subject,
  });

  return { ok: true, ticket };
}
