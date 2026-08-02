import { redirect } from "next/navigation";

/** Legacy route — My requests now lives on /requests?tab=mine */
export default function MyRequestsRedirectPage() {
  redirect("/requests?tab=mine");
}
