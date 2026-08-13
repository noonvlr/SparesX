import { User } from "@/lib/models/User";
import { createNotification } from "@/lib/notifications/create";

export async function notifyAdminsOfNewCase(params: {
  caseId: string;
  caseNumber: string;
  kindLabel: string;
  subject: string;
}) {
  try {
    const admins = await User.find({ role: "admin", isBlocked: { $ne: true } })
      .select("_id")
      .lean();
    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: String(admin._id),
          type: "system",
          title: `New ${params.kindLabel}`,
          body: `${params.caseNumber}: ${params.subject}`.slice(0, 400),
          href: `/admin/support/${params.caseId}`,
          meta: { ticketId: params.caseId, caseNumber: params.caseNumber },
          collapseKey: `support-new:${params.caseId}`,
        }),
      ),
    );
  } catch (err) {
    console.warn("[support] admin notify failed:", err);
  }
}
