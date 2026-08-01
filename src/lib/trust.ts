/**
 * Shared trust / verification fields exposed publicly for sellers.
 */
export type PublicTrustInfo = {
  phoneVerified?: boolean;
  emailVerified?: boolean;
  /** Admin-granted trusted seller badge */
  isTrusted?: boolean;
};

export const USER_PUBLIC_TRUST_SELECT =
  "phoneVerified emailVerified isTrusted";

export function pickTrustFields(user: any): PublicTrustInfo {
  if (!user || typeof user !== "object") return {};
  return {
    phoneVerified: !!user.phoneVerified,
    emailVerified: !!user.emailVerified,
    isTrusted: !!user.isTrusted,
  };
}
