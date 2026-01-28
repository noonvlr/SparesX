import { redirect } from "next/navigation";

export default function SellerDashboardRedirect() {
  redirect("/technician/dashboard");
}
