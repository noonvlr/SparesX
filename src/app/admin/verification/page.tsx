import { redirect } from "next/navigation";

/** Admin verification queue is user flags on Users — not a separate KYC product. */
export default function AdminVerificationRedirect() {
  redirect("/admin/users");
}
