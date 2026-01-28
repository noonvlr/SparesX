import { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse All Products",
  description:
    "Browse all mobile spare parts available on SparesX. Find displays, batteries, cameras, and more from verified sellers.",
  keywords: [
    "browse products",
    "all spare parts",
    "mobile parts catalog",
    "phone repair parts",
    "spare parts list",
  ],
  alternates: {
    canonical: "/browse",
  },
  openGraph: {
    title: "Browse All Products | SparesX",
    description:
      "Browse all mobile spare parts available on SparesX. Find displays, batteries, cameras, and more.",
    type: "website",
    url: "https://spares-x-h1cj.vercel.app/browse",
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse All Products | SparesX",
    description: "Browse all mobile spare parts available on SparesX.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BrowseLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
