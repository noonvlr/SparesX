import type { Metadata } from "next";
import PublicProfileClient from "./PublicProfileClient";

export const metadata: Metadata = {
  title: "User Profile | SparesX",
  description: "View seller profile, ratings, and listings on SparesX.",
  robots: { index: true, follow: true },
};

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PublicProfileClient userId={id} />;
}
