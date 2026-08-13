import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report submitted",
  robots: { index: false, follow: false },
};

export default function SubmittedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
