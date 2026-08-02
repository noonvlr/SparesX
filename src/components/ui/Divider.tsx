import { cn } from "@/lib/ui/cn";

export function Divider({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  if (label) {
    return (
      <div className={cn("flex items-center gap-3", className)} role="separator">
        <div className="h-px flex-1 bg-[var(--divider)]" />
        <span className="text-tiny text-[var(--muted)] uppercase tracking-wide">
          {label}
        </span>
        <div className="h-px flex-1 bg-[var(--divider)]" />
      </div>
    );
  }
  return (
    <hr
      className={cn("border-0 h-px bg-[var(--divider)]", className)}
      role="separator"
    />
  );
}
