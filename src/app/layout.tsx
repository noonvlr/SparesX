import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import AppShell from "@/components/shell/AppShell";
import ChatShell from "@/components/chat/ChatShell";

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
    "Marketplace for mobile repair technicians to list, find, and request spare parts. Verified listings, trust scores, and direct connections with sellers.",
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
      "List, find, and request spare parts with verified technicians. Connect directly — SparesX does not process payments.",
    url: siteUrl,
    siteName: "SparesX",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "SparesX – Mobile Spare Parts Marketplace",
    description:
      "Verified technician listings, trust scores, and direct seller connections for mobile spare parts.",
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
    <html lang="en" className={GeistSans.variable}>
      <body className="antialiased min-h-screen flex flex-col font-sans">
        <ChatShell>
          <AppShell>{children}</AppShell>
        </ChatShell>
      </body>
    </html>
  );
}
