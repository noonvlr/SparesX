import { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Mobile Spare Parts",
  description:
    "Browse spare parts listed by verified technicians on SparesX. Filter by model and part type, check trust scores, and connect directly with sellers.",
  keywords: [
    "browse spare parts",
    "mobile parts India",
    "phone repair parts",
    "technician marketplace",
    "verified technician listings",
  ],
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "Browse Mobile Spare Parts | SparesX",
    description:
      "Verified technician listings with trust scores. Connect directly with sellers — SparesX does not process payments.",
    type: "website",
    url: "/products",
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Mobile Spare Parts | SparesX",
    description:
      "Browse verified technician listings and connect directly with sellers.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ProductsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
