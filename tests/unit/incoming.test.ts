import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectIncoming, incomingToastText } from "@/lib/chat/incoming";
import type { ChatConversation } from "@/types/chat";

const ME = "me";
const PEER = "peer";

function conv(
  id: string,
  over: Partial<ChatConversation> = {},
): ChatConversation {
  return {
    _id: id,
    participants: [],
    peer: { _id: PEER, name: "Ravi" },
    lastMessage: "hello",
    lastMessageTime: "2026-09-27T10:00:00.000Z",
    lastMessageSenderId: PEER,
    unreadCount: 1,
    ...over,
  };
}

describe("incoming message detection", () => {
  it("first sync only records a baseline (no chime for old unread)", () => {
    const { incoming } = detectIncoming(null, [conv("a")], { userId: ME });
    assert.equal(incoming.length, 0);
  });

  it("reports a genuinely new message from the peer once", () => {
    const first = detectIncoming(null, [conv("a")], { userId: ME });
    const list = [
      conv("a", {
        lastMessage: "is it available?",
        lastMessageTime: "2026-09-27T10:01:00.000Z",
        unreadCount: 2,
      }),
    ];
    const second = detectIncoming(first.snapshot, list, { userId: ME });
    assert.equal(second.incoming.length, 1);
    assert.equal(second.incoming[0].preview, "is it available?");
    const third = detectIncoming(second.snapshot, list, { userId: ME });
    assert.equal(third.incoming.length, 0, "same message never notifies twice");
  });

  it("ignores my own messages", () => {
    const first = detectIncoming(null, [conv("a", { unreadCount: 0 })], { userId: ME });
    const second = detectIncoming(
      first.snapshot,
      [
        conv("a", {
          lastMessageSenderId: ME,
          lastMessageTime: "2026-09-27T10:05:00.000Z",
          unreadCount: 0,
        }),
      ],
      { userId: ME },
    );
    assert.equal(second.incoming.length, 0);
  });

  it("stays quiet for the conversation being viewed", () => {
    const first = detectIncoming(null, [conv("a", { unreadCount: 0 })], { userId: ME });
    const second = detectIncoming(
      first.snapshot,
      [conv("a", { lastMessageTime: "2026-09-27T10:05:00.000Z", unreadCount: 1 })],
      { userId: ME, viewingIds: new Set(["a"]) },
    );
    assert.equal(second.incoming.length, 0);
  });

  it("does not notify when the new message was already read (e.g. on another tab)", () => {
    const first = detectIncoming(null, [conv("a", { unreadCount: 0 })], { userId: ME });
    const second = detectIncoming(
      first.snapshot,
      [conv("a", { lastMessageTime: "2026-09-27T10:05:00.000Z", unreadCount: 0 })],
      { userId: ME },
    );
    assert.equal(second.incoming.length, 0);
  });

  it("new conversation with unread messages notifies", () => {
    const first = detectIncoming(null, [], { userId: ME });
    const second = detectIncoming(first.snapshot, [conv("b")], { userId: ME });
    assert.equal(second.incoming.length, 1);
  });

  it("toast text", () => {
    assert.equal(
      incomingToastText([{ conversationId: "a", peerName: "Ravi", preview: "hi", at: 1 }]),
      "Ravi: hi",
    );
    assert.equal(
      incomingToastText([
        { conversationId: "a", peerName: "Ravi", preview: "hi", at: 1 },
        { conversationId: "b", peerName: "Anu", preview: "yo", at: 2 },
      ]),
      "2 new messages",
    );
  });
});
