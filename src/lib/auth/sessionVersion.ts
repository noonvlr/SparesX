import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";

/** Invalidate all outstanding JWTs for this user by bumping sessionVersion. */
export async function bumpSessionVersion(userId: string): Promise<number> {
  await connectDB();
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { sessionVersion: 1 } },
    { new: true, select: "sessionVersion" },
  ).lean();
  return user?.sessionVersion ?? 0;
}
