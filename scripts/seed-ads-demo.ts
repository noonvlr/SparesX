/**
 * Dev-only demo campaigns + synthetic AdDailyStat rows for analytics.
 * Aborts in production.
 *
 * Usage: npx tsx scripts/seed-ads-demo.ts
 */
import fs from "fs";
import path from "path";
import mongoose from "mongoose";

const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) continue;
    const eq = trimmedLine.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmedLine.slice(0, eq).trim();
    let value = trimmedLine.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function main() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  ) {
    console.error("Refusing to run seed-ads-demo in production.");
    process.exit(1);
  }

  const { connectDB } = await import("../src/lib/db/connect");
  const { seedAdPlacements } = await import("../src/lib/ads/seedPlacements");
  const { AdCampaign } = await import("../src/lib/models/AdCampaign");
  const { AdDailyStat } = await import("../src/lib/models/AdDailyStat");
  const { User } = await import("../src/lib/models/User");
  const { istDay } = await import("../src/lib/ads/ist");
  const { formatCtrDisplay } = await import("../src/lib/ads/ctr");

  await connectDB();
  await seedAdPlacements({ preserveExisting: true });

  const admin = await User.findOne({ role: "admin" }).select("_id").lean();
  if (!admin) {
    console.error("No admin user found — create an admin first.");
    process.exit(1);
  }
  const adminId = admin._id as mongoose.Types.ObjectId;

  const now = new Date();
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  let campaign = await AdCampaign.findOne({ name: "Demo House Promo" });
  if (!campaign) {
    campaign = await AdCampaign.create({
      name: "Demo House Promo",
      advertiserName: "SparesX",
      advertiserType: "house",
      description: "Dev seed campaign for analytics verification",
      destinationUrl: "https://www.sparesx.com/products",
      ctaLabel: "Browse parts",
      internalNotes: "Created by seed-ads-demo.ts — safe to archive",
      placementKeys: ["homepage_secondary"],
      creatives: [
        {
          placementKey: "homepage_secondary",
          device: "desktop",
          url: "/og-image.jpg",
          blobPathname: "seed/demo-desktop.jpg",
          width: 1200,
          height: 250,
          bytes: 1,
          mime: "image/jpeg",
          altText: "Demo House Promo",
        },
        {
          placementKey: "homepage_secondary",
          device: "mobile",
          url: "/og-image.jpg",
          blobPathname: "seed/demo-mobile.jpg",
          width: 720,
          height: 360,
          bytes: 1,
          mime: "image/jpeg",
          altText: "Demo House Promo",
        },
      ],
      startDate: start,
      endDate: end,
      priority: 3,
      status: "active",
      createdBy: adminId,
      updatedBy: adminId,
    });
    console.log("Created demo campaign", String(campaign._id));
  } else {
    console.log("Reusing demo campaign", String(campaign._id));
  }

  const today = istDay(now);
  await AdDailyStat.findOneAndUpdate(
    {
      istDate: today,
      campaignId: campaign._id,
      placementKey: "homepage_secondary",
      device: "desktop",
    },
    {
      $set: {
        impressions: 10,
        clicks: 2,
      },
    },
    { upsert: true },
  );

  console.log(
    `Seeded AdDailyStat for ${today}: 10 impressions, 2 clicks → CTR ${formatCtrDisplay(10, 2)}`,
  );
  console.log("Zero-impression CTR display:", formatCtrDisplay(0, 0));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
