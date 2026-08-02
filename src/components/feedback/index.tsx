import { cn } from "@/lib/ui/cn";
import { EmptyState } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

export { EmptyState, Alert, Spinner };

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-16",
        className,
      )}
    >
      <Alert tone="danger" title={title} className="max-w-md text-left mb-4 w-full">
        {description}
      </Alert>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function LoadingState({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-[var(--muted)]",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Spinner size="lg" label={label} />
      <p className="text-sm">{label}</p>
    </div>
  );
}
