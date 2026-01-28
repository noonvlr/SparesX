import { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Mobile Spare Parts",
  description:
    "Browse quality mobile spare parts from verified technicians on SparesX. Find genuine parts, compare prices, and buy with confidence.",
  keywords: [
    "browse spare parts",
    "mobile parts online",
    "phone repair parts",
    "technician marketplace",
    "buy spare parts",
  ],
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "Browse Mobile Spare Parts | SparesX",
    description:
      "Browse quality mobile spare parts from verified technicians. Find genuine parts and buy with confidence.",
    type: "website",
    url: "https://spares-x-h1cj.vercel.app/products",
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Mobile Spare Parts | SparesX",
    description: "Browse quality mobile spare parts from verified technicians.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ProductsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
