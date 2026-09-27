/**
 * Chat service against a real (in-memory) MongoDB: read state, viewing-aware
 * notifications, typing and blocking — including authorization.
 */
import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

type ChatService = typeof import("@/lib/chat/chatService");

let mongod: MongoMemoryServer;
let svc: ChatService;
let User: typeof import("@/lib/models/User").User;
let Message: typeof import("@/lib/models/Message").Message;
let Conversation: typeof import("@/lib/models/Conversation").Conversation;
let Notification: typeof import("@/lib/models/Notification").Notification;
let WhatsAppConnect: typeof import("@/lib/models/WhatsAppConnect").WhatsAppConnect;
let blockPeer: typeof import("@/lib/chat/peerBlock").blockPeer;
let VIEWING_TTL_MS: number;

let seq = 0;
async function makeUser(name: string, extra: Record<string, unknown> = {}) {
  seq += 1;
  const u = await User.create({
    name,
    email: `${name.toLowerCase()}${seq}@test.local`,
    role: "technician",
    ...extra,
  });
  return String(u._id);
}

async function setupPair() {
  const buyer = await makeUser("Buyer");
  const seller = await makeUser("Seller");
  const outsider = await makeUser("Outsider");
  const conv = await svc.getOrCreateConversation({
    userId: buyer,
    peerId: seller,
    skipRateLimit: true,
  });
  return { buyer, seller, outsider, conversationId: String(conv._id) };
}

async function send(conversationId: string, senderId: string, text: string) {
  const result = await svc.sendMessage({
    conversationId,
    senderId,
    text,
    skipRateLimit: true,
  });
  await result.notification;
  return result;
}

async function expectForbidden(p: Promise<unknown>) {
  await assert.rejects(p, (err: { status?: number }) => err.status === 403);
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.MONGODB_DB_NAME = "sparesx_test";
  for (const key of ["SMTP_USER", "SMTP_PASS", "EMAIL_USER", "EMAIL_PASSWORD"]) {
    delete process.env[key];
  }

  svc = await import("@/lib/chat/chatService");
  ({ User } = await import("@/lib/models/User"));
  ({ Message } = await import("@/lib/models/Message"));
  ({ Conversation } = await import("@/lib/models/Conversation"));
  ({ Notification } = await import("@/lib/models/Notification"));
  ({ WhatsAppConnect } = await import("@/lib/models/WhatsAppConnect"));
  ({ blockPeer } = await import("@/lib/chat/peerBlock"));
  ({ VIEWING_TTL_MS } = await import("@/lib/chat/presenceRules"));
  const { connectDB } = await import("@/lib/db/connect");
  await connectDB();
});

beforeEach(async () => {
  const db = mongoose.connection.db;
  if (!db) return;
  for (const c of await db.collections()) await c.deleteMany({});
});

after(async () => {
  // let fire-and-forget response-rate updates settle
  await new Promise((r) => setTimeout(r, 300));
  await mongoose.disconnect();
  await mongod.stop();
});

