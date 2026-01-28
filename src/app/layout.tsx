import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

const siteUrl =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SparesX - Mobile Spare Parts Marketplace",
    template: "%s | SparesX",
  },
  description:
    "The premier marketplace for mobile technicians to buy and sell genuine spare parts. Quality parts, verified sellers, seamless transactions.",
  keywords: [
    "mobile spare parts",
    "technician marketplace",
    "phone parts",
    "mobile repair",
    "spare parts seller",
  ],
  authors: [{ name: "SparesX Team" }],
  openGraph: {
    title: "SparesX - Mobile Spare Parts Marketplace",
    description:
      "Marketplace for mobile technicians to buy and sell spare parts",
    url: siteUrl,
    siteName: "SparesX",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SparesX - Mobile Spare Parts Marketplace",
    description:
      "Marketplace for mobile technicians to buy and sell spare parts",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
