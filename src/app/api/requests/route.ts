import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { RequestModel } from "@/lib/models/Request";
import { verifyJwt } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status") || "open";
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");

    const query: Record<string, unknown> = {};
    if (status !== "all") query.status = status;
    if (category) query.category = category;
    if (brand) query.brand = { $regex: brand, $options: "i" };
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { deviceModel: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    const total = await RequestModel.countDocuments(query);
    const requests = await RequestModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Hide contact details from anonymous users
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    let isAuthenticated = false;
    if (token) {
      try {
        verifyJwt(token);
        isAuthenticated = true;
      } catch {
        isAuthenticated = false;
      }
    }

    const sanitized = requests.map((item) => {
      if (isAuthenticated) return item;
      const { email, phone, ...rest } = item as any;
      return {
        ...rest,
        email: undefined,
        phone: undefined,
        hasContact: !!(email || phone),
      };
    });

    return NextResponse.json(
      {
        requests: sanitized,
        total,
        page,
        pages: Math.ceil(total / limit),
        isAuthenticated,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch requests.", requests: [], total: 0 },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, category, brand, model, deviceModel, description } =
      await req.json();

    if (!name || !email || !category || !description) {
      return NextResponse.json(
        { message: "Name, email, category, and description are required." },
        { status: 400 },
      );
    }

    await connectDB();
    const request = await RequestModel.create({
      name,
      email,
      phone,
      category,
      brand,
      deviceModel: deviceModel || model || "",
      description,
      status: "open",
    });

    return NextResponse.json({ request }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to submit request." },
      { status: 500 },
    );
  }
}
