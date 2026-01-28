import { redirect } from "next/navigation";

export default function SellerAddRedirect() {
  redirect("/technician/products/new");
}
