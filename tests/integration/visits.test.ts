/**
 * Unique visitors: one browser counts once per UTC day, and again on a later day.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod: MongoMemoryServer;
let recordVisit: typeof import("@/lib/analytics/visits").recordVisit;
let getUniqueVisitorStats: typeof import("@/lib/analytics/visits").getUniqueVisitorStats;

const A = "a".repeat(32);
const B = "b".repeat(32);

before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.MONGODB_DB_NAME = "sparesx_visits_test";
  ({ recordVisit, getUniqueVisitorStats } = await import("@/lib/analytics/visits"));
  const { connectDB } = await import("@/lib/db/connect");
  await connectDB();
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe("unique visitor counts", () => {
  it("counts a browser once per day and again across days", async () => {
    const day1 = new Date("2026-10-18T08:00:00.000Z");
    const day2 = new Date("2026-10-20T08:00:00.000Z");
    await recordVisit(A, day1);
    await recordVisit(A, day1);
    await recordVisit(B, day1);
    await recordVisit(A, day2);

    const stats = await getUniqueVisitorStats(day2);
    assert.equal(stats.today, 1);
    assert.equal(stats.last7, 2);
    assert.equal(stats.last30, 2);
    assert.equal(stats.allTime, 2);
    const oct18 = stats.series.find((point) => point.date === "2026-10-18");
    const oct20 = stats.series.find((point) => point.date === "2026-10-20");
    assert.equal(oct18?.visitors, 2);
    assert.equal(oct20?.visitors, 1);
  });
});
