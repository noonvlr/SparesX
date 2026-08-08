import { redirect } from "next/navigation";

/** Buyer hub folded into technician dashboard — avoid stale fake stats. */
export default function BuyerDashboardPage() {
  redirect("/technician/dashboard");
}
