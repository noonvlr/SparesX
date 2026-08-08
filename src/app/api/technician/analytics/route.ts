import { NextRequest, NextResponse } from "next/server";
import { requireUser, isAuthError } from "@/lib/auth/requireUser";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { MarketplaceEvent } from "@/lib/models/MarketplaceEvent";
import { User } from "@/lib/models/User";

/**
 * Owner-only listing funnel counters from MarketplaceEvent (no buyer PII).
 */
export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  if (auth.role !== "technician" && auth.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const days = Math.min(
    90,
    Math.max(7, parseInt(new URL(req.url).searchParams.get("days") || "30", 10) || 30),
  );
  const sinceDay = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const products = await Product.find({ technician: auth.id })
    .select("_id slug name status")
    .lean();
  const productIds = products.map((p) => String(p._id));

  const [agg, user] = await Promise.all([
    productIds.length
      ? MarketplaceEvent.aggregate<{
          _id: { productId: string; type: string };
          count: number;
        }>([
          {
            $match: {
              day: { $gte: sinceDay },
              productId: { $in: productIds },
              type: {
                $in: [
                  "product_view",
                  "chat_start",
                  "whatsapp_request",
                  "whatsapp_approved",
                  "listing_sold",
                ],
              },
            },
          },
          {
            $group: {
              _id: { productId: "$productId", type: "$type" },
              count: { $sum: 1 },
            },
          },
        ])
      : Promise.resolve([]),
    User.findById(auth.id)
      .select("responseRate chatInboundOpportunities completedSales")
      .lean(),
  ]);

  const byProduct = new Map<
    string,
    {
      views: number;
      chats: number;
      whatsappRequests: number;
      whatsappApproved: number;
      sold: number;
    }
  >();

  for (const row of agg) {
    const id = String(row._id.productId || "");
    if (!id) continue;
    const cur = byProduct.get(id) || {
      views: 0,
      chats: 0,
      whatsappRequests: 0,
      whatsappApproved: 0,
      sold: 0,
    };
    switch (row._id.type) {
      case "product_view":
        cur.views += row.count;
        break;
      case "chat_start":
        cur.chats += row.count;
        break;
      case "whatsapp_request":
        cur.whatsappRequests += row.count;
        break;
      case "whatsapp_approved":
        cur.whatsappApproved += row.count;
        break;
      case "listing_sold":
        cur.sold += row.count;
        break;
      default:
        break;
    }
    byProduct.set(id, cur);
  }

  const listings = products.map((p) => {
    const id = String(p._id);
    const stats = byProduct.get(id) || {
      views: 0,
      chats: 0,
      whatsappRequests: 0,
      whatsappApproved: 0,
      sold: 0,
    };
    return {
      productId: id,
      slug: p.slug || undefined,
      name: p.name,
      status: p.status,
      ...stats,
    };
  });

  const totals = listings.reduce(
    (acc, row) => {
      acc.views += row.views;
      acc.chats += row.chats;
      acc.whatsappRequests += row.whatsappRequests;
      acc.whatsappApproved += row.whatsappApproved;
      acc.sold += row.sold;
      return acc;
    },
    { views: 0, chats: 0, whatsappRequests: 0, whatsappApproved: 0, sold: 0 },
  );

  return NextResponse.json(
    {
      days,
      totals,
      responseRate: user?.responseRate ?? 0,
      responseSampleSize: user?.chatInboundOpportunities ?? 0,
      completedSales: user?.completedSales ?? 0,
      listings: listings.sort(
        (a, b) => b.views + b.chats * 3 - (a.views + a.chats * 3),
      ),
    },
    { status: 200 },
  );
}
