import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { AdCampaign } from "@/lib/models/AdCampaign";
import { verifyPromoToken } from "@/lib/ads/token";
import {
  appendSponsoredUtm,
  validateDestinationUrl,
} from "@/lib/ads/destinationUrl";
import { checkRateLimitAsync, clientIpFromRequest } from "@/lib/security/authRateLimit";

type Ctx = { params: Promise<{ campaignId: string }> };

/**
 * Click redirect (tracking rollup lands in Phase 6).
 * Destination always loaded from MongoDB — never from the query string.
 */
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { campaignId } = await ctx.params;
    const { searchParams } = new URL(req.url);
    const placementKey = String(searchParams.get("p") || "").trim();
    const token = String(searchParams.get("t") || "").trim();

    if (
      !mongoose.Types.ObjectId.isValid(campaignId) ||
      !placementKey ||
      !token
    ) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const ip = clientIpFromRequest(req);
    const rate = await checkRateLimitAsync({
      key: `promo-click:${ip}`,
      limit: 60,
      windowMs: 60_000,
    });
    if (!rate.ok) {
      return NextResponse.json(
        { message: "Too many requests" },
        { status: 429 },
      );
    }

    const payload = verifyPromoToken(token, { campaignId, placementKey });
    if (!payload) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    await connectDB();
    const campaign = await AdCampaign.findById(campaignId)
      .select("destinationUrl name status")
      .lean();
    if (!campaign?.destinationUrl) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const checked = validateDestinationUrl(campaign.destinationUrl);
    if (!checked.ok) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const slug = String(campaign.name || "campaign")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64);

    const dest = appendSponsoredUtm(checked.url, slug || "campaign");
    return NextResponse.redirect(dest, 302);
  } catch (error) {
    console.error("[promos/click GET]", error);
    return NextResponse.json({ message: "Unavailable" }, { status: 503 });
  }
}
