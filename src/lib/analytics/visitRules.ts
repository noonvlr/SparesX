/** How long the anonymous visitor cookie and stored visit rows are kept. */
export const VISIT_RETENTION_DAYS = 400;

const BOT_UA =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|quora|whatsapp|telegram|headless|lighthouse|pagespeed|pingdom|monitoring/i;

export function utcDay(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Inclusive UTC day keys, oldest first. */
export function recentUtcDays(count: number, now = new Date()): string[] {
  const days: string[] = [];
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() - i);
    days.push(utcDay(d));
  }
  return days;
}

export function isVisitorId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{32}$/.test(value);
}

/** Skip link unfurlers and crawlers so they do not inflate unique visitors. */
export function isLikelyBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return BOT_UA.test(userAgent);
}
