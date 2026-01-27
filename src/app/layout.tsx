import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
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
    type: "website",
    locale: "en_US",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
      </head>
      <body className="antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
