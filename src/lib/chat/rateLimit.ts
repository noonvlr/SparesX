/**
 * Simple in-memory sliding-window rate limiter.
 * Swap for Redis later without changing call sites.
 */
export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly maxHits: number,
    private readonly windowMs: number,
  ) {}

  /** Returns true if allowed, false if limited. */
  check(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const recent = (this.hits.get(key) || []).filter((t) => t > windowStart);
    if (recent.length >= this.maxHits) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }
}

export const messageRateLimiter = new RateLimiter(30, 60_000);
export const conversationCreateLimiter = new RateLimiter(10, 60_000);
