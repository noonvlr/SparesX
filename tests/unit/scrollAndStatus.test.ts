import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isNearBottom,
  planScroll,
  preservedScrollTop,
} from "@/lib/chat/scrollAnchor";
import { deriveSyncStatus, SYNC_STATUS_COPY } from "@/lib/chat/syncStatus";

describe("thread scroll planning", () => {
  const base = { firstId: "m10", lastId: "m50", count: 40 };

  it("loading older messages keeps the viewport anchored", () => {
    const plan = planScroll(
      base,
      { firstId: "m1", lastId: "m50", count: 49 },
      { wasNearBottom: false, lastIsMine: false, threadChanged: false },
    );
    assert.equal(plan, "preserve");
    // 900px of older rows inserted above → scrollTop shifts by the same amount
    assert.equal(preservedScrollTop(40, 2_000, 2_900), 940);
  });

  it("new incoming message while reading history does not jump", () => {
    const plan = planScroll(
      base,
      { firstId: "m10", lastId: "m51", count: 41 },
      { wasNearBottom: false, lastIsMine: false, threadChanged: false },
    );
    assert.equal(plan, "none");
  });

  it("new message follows when already near the bottom", () => {
    assert.equal(
      planScroll(
        base,
        { firstId: "m10", lastId: "m51", count: 41 },
        { wasNearBottom: true, lastIsMine: false, threadChanged: false },
      ),
      "bottom",
    );
  });

  it("my own sent message always scrolls into view", () => {
    assert.equal(
      planScroll(
        base,
        { firstId: "m10", lastId: "temp-1", count: 41 },
        { wasNearBottom: false, lastIsMine: true, threadChanged: false },
      ),
      "bottom",
    );
  });

  it("opening / switching a thread starts at the newest message", () => {
    assert.equal(
      planScroll(base, base, { wasNearBottom: false, lastIsMine: false, threadChanged: true }),
      "bottom",
    );
    assert.equal(
      planScroll({ count: 0 }, base, { wasNearBottom: false, lastIsMine: false, threadChanged: false }),
      "bottom",
    );
  });

  it("read-receipt-only updates do not move a reader who scrolled up", () => {
    assert.equal(
      planScroll(base, base, { wasNearBottom: false, lastIsMine: false, threadChanged: false }),
      "none",
    );
  });

  it("a bubble growing in place (Sending → Not sent) stays pinned at the bottom", () => {
    assert.equal(
      planScroll(base, base, { wasNearBottom: true, lastIsMine: true, threadChanged: false }),
      "bottom",
    );
  });

  it("near-bottom threshold", () => {
    assert.equal(isNearBottom({ scrollTop: 880, scrollHeight: 1_500, clientHeight: 500 }), true);
    assert.equal(isNearBottom({ scrollTop: 200, scrollHeight: 1_500, clientHeight: 500 }), false);
  });
});

describe("connection status", () => {
  const ok = {
    loggedIn: true,
    socketConnected: false,
    browserOnline: true,
    hidden: false,
    failures: 0,
    hasSynced: true,
  };

  it("REST sync never claims to be Live", () => {
    const status = deriveSyncStatus(ok);
    assert.equal(status, "connected");
    assert.notEqual(SYNC_STATUS_COPY[status].label, "Live");
  });

  it("socket connection is Live", () => {
    assert.equal(deriveSyncStatus({ ...ok, socketConnected: true }), "live");
  });

  it("syncing before the first successful sync", () => {
    assert.equal(deriveSyncStatus({ ...ok, hasSynced: false }), "syncing");
  });

  it("reconnecting after failures, offline after repeated failures or no network", () => {
    assert.equal(deriveSyncStatus({ ...ok, failures: 1 }), "reconnecting");
    assert.equal(deriveSyncStatus({ ...ok, failures: 3 }), "offline");
    assert.equal(deriveSyncStatus({ ...ok, browserOnline: false }), "offline");
  });

  it("paused while the tab is hidden", () => {
    assert.equal(deriveSyncStatus({ ...ok, hidden: true }), "paused");
  });
});
