import { connectDB } from "@/lib/db/connect";
import { RequestModel } from "@/lib/models/Request";

/** Contact-free request shape, safe to render for anonymous visitors. */
export type PublicPartRequest = {
  _id: string;
  name: string;
  category: string;
  deviceCategory?: string;
  brand?: string;
  deviceModel?: string;
  description: string;
  status: string;
  createdAt: string;
  hasContact: boolean;
};

export type RequestFacet = { name: string; count: number };

/**
 * Top part categories currently in open requests (for browse filter chips).
 */
export async function fetchOpenRequestCategoryFacets(
  limit = 12,
): Promise<RequestFacet[]> {
  try {
    await connectDB();
    const rows = await RequestModel.aggregate<{
      _id: string;
      count: number;
      label: string;
    }>([
      {
        $match: {
          status: "open",
          category: { $exists: true, $nin: [null, ""] },
        },
      },
      {
        $group: {
          _id: { $toLower: { $trim: { input: "$category" } } },
          count: { $sum: 1 },
          label: { $first: "$category" },
        },
      },
      { $sort: { count: -1, label: 1 } },
      { $limit: Math.min(24, Math.max(1, limit)) },
    ]);

    return rows
      .filter((r) => r._id && r.label)
      .map((r) => ({
        name: String(r.label).trim(),
        count: r.count,
      }));
  } catch {
    return [];
  }
}

/**
 * Open part requests without contact details.
 *
 * Used to server-render the requests board so its content is crawlable; the
 * client re-fetches with the viewer's token to unlock contact actions.
 */
export async function fetchOpenRequests(
  opts: { limit?: number } = {},
): Promise<{
  requests: PublicPartRequest[];
  total: number;
  categoryFacets: RequestFacet[];
}> {
  try {
    await connectDB();

    const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
    const query = { status: "open" };

    const [total, docs, categoryFacets] = await Promise.all([
      RequestModel.countDocuments(query),
      RequestModel.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
      fetchOpenRequestCategoryFacets(12),
    ]);

    const requests: PublicPartRequest[] = docs.map(
      (doc: Record<string, any>) => ({
        _id: String(doc._id),
        name: doc.name || "Member",
        category: doc.category || "",
        deviceCategory: doc.deviceCategory || undefined,
        brand: doc.brand || undefined,
        deviceModel: doc.deviceModel || undefined,
        description: doc.description || "",
        status: doc.status || "open",
        createdAt: new Date(doc.createdAt).toISOString(),
        hasContact: Boolean(doc.email || doc.phone),
      }),
    );

    return { requests, total, categoryFacets };
  } catch {
    return { requests: [], total: 0, categoryFacets: [] };
  }
}
