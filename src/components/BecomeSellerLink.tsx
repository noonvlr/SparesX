"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * "Become a seller" — register if logged out, add-product if logged in.
 */
export default function BecomeSellerLink({
  className,
  children = "Become a seller",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const [href, setHref] = useState("/register");

  useEffect(() => {
    const sync = () => {
      const token = localStorage.getItem("token");
      setHref(token ? "/technician/products/new" : "/register");
    };
    sync();
    window.addEventListener("sparesx-auth-changed", sync);
    return () => window.removeEventListener("sparesx-auth-changed", sync);
  }, []);

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
