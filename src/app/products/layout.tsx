import { ReactNode } from "react";

export const metadata = {
  title: "Browse Products | SparesX",
  description: "Find quality spare parts from verified technicians",
};

export default function ProductsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
