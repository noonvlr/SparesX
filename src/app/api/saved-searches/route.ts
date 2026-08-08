import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { isAuthError, requireUser } from "@/lib/auth/requireUser";
import {
  SavedSearch,
  MAX_SAVED_SEARCHES,
  buildQueryString,
  filtersHaveCriteria,
  labelFromFilters,
  normalizeFilters,
} from "@/lib/models/SavedSearch";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  try {
    await connectDB();
    const rows = await SavedSearch.find({ userId: auth.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      searches: rows.map((row) => ({
        _id: String(row._id),
        name: row.name,
        filters: row.filters || {},
        queryString: row.queryString,
        href: row.queryString ? `/products?${row.queryString}` : "/products",
        lastNotifiedAt: row.lastNotifiedAt || null,
        createdAt: row.createdAt,
      })),
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to load saved searches" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  try {
    const body = await req.json();
    const filters = normalizeFilters(body.filters || body || {});
    if (!filtersHaveCriteria(filters)) {
      return NextResponse.json(
        { message: "Add at least one filter before saving a search." },
        { status: 400 },
      );
    }

    const queryString = buildQueryString(filters);
    const name =
      (typeof body.name === "string" && body.name.trim()) ||
      labelFromFilters(filters);

    await connectDB();
    const count = await SavedSearch.countDocuments({ userId: auth.id });
    if (count >= MAX_SAVED_SEARCHES) {
      return NextResponse.json(
        {
          message: `You can save up to ${MAX_SAVED_SEARCHES} searches. Remove one first.`,
        },
        { status: 400 },
      );
    }

    const existing = await SavedSearch.findOne({
      userId: auth.id,
      queryString,
    }).lean();
    if (existing) {
      return NextResponse.json(
        {
          message: "You already saved this search.",
          search: {
            _id: String(existing._id),
            name: existing.name,
            queryString: existing.queryString,
            href: `/products?${existing.queryString}`,
          },
        },
        { status: 200 },
      );
    }

    const created = await SavedSearch.create({
      userId: auth.id,
      name: name.slice(0, 80),
      filters,
      queryString,
    });

    return NextResponse.json(
      {
        message: "Search saved. We'll notify you when matching listings appear.",
        search: {
          _id: String(created._id),
          name: created.name,
          filters: created.filters,
          queryString: created.queryString,
          href: `/products?${created.queryString}`,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: "Failed to save search" },
      { status: 500 },
    );
  }
}
