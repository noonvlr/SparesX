import { caseKindLabel, labelForReason, statusLabel } from "@/lib/support/constants";

function idOf(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

function asRecord(ticket: unknown): Record<string, unknown> {
  return (ticket || {}) as Record<string, unknown>;
}

export function serializePublicCase(ticket: unknown) {
  const t = asRecord(ticket);
  const targetType = String(t.targetType || "none");
  return {
    _id: String(t._id),
    caseNumber: t.caseNumber || null,
    type: t.type,
    targetType,
    reason: t.reason || null,
    reasonLabel: labelForReason(targetType as never, String(t.reason || "")),
    kindLabel: caseKindLabel({
      type: String(t.type || ""),
      targetType,
    }),
    subject: t.subject,
    message: t.message,
    status: t.status,
    statusLabel: statusLabel(String(t.status || "open")),
    adminReply: t.adminReply || "",
    userUnread: Boolean(t.userUnread),
    productSnapshot: t.productSnapshot || null,
    reportedUserSnapshot: t.reportedUserSnapshot
      ? {
          userId: (t.reportedUserSnapshot as { userId?: string }).userId,
          name: (t.reportedUserSnapshot as { name?: string }).name,
          profileUrl: (t.reportedUserSnapshot as { profileUrl?: string }).profileUrl,
          city: (t.reportedUserSnapshot as { city?: string }).city,
          state: (t.reportedUserSnapshot as { state?: string }).state,
        }
      : null,
    messageSnapshot: t.messageSnapshot || null,
    attachments: t.attachments || [],
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    resolvedAt: t.resolvedAt || null,
  };
}

export function serializeAdminCase(ticket: unknown) {
  const t = asRecord(ticket);
  const targetType = String(t.targetType || "none");
  const user = t.user as Record<string, unknown> | undefined;
  const reported = t.reportedUser as Record<string, unknown> | undefined;
  const product = t.product as Record<string, unknown> | undefined;
  const assigned = t.assignedTo as Record<string, unknown> | undefined;

  return {
    _id: String(t._id),
    caseNumber: t.caseNumber || null,
    type: t.type,
    targetType,
    reason: t.reason || null,
    reasonLabel: labelForReason(targetType as never, String(t.reason || "")),
    kindLabel: caseKindLabel({
      type: String(t.type || ""),
      targetType,
    }),
    subject: t.subject,
    message: t.message,
    status: t.status,
    statusLabel: statusLabel(String(t.status || "open")),
    priority: t.priority || "normal",
    adminReply: t.adminReply || "",
    complaintUpheld: t.complaintUpheld,
    adminUnread: t.adminUnread !== false,
    adminReadAt: t.adminReadAt || null,
    userUnread: Boolean(t.userUnread),
    reporter: {
      userId: idOf(user) || idOf(t.user),
      name: (user && user.name) || t.name,
      email: (user && user.email) || t.email,
      role: user?.role,
      isBlocked: user?.isBlocked,
      profilePicture: user?.profilePicture,
    },
    reportedUserLive: reported
      ? {
          userId: idOf(reported),
          name: reported.name,
          email: reported.email,
          mobile: reported.mobile,
          isBlocked: reported.isBlocked,
        }
      : null,
    productLive: product
      ? {
          productId: idOf(product),
          name: product.name,
          status: product.status,
          slug: product.slug,
        }
      : null,
    assignedTo: assigned
      ? { userId: idOf(assigned), name: assigned.name, email: assigned.email }
      : t.assignedTo
        ? { userId: idOf(t.assignedTo) }
        : null,
    productSnapshot: t.productSnapshot || null,
    reportedUserSnapshot: t.reportedUserSnapshot || null,
    messageSnapshot: t.messageSnapshot || null,
    source: t.source || null,
    attachments: t.attachments || [],
    adminNotes: t.adminNotes || [],
    audit: t.audit || [],
    conversationId: t.conversationId ? String(t.conversationId) : null,
    messageId: t.messageId ? String(t.messageId) : null,
    productId: idOf(t.product),
    reportedUserId: idOf(t.reportedUser),
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    resolvedAt: t.resolvedAt || null,
    resolvedBy: t.resolvedBy ? String(t.resolvedBy) : null,
  };
}

export function serializeAdminListItem(ticket: unknown) {
  const full = serializeAdminCase(ticket);
  return {
    _id: full._id,
    caseNumber: full.caseNumber,
    type: full.type,
    targetType: full.targetType,
    reason: full.reason,
    reasonLabel: full.reasonLabel,
    kindLabel: full.kindLabel,
    subject: full.subject,
    status: full.status,
    statusLabel: full.statusLabel,
    priority: full.priority,
    adminUnread: full.adminUnread,
    reporter: full.reporter,
    assignedTo: full.assignedTo,
    productSnapshot: full.productSnapshot,
    reportedUserSnapshot: full.reportedUserSnapshot,
    createdAt: full.createdAt,
    updatedAt: full.updatedAt,
  };
}
