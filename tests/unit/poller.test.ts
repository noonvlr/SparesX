import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { backoffDelay, createAdaptivePoller } from "@/lib/chat/poller";
import { FakeClock, flush } from "../helpers/fakeClock";

function setup(opts?: {
  fail?: () => boolean;
  changed?: () => boolean;
  intervalMs?: number;
  idleIntervalMs?: number;
  idleAfterMs?: number;
}) {
  const clock = new FakeClock();
  const calls: number[] = [];
  let release: (() => void) | null = null;
  let hold = false;
  const poller = createAdaptivePoller({
    task: async () => {
      calls.push(clock.now());
      if (hold) {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      }
      if (opts?.fail?.()) throw new Error("network");
      return { changed: opts?.changed?.() ?? false };
    },
    intervalMs: opts?.intervalMs ?? 4_000,
    idleIntervalMs: opts?.idleIntervalMs ?? 12_000,
    idleAfterMs: opts?.idleAfterMs ?? 60_000,
    maxBackoffMs: 60_000,
    timers: clock,
  });
  return {
    clock,
    calls,
    poller,
    holdNext: () => {
      hold = true;
    },
    releaseHeld: async () => {
      hold = false;
      release?.();
      release = null;
      await flush();
    },
  };
}

describe("adaptive poller", () => {
  it("visible tab: polls immediately, then every interval", async () => {
    const { clock, calls, poller } = setup();
    poller.start();
    await flush();
    await clock.advance(10_000);
    assert.deepEqual(calls, [0, 4_000, 8_000]);
    poller.stop();
  });

  it("hidden tab: makes no requests while hidden", async () => {
    const { clock, calls, poller } = setup();
    poller.start();
    await flush();
    poller.setHidden(true);
    await clock.advance(5 * 60_000);
    assert.equal(calls.length, 1);
    assert.equal(clock.pending(), 0, "no timers left while hidden");
    poller.stop();
  });

  it("tab restored: syncs immediately, then resumes normal cadence", async () => {
    const { clock, calls, poller } = setup();
    poller.setHidden(true);
    poller.start();
    await clock.advance(30_000);
    assert.equal(calls.length, 0, "starting hidden does not poll");
    poller.setHidden(false);
    await flush();
    assert.deepEqual(calls, [30_000]);
    await clock.advance(4_000);
    assert.deepEqual(calls, [30_000, 34_000]);
    poller.stop();
  });

  it("network failure: bounded exponential backoff, reset on success", async () => {
    let failing = true;
    const { clock, calls, poller } = setup({
      fail: () => failing,
      changed: () => true,
    });
    poller.start();
    await flush();
    await clock.advance(8_000 + 16_000 + 32_000 + 60_000 + 60_000);
    const gaps = calls.slice(1).map((t, i) => t - calls[i]);
    assert.deepEqual(gaps, [8_000, 16_000, 32_000, 60_000, 60_000]);
    failing = false;
    await clock.advance(60_000);
    const afterRecover = calls.length;
    await clock.advance(4_000);
    assert.equal(calls.length, afterRecover + 1, "back to 4s after a success");
    poller.stop();
  });

  it("backoffDelay is capped", () => {
    assert.equal(backoffDelay(4_000, 0, 60_000), 4_000);
    assert.equal(backoffDelay(4_000, 1, 60_000), 8_000);
    assert.equal(backoffDelay(4_000, 10, 60_000), 60_000);
  });

  it("idle: slows down after a quiet minute, poke restores the fast cadence", async () => {
    const { clock, calls, poller } = setup();
    poller.start();
    await flush();
    await clock.advance(60_000);
    const before = calls.length;
    assert.equal(poller.nextDelay(), 12_000);
    await clock.advance(24_000);
    assert.equal(calls.length - before, 2, "12s cadence while idle");
    poller.poke();
    assert.equal(poller.nextDelay(), 4_000);
    poller.stop();
  });

  it("changes keep the fast cadence", async () => {
    const { clock, poller } = setup({ changed: () => true });
    poller.start();
    await flush();
    await clock.advance(120_000);
    assert.equal(poller.nextDelay(), 4_000);
    poller.stop();
  });

  it("conversation closed: stop() cancels and an in-flight result does not reschedule", async () => {
    const { clock, calls, poller, holdNext, releaseHeld } = setup();
    holdNext();
    poller.start();
    await flush();
    assert.equal(calls.length, 1);
    poller.stop();
    await releaseHeld();
    await clock.advance(60_000);
    assert.equal(calls.length, 1);
    assert.equal(clock.pending(), 0);
  });

  it("conversation opened: immediate:false waits one interval (open already fetched)", async () => {
    const { clock, calls, poller } = setup({ intervalMs: 2_000 });
    poller.start({ immediate: false });
    await flush();
    assert.equal(calls.length, 0);
    await clock.advance(2_000);
    assert.deepEqual(calls, [2_000]);
    poller.stop();
  });

  it("trigger during an in-flight run coalesces into one follow-up run", async () => {
    const { calls, poller, holdNext, releaseHeld } = setup();
    holdNext();
    poller.start();
    await flush();
    poller.trigger();
    poller.trigger();
    await releaseHeld();
    assert.equal(calls.length, 2);
    poller.stop();
  });
});
