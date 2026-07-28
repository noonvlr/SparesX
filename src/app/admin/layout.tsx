import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminGate from "@/components/admin/AdminGate";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminGate>{children}</AdminGate>;
}
