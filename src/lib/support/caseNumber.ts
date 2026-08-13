import mongoose from "mongoose";
import { Counter } from "@/lib/models/Counter";
import { SupportRequest } from "@/lib/models/SupportRequest";

export async function nextCaseNumber(): Promise<string> {
  const year = new Date().getUTCFullYear();
  const doc = await Counter.findOneAndUpdate(
    { key: `support-case-${year}` },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  );
  const seq = doc?.seq || 1;
  return `SPX-${year}-${String(seq).padStart(6, "0")}`;
}

export async function ensureCaseNumber(ticket: {
  _id: unknown;
  caseNumber?: string | null;
}): Promise<string> {
  if (ticket.caseNumber) return ticket.caseNumber;
  for (let attempt = 0; attempt < 3; attempt++) {
    const caseNumber = await nextCaseNumber();
    try {
      const id = new mongoose.Types.ObjectId(String(ticket._id));
      const updated = await SupportRequest.findOneAndUpdate(
        {
          _id: id,
          $or: [
            { caseNumber: { $exists: false } },
            { caseNumber: null },
            { caseNumber: "" },
          ],
        } as never,
        { $set: { caseNumber } },
        { new: true },
      );
      if (updated?.caseNumber) {
        ticket.caseNumber = updated.caseNumber;
        return updated.caseNumber;
      }
      const fresh = await SupportRequest.findById(id).select("caseNumber").lean();
      if (fresh?.caseNumber) {
        ticket.caseNumber = fresh.caseNumber;
        return fresh.caseNumber;
      }
    } catch {
      // unique collision — retry
    }
  }
  const fallback = `SPX-${new Date().getUTCFullYear()}-${String(ticket._id).slice(-6).toUpperCase()}`;
  ticket.caseNumber = fallback;
  return fallback;
}
