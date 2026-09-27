import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  TYPING_HEARTBEAT_MS,
  createTypingThrottle,
} from "@/lib/chat/typingThrottle";
import { TYPING_WINDOW_MS } from "@/lib/chat/presenceRules";
import { FakeClock } from "../helpers/fakeClock";

describe("typing throttle", () => {
  it("sends a heartbeat instead of one request per keystroke", async () => {
    const clock = new FakeClock();
    const sent: Array<[number, boolean]> = [];
    const t = createTypingThrottle({
      send: (typing) => sent.push([clock.now(), typing]),
      timers: clock,
    });
    // 31 keystrokes, one every 300ms (~9s of typing)
    for (let i = 0; i <= 30; i++) {
      t.keystroke();
      await clock.advance(300);
    }
    assert.deepEqual(
      sent.map(([at]) => at),
      [0, 3_000, 6_000, 9_000],
    );
    assert.ok(sent.every(([, typing]) => typing));
  });

  it("heartbeat stays inside the server typing window", () => {
    assert.ok(TYPING_HEARTBEAT_MS < TYPING_WINDOW_MS);
  });

  it("goes quiet after inactivity and restarts on the next keystroke", async () => {
    const clock = new FakeClock();
    const sent: boolean[] = [];
    const t = createTypingThrottle({ send: (v) => sent.push(v), timers: clock });
    t.keystroke();
    await clock.advance(2_600);
    assert.equal(t.isActive(), false);
    assert.deepEqual(sent, [true], "no stop request on idle — server lease expires");
    t.keystroke();
    assert.deepEqual(sent, [true, true]);
  });

  it("explicit stop notifies once; silent stop sends nothing", async () => {
    const clock = new FakeClock();
    const sent: boolean[] = [];
    const t = createTypingThrottle({ send: (v) => sent.push(v), timers: clock });
    t.keystroke();
    t.stop();
    assert.deepEqual(sent, [true]);
    t.keystroke();
    t.stop({ notify: true });
    t.stop({ notify: true });
    assert.deepEqual(sent, [true, true, false]);
  });
});
