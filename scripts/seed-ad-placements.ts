import fs from "fs";
import path from "path";

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
  const force = process.argv.includes("--force");
  const { connectDB } = await import("../src/lib/db/connect");
  const { seedAdPlacements } = await import("../src/lib/ads/seedPlacements");
  const { AdPlacement } = await import("../src/lib/models/AdPlacement");

  await connectDB();
  console.log("Connected to database");

  const result = await seedAdPlacements({ preserveExisting: !force });
  console.log(
    force
      ? `Upserted/refreshed ${result.upserted} placements (--force).`
      : `Inserted ${result.upserted} missing placements (existing preserved).`,
  );

  const all = await AdPlacement.find().sort({ key: 1 }).lean();
  for (const p of all) {
    const mob = p.mobile
      ? `${p.mobile.width}×${p.mobile.height}`
      : "n/a";
    console.log(
      `  ${p.key}: ${p.name} desktop ${p.desktop.width}×${p.desktop.height} mobile ${mob} enabled=${p.enabled}`,
    );
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("seed-ad-placements failed:", err);
  process.exit(1);
});
