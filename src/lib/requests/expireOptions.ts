export const REQUEST_EXPIRE_DAY_OPTIONS = [15, 30, 45] as const;
export type RequestExpireDays = (typeof REQUEST_EXPIRE_DAY_OPTIONS)[number];
export const DEFAULT_REQUEST_EXPIRE_DAYS: RequestExpireDays = 30;

export function isValidRequestExpireDays(
  value: unknown,
): value is RequestExpireDays {
  return REQUEST_EXPIRE_DAY_OPTIONS.includes(Number(value) as RequestExpireDays);
}

export function normalizeRequestExpireDays(
  value: unknown,
): RequestExpireDays {
  return isValidRequestExpireDays(value)
    ? (Number(value) as RequestExpireDays)
    : DEFAULT_REQUEST_EXPIRE_DAYS;
}

export function requestExpiresAt(
  days: RequestExpireDays,
  from: Date = new Date(),
): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}
