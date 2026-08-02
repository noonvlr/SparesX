import { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse All Products",
  description:
    "Browse spare parts from verified technicians on SparesX. Filter by model and part type and connect directly with sellers.",
  keywords: [
    "browse products",
    "all spare parts",
    "mobile parts catalog",
    "phone repair parts",
    "verified technician listings",
  ],
  alternates: {
    canonical: "/browse",
  },
  openGraph: {
    title: "Browse All Products | SparesX",
    description:
      "Browse verified technician listings by model and part type. Connect directly — SparesX does not process payments.",
    type: "website",
    url: "https://spares-x-h1cj.vercel.app/browse",
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse All Products | SparesX",
    description: "Browse verified technician spare-part listings on SparesX.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BrowseLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
