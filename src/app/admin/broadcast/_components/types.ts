export type Tri = "any" | "yes" | "no";

export type BroadcastFilterState = {
  role: "technician" | "all";
  accountStatus: "active" | "blocked" | "all";
  phoneVerified: Tri;
  emailVerified: Tri;
  hasProducts: Tri;
  hasApprovedProducts: Tri;
  hasRequests: Tri;
  hasOpenRequests: Tri;
  isTrusted: Tri;
  eliteApproved: Tri;
  city: string;
  state: string;
  signedUpFrom: string;
  signedUpTo: string;
  inactivePreset: string;
  inactiveCustom: string;
};

export const DEFAULT_FILTERS: BroadcastFilterState = {
  role: "technician",
  accountStatus: "active",
  phoneVerified: "any",
  emailVerified: "any",
  hasProducts: "any",
  hasApprovedProducts: "any",
  hasRequests: "any",
  hasOpenRequests: "any",
  isTrusted: "any",
  eliteApproved: "any",
  city: "",
  state: "",
  signedUpFrom: "",
  signedUpTo: "",
  inactivePreset: "",
  inactiveCustom: "",
};

export function filtersToQuery(
  filters: BroadcastFilterState,
): Record<string, string> {
  const inactiveDays =
    filters.inactivePreset === "custom"
      ? filters.inactiveCustom
      : filters.inactivePreset;

  return {
    role: filters.role,
    accountStatus: filters.accountStatus,
    phoneVerified: filters.phoneVerified,
    emailVerified: filters.emailVerified,
    hasProducts: filters.hasProducts,
    hasApprovedProducts: filters.hasApprovedProducts,
    hasRequests: filters.hasRequests,
    hasOpenRequests: filters.hasOpenRequests,
    isTrusted: filters.isTrusted,
    eliteApproved: filters.eliteApproved,
    city: filters.city,
    state: filters.state,
    signedUpFrom: filters.signedUpFrom,
    signedUpTo: filters.signedUpTo,
    ...(inactiveDays ? { inactiveDays } : {}),
  };
}

export function filtersToApiBody(filters: BroadcastFilterState) {
  const q = filtersToQuery(filters);
  return {
    ...q,
    inactiveDays: q.inactiveDays ? Number(q.inactiveDays) : null,
  };
}

export type AudiencePreview = {
  matched: number;
  eligible: number;
  overLimit: boolean;
  maxRecipients: number;
  canSend: boolean;
  exclusions: { admins: number; blocked: number; self: number };
  description: string;
  chips: string[];
  sampleName: string | null;
};
