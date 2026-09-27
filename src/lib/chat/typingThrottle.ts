/**
 * Client typing signal for the REST path. Sends `true` on the first
 * keystroke and then at most once per `heartbeatMs` while typing continues,
 * so the server-side typing lease (TYPING_WINDOW_MS) stays alive without a
 * request per character. After `idleMs` without keystrokes it goes quiet and
 * lets the server lease expire on its own.
 */

import { TYPING_WINDOW_MS } from "@/lib/chat/presenceRules";

export type TypingTimers = {
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
  now: () => number;
};

export type TypingThrottle = {
  keystroke: () => void;
  /**
   * End the typing state. `notify` sends an explicit stop (e.g. closing the
   * window while typing); sending a message clears typing server-side.
   */
  stop: (opts?: { notify?: boolean }) => void;
  isActive: () => boolean;
};

export const TYPING_HEARTBEAT_MS = 3_000;
export const TYPING_IDLE_MS = 2_500;

const defaultTimers: TypingTimers = {
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: (h) => globalThis.clearTimeout(h as ReturnType<typeof setTimeout>),
  now: () => Date.now(),
};

export function createTypingThrottle(params: {
  send: (typing: boolean) => void;
  heartbeatMs?: number;
  idleMs?: number;
  timers?: TypingTimers;
}): TypingThrottle {
  const heartbeatMs = Math.min(
    params.heartbeatMs ?? TYPING_HEARTBEAT_MS,
    TYPING_WINDOW_MS - 500,
  );
  const idleMs = params.idleMs ?? TYPING_IDLE_MS;
  const timers = params.timers ?? defaultTimers;

  let active = false;
  let lastSentAt: number | null = null;
  let idleHandle: unknown = null;

  const clearIdle = () => {
    if (idleHandle !== null) {
      timers.clearTimeout(idleHandle);
      idleHandle = null;
    }
  };

  return {
    keystroke() {
      const now = timers.now();
      if (!active || lastSentAt === null || now - lastSentAt >= heartbeatMs) {
        params.send(true);
        lastSentAt = now;
        active = true;
      }
      clearIdle();
      idleHandle = timers.setTimeout(() => {
        idleHandle = null;
        active = false;
      }, idleMs);
    },
    stop(opts) {
      clearIdle();
      const wasLive =
        lastSentAt !== null &&
        (active || timers.now() - lastSentAt < TYPING_WINDOW_MS);
      active = false;
      if (opts?.notify && wasLive) {
        params.send(false);
        lastSentAt = null;
      }
    },
    isActive: () => active,
  };
}
