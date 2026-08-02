"use client";

import { Slot } from "@radix-ui/react-slot";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";
import { Spinner } from "@/components/ui/Spinner";
import {
  buttonVariants,
  type ButtonVariantProps,
} from "@/components/ui/button-variants";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      type = "button",
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {loading ? <Spinner size="sm" className="text-current" /> : null}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
