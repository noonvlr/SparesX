export const SUPPORT_TYPES = [
  "bug",
  "feature",
  "change_request",
  "issue",
  "abuse",
  "account",
  "buying",
  "selling",
  "payment",
  "messaging",
  "technical",
  "safety",
  "other",
] as const;

export type SupportType = (typeof SUPPORT_TYPES)[number];

export const SUPPORT_STATUSES = [
  "open",
  "in_progress",
  "waiting_user",
  "resolved",
  "closed",
] as const;

export type SupportStatus = (typeof SUPPORT_STATUSES)[number];

export const SUPPORT_PRIORITIES = ["low", "normal", "high"] as const;
export type SupportPriority = (typeof SUPPORT_PRIORITIES)[number];

export const SUPPORT_TARGET_TYPES = [
  "none",
  "product",
  "user",
  "message",
] as const;
export type SupportTargetType = (typeof SUPPORT_TARGET_TYPES)[number];

export const GENERAL_SUPPORT_TYPES: { value: SupportType; label: string }[] = [
  { value: "account", label: "Account problem" },
  { value: "buying", label: "Buying problem" },
  { value: "selling", label: "Selling problem" },
  { value: "payment", label: "Payment problem" },
  { value: "messaging", label: "Messaging problem" },
  { value: "technical", label: "Technical / website issue" },
  { value: "safety", label: "Safety / reporting" },
  { value: "bug", label: "Bug / error" },
  { value: "issue", label: "Issue / problem" },
  { value: "feature", label: "Feature idea" },
  { value: "change_request", label: "Change request" },
  { value: "other", label: "Other" },
];

export const PRODUCT_REPORT_REASONS = [
  { value: "counterfeit", label: "Counterfeit / fake product" },
  { value: "incorrect_info", label: "Incorrect product information" },
  { value: "wrong_images", label: "Wrong images" },
  { value: "wrong_price", label: "Wrong price" },
  { value: "misleading", label: "Misleading listing" },
  { value: "prohibited", label: "Prohibited item" },
  { value: "duplicate", label: "Duplicate listing" },
  { value: "scam_suspicious", label: "Scam / suspicious seller" },
  { value: "harassment", label: "Harassment" },
  { value: "other", label: "Other" },
] as const;

export const USER_REPORT_REASONS = [
  { value: "scam_suspicious", label: "Scam / suspicious behaviour" },
  { value: "harassment", label: "Harassment or threats" },
  { value: "impersonation", label: "Impersonation / fake account" },
  { value: "spam", label: "Spam" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Other" },
] as const;

export const MESSAGE_REPORT_REASONS = [
  { value: "harassment", label: "Harassment or threats" },
  { value: "scam_suspicious", label: "Scam / fraud attempt" },
  { value: "spam", label: "Spam" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Other" },
] as const;

export type ReportReasonValue =
  | (typeof PRODUCT_REPORT_REASONS)[number]["value"]
  | (typeof USER_REPORT_REASONS)[number]["value"]
  | (typeof MESSAGE_REPORT_REASONS)[number]["value"];

export const HIGH_PRIORITY_REASONS = new Set([
  "scam_suspicious",
  "harassment",
  "prohibited",
  "counterfeit",
]);

export const DESCRIPTION_REQUIRED_REASONS = new Set(["other"]);

export const SUPPORT_TYPE_SET = new Set<string>(SUPPORT_TYPES);
export const SUPPORT_STATUS_SET = new Set<string>(SUPPORT_STATUSES);
export const SUPPORT_PRIORITY_SET = new Set<string>(SUPPORT_PRIORITIES);
export const SUPPORT_TARGET_SET = new Set<string>(SUPPORT_TARGET_TYPES);

export const PRODUCT_REASON_SET = new Set(
  PRODUCT_REPORT_REASONS.map((r) => r.value),
);
export const USER_REASON_SET = new Set(USER_REPORT_REASONS.map((r) => r.value));
export const MESSAGE_REASON_SET = new Set(
  MESSAGE_REPORT_REASONS.map((r) => r.value),
);

export function reasonsForTarget(targetType: SupportTargetType) {
  if (targetType === "product") return PRODUCT_REPORT_REASONS;
  if (targetType === "user") return USER_REPORT_REASONS;
  if (targetType === "message") return MESSAGE_REPORT_REASONS;
  return [];
}

export function isValidReason(
  targetType: SupportTargetType,
  reason: string | undefined,
): boolean {
  if (!reason) return targetType === "none";
  if (targetType === "product") return PRODUCT_REASON_SET.has(reason as never);
  if (targetType === "user") return USER_REASON_SET.has(reason as never);
  if (targetType === "message") return MESSAGE_REASON_SET.has(reason as never);
  return false;
}

export function labelForType(type: string): string {
  return (
    GENERAL_SUPPORT_TYPES.find((t) => t.value === type)?.label ||
    type.replace(/_/g, " ")
  );
}

export function labelForReason(
  targetType: SupportTargetType,
  reason?: string | null,
): string {
  if (!reason) return "";
  const list = reasonsForTarget(targetType);
  return list.find((r) => r.value === reason)?.label || reason.replace(/_/g, " ");
}

export function caseKindLabel(params: {
  type: string;
  targetType?: string | null;
}): string {
  if (params.targetType === "product") return "Product report";
  if (params.targetType === "user") return "User report";
  if (params.targetType === "message") return "Message report";
  if (params.type === "abuse") return "Abuse report";
  return labelForType(params.type);
}

export function statusLabel(status: string): string {
  if (status === "in_progress") return "Under review";
  if (status === "waiting_user") return "Waiting for user";
  return status.replace(/_/g, " ");
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