describe("read state (C1)", () => {
  it("opening a conversation marks the recipient's unread messages read", async () => {
    const { buyer, seller, conversationId } = await setupPair();
    await send(conversationId, buyer, "Is this available?");
    await send(conversationId, buyer, "Also need the frame");
    assert.equal(await svc.getTotalUnread(seller), 2);

    const res = await svc.markConversationRead({ conversationId, userId: seller });
    assert.equal(res.modifiedCount, 2);
    assert.deepEqual(res.peerIds, [buyer]);
    assert.equal(await svc.getTotalUnread(seller), 0);
    const conv = await Conversation.findById(conversationId).lean();
    assert.equal((conv?.unreadCounts as unknown as Record<string, number>)[seller], 0);
  });

  it("a message received while viewing becomes read on the next viewing sync", async () => {
    const { buyer, seller, conversationId } = await setupPair();
    await svc.markConversationRead({ conversationId, userId: seller });
    await send(conversationId, buyer, "hello?");
    const res = await svc.markConversationRead({
      conversationId,
      userId: seller,
      opened: false,
    });
    assert.equal(res.modifiedCount, 1);
    assert.equal(await svc.getTotalUnread(seller), 0);
  });

  it("repeat sync with nothing unread performs no writes", async () => {
    const { buyer, seller, conversationId } = await setupPair();
    await send(conversationId, buyer, "hi");
    await svc.markConversationRead({ conversationId, userId: seller });
    const before = await Conversation.findById(conversationId).lean();
    const res = await svc.markConversationRead({
      conversationId,
      userId: seller,
      opened: false,
    });
    const afterDoc = await Conversation.findById(conversationId).lean();
    assert.equal(res.modifiedCount, 0);
    assert.deepEqual(res.peerIds, []);
    assert.equal(afterDoc?.updatedAt.getTime(), before?.updatedAt.getTime());
  });

  it("a non-participant cannot mark a conversation read", async () => {
    const { buyer, seller, outsider, conversationId } = await setupPair();
    await send(conversationId, buyer, "private");
    await expectForbidden(
      svc.markConversationRead({ conversationId, userId: outsider }),
    );
    await expectForbidden(
      svc.markConversationRead({ conversationId: "not-an-id", userId: seller }),
    );
    assert.equal(await svc.getTotalUnread(seller), 1);
  });

  it("a participant cannot mark the other side's incoming messages read", async () => {
    const { buyer, seller, conversationId } = await setupPair();
    await send(conversationId, buyer, "for the seller");
    const res = await svc.markConversationRead({ conversationId, userId: buyer });
    assert.equal(res.modifiedCount, 0);
    assert.equal(await svc.getTotalUnread(seller), 1);
  });
});

describe("viewing-aware notifications (C2)", () => {
  it("active viewer: message is stored but no notification (so no push/email)", async () => {
    const { buyer, seller, conversationId } = await setupPair();
    await svc.setConversationViewing({ userId: seller, viewing: [conversationId] });
    const result = await send(conversationId, buyer, "you there?");
    assert.equal(result.receiverViewing, true);
    assert.equal(result.message.delivered, true);
    assert.equal(await Notification.countDocuments({ user: seller }), 0);
    assert.equal(await Message.countDocuments({ conversationId }), 1);
  });

  it("not viewing: existing notification behavior (one collapsed notification per thread)", async () => {
    const { buyer, seller, conversationId } = await setupPair();
    await send(conversationId, buyer, "first");
    await send(conversationId, buyer, "second");
    const notes = await Notification.find({ user: seller }).lean();
    assert.equal(notes.length, 1);
    assert.equal(notes[0].collapseKey, `chat:${conversationId}`);
    assert.equal((notes[0].meta as { count?: number })?.count, 2);
  });

  it("stale viewing state expires (crashed tab stops suppressing)", async () => {
    const { buyer, seller, conversationId } = await setupPair();
    await svc.setConversationViewing({
      userId: seller,
      viewing: [conversationId],
      now: Date.now() - VIEWING_TTL_MS - 1_000,
    });
    const result = await send(conversationId, buyer, "still there?");
    assert.equal(result.receiverViewing, false);
    assert.equal(await Notification.countDocuments({ user: seller }), 1);
  });

  it("closing the thread releases the lease", async () => {
    const { buyer, seller, conversationId } = await setupPair();
    await svc.setConversationViewing({ userId: seller, viewing: [conversationId] });
    await svc.setConversationViewing({ userId: seller, stopViewing: [conversationId] });
    await send(conversationId, buyer, "ping");
    assert.equal(await Notification.countDocuments({ user: seller }), 1);
  });

  it("going offline (logout / tab close) releases all leases", async () => {
    const { buyer, seller, conversationId } = await setupPair();
    await svc.setConversationViewing({ userId: seller, viewing: [conversationId] });
    await svc.markUserOffline(seller);
    const result = await send(conversationId, buyer, "ping");
    assert.equal(result.receiverViewing, false);
  });

  it("viewing state is authorized: outsiders cannot set a lease", async () => {
    const { outsider, conversationId } = await setupPair();
    await svc.setConversationViewing({ userId: outsider, viewing: [conversationId] });
    const conv = await Conversation.findById(conversationId).lean();
    const leases = (conv?.viewingUntil || {}) as Record<string, unknown>;
    assert.equal(leases[outsider], undefined);
  });

  it("recipient online state comes from lastSeen (REST path)", async () => {
    const { buyer, seller, conversationId } = await setupPair();
    const offline = await send(conversationId, buyer, "one");
    assert.equal(offline.message.delivered, false);
    await svc.updateLastSeen(seller);
    const online = await send(conversationId, buyer, "two");
    assert.equal(online.message.delivered, true);
  });
});

