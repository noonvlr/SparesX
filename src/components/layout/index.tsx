"use client";

import { cn } from "@/lib/ui/cn";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/Card";
import { PageFade } from "@/components/ui/Motion";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  containerSize?: "sm" | "md" | "lg" | "xl" | "full";
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  flush?: boolean;
};

function PageShell({
  children,
  className,
  containerSize = "lg",
  title,
  description,
  actions,
  flush = false,
}: PageShellProps) {
  return (
    <PageFade>
      <div
        className={cn(
          "min-h-[50vh] bg-[var(--surface-2)]",
          flush ? "py-0" : "py-4 md:py-8",
          className,
        )}
      >
        <Container size={containerSize}>
          {title ? (
            <PageHeader
              title={title}
              description={description}
              actions={actions}
            />
          ) : null}
          {children}
        </Container>
      </div>
    </PageFade>
  );
}

export function MarketplacePage(props: PageShellProps) {
  return <PageShell containerSize="xl" {...props} />;
}

export function DashboardPage(props: PageShellProps) {
  return <PageShell containerSize="lg" {...props} />;
}

export function AuthPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <PageFade>
      <div
        className={cn(
          "min-h-[70vh] flex items-center justify-center bg-[var(--surface-2)] px-4 py-10",
          className,
        )}
      >
        <div className="w-full max-w-[var(--container-sm)]">{children}</div>
      </div>
    </PageFade>
  );
}

export function AdminPage(props: PageShellProps) {
  return <PageShell containerSize="xl" {...props} />;
}

export { Container, PageHeader };
