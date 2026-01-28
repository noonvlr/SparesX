import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

const siteUrl = "https://spares-x-h1cj.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SparesX – Mobile Spare Parts Marketplace",
    template: "%s | SparesX",
  },
  description:
    "India's premier B2B marketplace for mobile spare parts. Connect with verified technicians, buy genuine parts & tools. Quality assured, fast delivery nationwide.",
  keywords: [
    "mobile spare parts",
    "technician marketplace",
    "phone parts",
    "mobile repair",
    "spare parts seller",
  ],
  authors: [{ name: "SparesX Team" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SparesX – Mobile Spare Parts Marketplace",
    description:
      "India's premier B2B marketplace for mobile spare parts. Connect with verified technicians, buy genuine parts & tools.",
    url: siteUrl,
    siteName: "SparesX",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "SparesX – Mobile Spare Parts Marketplace",
    description:
      "India's premier B2B marketplace for mobile spare parts. Connect with verified technicians.",
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
