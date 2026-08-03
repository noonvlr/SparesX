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
    const classes = cn(buttonVariants({ variant, size }), className);

    // Slot requires exactly one element child — never siblings (e.g. Spinner + Link).
    if (asChild) {
      return (
        <Slot
          ref={ref as React.Ref<HTMLElement>}
          className={classes}
          aria-busy={loading || undefined}
          aria-disabled={disabled || loading || undefined}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={classes}
        {...props}
      >
        {loading ? <Spinner size="sm" className="text-current" /> : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
