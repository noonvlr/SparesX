/** Deterministic timers for poller / throttle tests. */
export class FakeClock {
  private t = 0;
  private seq = 0;
  private queue: { at: number; id: number; fn: () => void }[] = [];

  now = () => this.t;

  setTimeout = (fn: () => void, ms: number) => {
    const id = ++this.seq;
    this.queue.push({ at: this.t + Math.max(0, ms), id, fn });
    return id;
  };

  clearTimeout = (handle: unknown) => {
    this.queue = this.queue.filter((q) => q.id !== handle);
  };

  pending() {
    return this.queue.length;
  }

  /** Advance time, running due timers in order and flushing promises between them. */
  async advance(ms: number) {
    const end = this.t + ms;
    for (;;) {
      this.queue.sort((a, b) => a.at - b.at || a.id - b.id);
      const next = this.queue[0];
      if (!next || next.at > end) break;
      this.queue.shift();
      this.t = next.at;
      next.fn();
      await flush();
    }
    this.t = end;
    await flush();
  }
}

export async function flush() {
  for (let i = 0; i < 10; i++) {
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}
