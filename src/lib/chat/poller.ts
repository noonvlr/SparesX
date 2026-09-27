/**
 * Visibility-aware polling loop with idle slow-down and bounded exponential
 * backoff. Framework-free so it can be unit tested with fake timers.
 */

export type PollOutcome = { changed?: boolean } | void;

export type PollerTimers = {
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
  now: () => number;
};

export type PollerStatus = {
  running: boolean;
  hidden: boolean;
  inFlight: boolean;
  failures: number;
  lastSuccessAt: number | null;
};

export type AdaptivePollerOptions = {
  task: () => Promise<PollOutcome>;
  /** Delay between polls while visible and active. */
  intervalMs: number;
  /** Slower delay once nothing changed and the user was idle for `idleAfterMs`. */
  idleIntervalMs?: number;
  idleAfterMs?: number;
  /** Upper bound for failure backoff. */
  maxBackoffMs?: number;
  /** Delay while hidden; `null` pauses entirely (default). */
  hiddenIntervalMs?: number | null;
  onStatus?: (status: PollerStatus) => void;
  timers?: PollerTimers;
};

export type AdaptivePoller = {
  /** `immediate: false` waits one interval before the first run. */
  start: (opts?: { immediate?: boolean }) => void;
  stop: () => void;
  /** Run now (coalesced with an in-flight run), then resume the schedule. */
  trigger: () => void;
  /** Mark user activity; leaves idle mode on the next schedule. */
  poke: () => void;
  setHidden: (hidden: boolean) => void;
  status: () => PollerStatus;
  /** Delay the next poll would use right now (for tests / diagnostics). */
  nextDelay: () => number;
};

const defaultTimers: PollerTimers = {
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: (h) => globalThis.clearTimeout(h as ReturnType<typeof setTimeout>),
  now: () => Date.now(),
};

export function backoffDelay(
  baseMs: number,
  failures: number,
  maxMs: number,
): number {
  if (failures <= 0) return baseMs;
  return Math.min(maxMs, baseMs * 2 ** failures);
}

export function createAdaptivePoller(opts: AdaptivePollerOptions): AdaptivePoller {
  const timers = opts.timers ?? defaultTimers;
  const idleIntervalMs = opts.idleIntervalMs ?? opts.intervalMs;
  const idleAfterMs = opts.idleAfterMs ?? Number.POSITIVE_INFINITY;
  const maxBackoffMs = opts.maxBackoffMs ?? 60_000;
  const hiddenIntervalMs =
    opts.hiddenIntervalMs === undefined ? null : opts.hiddenIntervalMs;

  let running = false;
  let hidden = false;
  let inFlight = false;
  let rerun = false;
  let failures = 0;
  let lastSuccessAt: number | null = null;
  let lastActivityAt = timers.now();
  let handle: unknown = null;
  let generation = 0;

  const status = (): PollerStatus => ({
    running,
    hidden,
    inFlight,
    failures,
    lastSuccessAt,
  });
  const emit = () => opts.onStatus?.(status());

  const clear = () => {
    if (handle !== null) {
      timers.clearTimeout(handle);
      handle = null;
    }
  };

  const nextDelay = () => {
    if (failures > 0) {
      return backoffDelay(opts.intervalMs, failures, maxBackoffMs);
    }
    if (hidden && hiddenIntervalMs !== null) return hiddenIntervalMs;
    if (timers.now() - lastActivityAt >= idleAfterMs) return idleIntervalMs;
    return opts.intervalMs;
  };

  const paused = () => !running || (hidden && hiddenIntervalMs === null);

  const schedule = () => {
    clear();
    if (paused()) return;
    const gen = generation;
    handle = timers.setTimeout(() => {
      handle = null;
      if (gen === generation) void run();
    }, nextDelay());
  };

  const run = async () => {
    if (paused()) return;
    if (inFlight) {
      rerun = true;
      return;
    }
    clear();
    const gen = generation;
    inFlight = true;
    emit();
    try {
      const outcome = await opts.task();
      if (gen !== generation) return;
      failures = 0;
      lastSuccessAt = timers.now();
      if (outcome && outcome.changed) lastActivityAt = timers.now();
    } catch {
      if (gen !== generation) return;
      failures += 1;
    } finally {
      if (gen === generation) {
        inFlight = false;
        emit();
        if (rerun) {
          rerun = false;
          void run();
        } else {
          schedule();
        }
      }
    }
  };

  return {
    start(startOpts) {
      if (running) return;
      running = true;
      generation += 1;
      inFlight = false;
      rerun = false;
      lastActivityAt = timers.now();
      if (startOpts?.immediate === false) schedule();
      else void run();
    },
    stop() {
      running = false;
      generation += 1;
      inFlight = false;
      rerun = false;
      clear();
      emit();
    },
    trigger() {
      if (paused()) return;
      void run();
    },
    poke() {
      const wasIdle = timers.now() - lastActivityAt >= idleAfterMs;
      lastActivityAt = timers.now();
      if (wasIdle && !inFlight && failures === 0) schedule();
    },
    setHidden(next) {
      if (hidden === next) return;
      hidden = next;
      if (!running) return;
      if (hidden) {
        schedule();
        emit();
      } else {
        lastActivityAt = timers.now();
        failures = 0;
        void run();
      }
    },
    status,
    nextDelay,
  };
}
