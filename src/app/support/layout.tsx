import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Contact SparesX support for bugs, abuse reports, account help, and marketplace questions.",
  alternates: { canonical: "/support" },
  robots: { index: true, follow: true },
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
