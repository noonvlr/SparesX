import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CHAT_EMAIL_COOLDOWN_MS,
  PRESENCE_HEARTBEAT_MS,
  VIEWING_TTL_MS,
  decideChatEmail,
  isViewingConversation,
} from "@/lib/chat/presenceRules";

describe("viewing lease", () => {
  const now = Date.parse("2026-09-27T10:00:00.000Z");

  it("fresh lease counts as viewing; expired lease does not", () => {
    const map = new Map([
      ["u1", new Date(now + 10_000)],
      ["u2", new Date(now - 1)],
    ]);
    assert.equal(isViewingConversation(map, "u1", now), true);
    assert.equal(isViewingConversation(map, "u2", now), false);
    assert.equal(isViewingConversation(map, "u3", now), false);
    assert.equal(isViewingConversation(undefined, "u1", now), false);
  });

  it("accepts lean (plain object) maps", () => {
    assert.equal(
      isViewingConversation({ u1: new Date(now + 5_000).toISOString() }, "u1", now),
      true,
    );
  });

  it("lease survives one missed heartbeat but expires within a minute", () => {
    assert.ok(VIEWING_TTL_MS > PRESENCE_HEARTBEAT_MS * 2);
    assert.ok(VIEWING_TTL_MS <= 60_000);
  });
});

describe("chat email decision (1h cooldown preserved)", () => {
  const now = Date.parse("2026-09-27T10:00:00.000Z");
  const base = {
    sendEmail: true,
    created: false,
    isFirstUnreadBurst: false,
    receiverOnline: false,
    now,
  };

  it("fresh notification emails", () => {
    assert.equal(decideChatEmail({ ...base, created: true, isFirstUnreadBurst: true }), true);
  });

  it("collapsed follow-up within the cooldown does not email", () => {
    assert.equal(
      decideChatEmail({ ...base, lastEmailAt: new Date(now - 10 * 60_000).toISOString() }),
      false,
    );
  });

  it("collapsed follow-up after the cooldown emails again", () => {
    assert.equal(
      decideChatEmail({ ...base, lastEmailAt: now - CHAT_EMAIL_COOLDOWN_MS - 1 }),
      true,
    );
  });

  it("collapsed follow-up never emails an online recipient", () => {
    assert.equal(decideChatEmail({ ...base, receiverOnline: true }), false);
  });

  it("no email when sendEmail is false", () => {
    assert.equal(decideChatEmail({ ...base, sendEmail: false, created: true }), false);
  });
});
