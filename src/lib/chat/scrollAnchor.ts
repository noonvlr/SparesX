/** Pixel distance from the bottom that still counts as "following" the chat. */
export const NEAR_BOTTOM_PX = 120;

export type ScrollMetrics = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
};

export function isNearBottom(m: ScrollMetrics, threshold = NEAR_BOTTOM_PX): boolean {
  return m.scrollHeight - m.scrollTop - m.clientHeight <= threshold;
}

export type ListEdges = { firstId?: string; lastId?: string; count: number };

export type ScrollPlan = "bottom" | "preserve" | "none";

/**
 * Decide how the thread viewport reacts to a message-list change.
 * - first render / switched thread → jump to newest
 * - older page prepended → keep the same message under the reader's eyes
 * - new message at the end → follow only if it is mine or the reader is
 *   already near the bottom
 * - same messages re-rendered (e.g. a bubble grew a "Not sent" row) → stay
 *   pinned if the reader was at the bottom, otherwise leave the view alone
 */
export function planScroll(
  prev: ListEdges,
  next: ListEdges,
  ctx: { wasNearBottom: boolean; lastIsMine: boolean; threadChanged: boolean },
): ScrollPlan {
  if (ctx.threadChanged || prev.count === 0) return next.count > 0 ? "bottom" : "none";
  const newTail = next.lastId !== prev.lastId;
  const prepended =
    next.count > prev.count && next.firstId !== prev.firstId && !newTail;
  if (prepended) return "preserve";
  if (newTail) return ctx.lastIsMine || ctx.wasNearBottom ? "bottom" : "none";
  return ctx.wasNearBottom ? "bottom" : "none";
}

/** scrollTop that keeps content visually fixed after rows were inserted above. */
export function preservedScrollTop(
  prevScrollTop: number,
  prevScrollHeight: number,
  nextScrollHeight: number,
): number {
  return Math.max(0, prevScrollTop + (nextScrollHeight - prevScrollHeight));
}
