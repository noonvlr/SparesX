import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findServerEcho, mergeThread } from "@/lib/chat/sendReconcile";
import { createSendGuard, runRetry, runSend } from "@/lib/chat/sendGuard";
import type { ChatMessage } from "@/types/chat";

const ME = "me";
const PEER = "peer";

function msg(over: Partial<ChatMessage>): ChatMessage {
  return {
    _id: "m1",
    conversationId: "c1",
    senderId: ME,
    receiverId: PEER,
    type: "text",
    text: "hello",
    delivered: false,
    read: false,
    createdAt: "2026-09-27T10:00:00.000Z",
    ...over,
  };
}

function pending(over: Partial<ChatMessage> = {}): ChatMessage {
  return msg({
    _id: "temp-1",
    clientId: "temp-1",
    clientStatus: "failed",
    ...over,
  });
}

describe("send reconciliation", () => {
  it("replaces a pending bubble with its server echo (no duplicate)", () => {
    const server = [msg({ _id: "s1", createdAt: "2026-09-27T10:00:01.000Z" })];
    const { messages, resolvedClientIds } = mergeThread([pending()], server);
    assert.deepEqual(messages.map((m) => m._id), ["s1"]);
    assert.deepEqual(resolvedClientIds, ["temp-1"]);
  });

  it("matches sanitized text the server stored", () => {
    const echo = findServerEcho(
      pending({ text: "  <b>hi</b> " }),
      [msg({ _id: "s1", text: "hi" })],
      new Set(),
    );
    assert.equal(echo?._id, "s1");
  });

  it("does not match a message that is already confirmed (same text sent twice)", () => {
    const confirmed = msg({ _id: "s1", text: "ok" });
    const second = pending({ text: "ok", createdAt: "2026-09-27T10:00:05.000Z" });
    const { messages, resolvedClientIds } = mergeThread([confirmed, second], [confirmed]);
    assert.equal(resolvedClientIds.length, 0);
    assert.deepEqual(messages.map((m) => m._id), ["s1", "temp-1"]);
  });

  it("keeps a failed bubble when the server has no copy", () => {
    const { messages } = mergeThread([pending()], []);
    assert.equal(messages[0].clientStatus, "failed");
  });

  it("ignores other senders and messages outside the echo window", () => {
    assert.equal(
      findServerEcho(pending(), [msg({ _id: "s1", senderId: PEER })], new Set()),
      undefined,
    );
    assert.equal(
      findServerEcho(
        pending(),
        [msg({ _id: "s2", createdAt: "2026-09-27T10:10:00.000Z" })],
        new Set(),
      ),
      undefined,
    );
  });

  it("read / delivered flags never go backwards when a stale poll lands", () => {
    const local = msg({ _id: "s1", senderId: PEER, receiverId: ME, read: true, delivered: true });
    const stale = msg({ _id: "s1", senderId: PEER, receiverId: ME, read: false, delivered: false });
    const { messages } = mergeThread([local], [stale]);
    assert.equal(messages[0].read, true);
    assert.equal(messages[0].delivered, true);
  });
});

describe("send guard", () => {
  it("successful send resolves once", async () => {
    const guard = createSendGuard();
    const saved: string[] = [];
    const outcome = await runSend({
      clientId: "t1",
      guard,
      deliver: async () => "s1",
      onSuccess: (s) => saved.push(s),
      onFailure: () => assert.fail("should not fail"),
    });
    assert.equal(outcome, "sent");
    assert.deepEqual(saved, ["s1"]);
  });

  it("failed send reports the error and keeps the bubble retryable", async () => {
    const guard = createSendGuard();
    const errors: string[] = [];
    const outcome = await runSend({
      clientId: "t1",
      guard,
      deliver: async () => {
        throw new Error("Too many messages");
      },
      onSuccess: () => assert.fail("should not succeed"),
      onFailure: (e) => errors.push((e as Error).message),
    });
    assert.equal(outcome, "failed");
    assert.deepEqual(errors, ["Too many messages"]);
    assert.equal(guard.isInFlight("t1"), false);
  });

  it("duplicate-send protection: one request per bubble while in flight", async () => {
    const guard = createSendGuard();
    let calls = 0;
    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    const deliver = async () => {
      calls += 1;
      await gate;
      return "s1";
    };
    const first = runSend({ clientId: "t1", guard, deliver, onSuccess: () => {}, onFailure: () => {} });
    const second = await runSend({ clientId: "t1", guard, deliver, onSuccess: () => {}, onFailure: () => {} });
    assert.equal(second, "skipped");
    release();
    assert.equal(await first, "sent");
    assert.equal(calls, 1);
    const third = await runSend({ clientId: "t1", guard, deliver, onSuccess: () => {}, onFailure: () => {} });
    assert.equal(third, "skipped", "a delivered bubble is never re-sent");
  });

  it("retry resends when the server has no copy", async () => {
    const guard = createSendGuard();
    let delivered = 0;
    const outcome = await runRetry({
      clientId: "t1",
      guard,
      reconcile: async () => {},
      resend: () =>
        runSend({
          clientId: "t1",
          guard,
          deliver: async () => {
            delivered += 1;
            return "s1";
          },
          onSuccess: () => {},
          onFailure: () => {},
        }),
    });
    assert.equal(outcome, "sent");
    assert.equal(delivered, 1);
  });

  it("retry does not duplicate when the first attempt actually reached the server", async () => {
    const guard = createSendGuard();
    let delivered = 0;
    const outcome = await runRetry({
      clientId: "t1",
      guard,
      // poll finds the echo → mergeThread reports the client id as resolved
      reconcile: async () => guard.resolve("t1"),
      resend: async () => {
        delivered += 1;
        return "sent";
      },
    });
    assert.equal(outcome, "resolved-elsewhere");
    assert.equal(delivered, 0);
  });

  it("double-tapping Retry only retries once", async () => {
    const guard = createSendGuard();
    let reconciles = 0;
    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    const retry = () =>
      runRetry({
        clientId: "t1",
        guard,
        reconcile: async () => {
          reconciles += 1;
          await gate;
        },
        resend: async () => "sent" as const,
      });
    const first = retry();
    assert.equal(await retry(), "skipped");
    release();
    await first;
    assert.equal(reconciles, 1);
  });

  it("a lost response that a poll already reconciled is not shown as failed", async () => {
    const guard = createSendGuard();
    let failures = 0;
    const outcome = await runSend({
      clientId: "t1",
      guard,
      deliver: async () => {
        guard.resolve("t1");
        throw new Error("Failed to fetch");
      },
      onSuccess: () => {},
      onFailure: () => {
        failures += 1;
      },
    });
    assert.equal(outcome, "resolved-elsewhere");
    assert.equal(failures, 0);
  });
});
