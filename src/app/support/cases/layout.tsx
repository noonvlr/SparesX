import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support cases",
  robots: { index: false, follow: false },
};

export default function CasesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
