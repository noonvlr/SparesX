import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { RequestModel } from "@/lib/models/Request";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, category, brand, model, description } =
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
      model,
      description,
    });

    return NextResponse.json({ request }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to submit request." },
      { status: 500 },
    );
  }
}
