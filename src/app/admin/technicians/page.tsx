import { redirect } from "next/navigation";

export default function AdminTechniciansRedirect() {
  redirect("/admin/users");
}
