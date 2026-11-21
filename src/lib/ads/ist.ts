/** Asia/Kolkata (IST, no DST) — UTC+5:30 */

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

/** Shift a UTC instant into an IST wall-clock Date (getUTC* = IST fields). */
export function toIstParts(date: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
  };
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** IST calendar day YYYY-MM-DD for analytics buckets (D2). */
export function istDay(date: Date = new Date()): string {
  const p = toIstParts(date);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

/**
 * Parse an IST local datetime (from admin inputs) into a UTC Date.
 * Accepts `YYYY-MM-DD` (start of day IST) or `YYYY-MM-DDTHH:mm` / `YYYY-MM-DDTHH:mm:ss`.
 */
export function istLocalToUtc(local: string): Date | null {
  const trimmed = local.trim();
  const m = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = Number(m[4] ?? "0");
  const minute = Number(m[5] ?? "0");
  const second = Number(m[6] ?? "0");
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return null;
  }
  const utcMs =
    Date.UTC(year, month - 1, day, hour, minute, second) - IST_OFFSET_MS;
  const d = new Date(utcMs);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Format a UTC instant for admin display in IST (`YYYY-MM-DDTHH:mm`). */
export function formatIstLocal(date: Date): string {
  const p = toIstParts(date);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}T${pad2(p.hour)}:${pad2(p.minute)}`;
}

/** Inclusive start / exclusive end window check (UTC instants). */
export function isWithinSchedule(
  now: Date,
  startDate: Date,
  endDate: Date,
): boolean {
  const t = now.getTime();
  return t >= startDate.getTime() && t < endDate.getTime();
}
