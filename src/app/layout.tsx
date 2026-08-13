import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import AppShell from "@/components/shell/AppShell";
import ChatShell from "@/components/chat/ChatShell";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import SentryClientInit from "@/components/SentryClientInit";
import { SITE_URL } from "@/lib/seo/site";

const siteUrl = SITE_URL;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F14" },
  ],
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
  // Do NOT set alternates.canonical here — Next merges it onto every child
  // page that omits its own, which made /terms, /privacy, etc. point at "/".
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
    <html lang="en" className={GeistSans.variable} suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col font-sans bg-[var(--surface-2)] text-[var(--ink)]">
        <ThemeProvider>
          <SentryClientInit />
          <ChatShell>
            <AppShell>{children}</AppShell>
          </ChatShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
