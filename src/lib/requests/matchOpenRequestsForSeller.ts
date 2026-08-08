import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { RequestModel } from "@/lib/models/Request";

export type SellerDemandItem = {
  requestId: string;
  category: string;
  brand?: string;
  deviceModel?: string;
  deviceCategory?: string;
  description: string;
  createdAt: string;
  score: number;
  reasons: string[];
  href: string;
};

function norm(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

/**
 * Find open part requests that roughly match a seller's approved inventory.
 * No requester PII (email/phone) — sellers use the public board to engage.
 */
export async function matchOpenRequestsForSeller(
  sellerId: string,
  limit = 8,
): Promise<SellerDemandItem[]> {
  await connectDB();
  const capped = Math.min(20, Math.max(1, limit));

  const products = await Product.find({
    technician: sellerId,
    status: "approved",
  })
    .select("brand partType category deviceCategory deviceModel")
    .lean();

  if (products.length === 0) return [];

  const brands = new Set(
    products.map((p) => norm(p.brand)).filter((v) => v.length >= 2),
  );
  const parts = new Set(
    products
      .map((p) => norm(p.partType || p.category))
      .filter((v) => v.length >= 2),
  );
  const models = new Set(
    products.map((p) => norm(p.deviceModel)).filter((v) => v.length >= 2),
  );
  const devices = new Set(
    products.map((p) => norm(p.deviceCategory)).filter((v) => v.length >= 2),
  );

  if (brands.size === 0 && parts.size === 0) return [];

  const openRequests = await RequestModel.find({ status: "open" })
    .select(
      "category brand deviceModel deviceCategory description createdAt userId",
    )
    .sort({ createdAt: -1 })
    .limit(120)
    .lean();

  const scored: SellerDemandItem[] = [];

  for (const req of openRequests) {
    // Don't show the seller their own requests
    if (req.userId && String(req.userId) === String(sellerId)) continue;

    let score = 0;
    const reasons: string[] = [];
    const brand = norm(req.brand);
    const category = norm(req.category);
    const model = norm(req.deviceModel);
    const device = norm(req.deviceCategory);

    if (brand && brands.has(brand)) {
      score += 30;
      reasons.push("Brand in your stock");
    }
    if (category && [...parts].some((p) => category.includes(p) || p.includes(category))) {
      score += 25;
      reasons.push("Part type match");
    }
    if (model && [...models].some((m) => model.includes(m) || m.includes(model))) {
      score += 25;
      reasons.push("Model match");
    }
    if (device && devices.has(device)) {
      score += 15;
      reasons.push("Device type match");
    }

    if (score < 30) continue;

    scored.push({
      requestId: String(req._id),
      category: req.category || "Part request",
      brand: req.brand || undefined,
      deviceModel: req.deviceModel || undefined,
      deviceCategory: req.deviceCategory || undefined,
      description: String(req.description || "").slice(0, 180),
      createdAt: new Date(req.createdAt).toISOString(),
      score,
      reasons,
      href: "/requests",
    });
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return scored.slice(0, capped);
}
