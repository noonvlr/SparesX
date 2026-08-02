"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

const ease = [0.22, 1, 0.36, 1] as const;

export function FadeIn({
  className,
  children,
  delay = 0,
  ...props
}: Omit<HTMLMotionProps<"div">, "children"> & {
  delay?: number;
  children?: ReactNode;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function PageFade({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={cn("w-full", className)}>{children}</div>;
  }
  return (
    <motion.div
      className={cn("w-full", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease }}
    >
      {children}
    </motion.div>
  );
}

export { motion, useReducedMotion };