describe("typing (H4)", () => {
  it("participant typing is visible to the peer and expires", async () => {
    const { buyer, seller, conversationId } = await setupPair();
    await svc.setConversationTyping({ conversationId, userId: buyer, typing: true });
    let page = await svc.listMessages({ conversationId, userId: seller });
    assert.equal(page.peerTyping, true);
    const own = await svc.listMessages({ conversationId, userId: buyer });
    assert.equal(own.peerTyping, false, "you never see your own typing");

    await Conversation.updateOne(
      { _id: conversationId },
      { $set: { typingUntil: new Date(Date.now() - 1) } },
    );
    page = await svc.listMessages({ conversationId, userId: seller });
    assert.equal(page.peerTyping, false);
  });

  it("sending a message clears the sender's typing state", async () => {
    const { buyer, seller, conversationId } = await setupPair();
    await svc.setConversationTyping({ conversationId, userId: buyer, typing: true });
    await send(conversationId, buyer, "done typing");
    const page = await svc.listMessages({ conversationId, userId: seller });
    assert.equal(page.peerTyping, false);
  });

  it("blocked user cannot type (silent no-op)", async () => {
    const { buyer, seller, conversationId } = await setupPair();
    await blockPeer(seller, buyer);
    const res = await svc.setConversationTyping({
      conversationId,
      userId: buyer,
      typing: true,
    });
    assert.equal(res.typingUserId, null);
    const page = await svc.listMessages({ conversationId, userId: seller });
    assert.equal(page.peerTyping, false);
  });

  it("non-participant cannot type", async () => {
    const { outsider, conversationId } = await setupPair();
    await expectForbidden(
      svc.setConversationTyping({ conversationId, userId: outsider, typing: true }),
    );
  });
});

describe("moderation (H3 server rules)", () => {
  it("blocked users cannot message each other", async () => {
    const { buyer, seller, conversationId } = await setupPair();
    await blockPeer(seller, buyer);
    await expectForbidden(
      svc.sendMessage({ conversationId, senderId: buyer, text: "hi", skipRateLimit: true }),
    );
    await expectForbidden(
      svc.sendMessage({ conversationId, senderId: seller, text: "hi", skipRateLimit: true }),
    );
  });

  it("blocking revokes WhatsApp unlock access", async () => {
    const { buyer, seller } = await setupPair();
    await WhatsAppConnect.create({ requester: buyer, seller, status: "approved" });
    await blockPeer(seller, buyer);
    const row = await WhatsAppConnect.findOne({ requester: buyer, seller }).lean();
    assert.equal(row?.status, "declined");
  });

  it("outsiders cannot read or send in a conversation", async () => {
    const { outsider, conversationId } = await setupPair();
    await expectForbidden(svc.listMessages({ conversationId, userId: outsider }));
    await expectForbidden(
      svc.sendMessage({ conversationId, senderId: outsider, text: "x", skipRateLimit: true }),
    );
  });

  it("image messages still enforce the URL allowlist", async () => {
    const { buyer, conversationId } = await setupPair();
    await assert.rejects(
      svc.sendMessage({
        conversationId,
        senderId: buyer,
        type: "image",
        mediaUrl: "https://evil.example.com/x.png",
        skipRateLimit: true,
      }),
      (err: { status?: number }) => err.status === 400,
    );
  });
});
