import type { AdminNavIcon } from "@/lib/admin/nav";
import { cn } from "@/lib/ui/cn";

function Svg({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      className={cn("h-[18px] w-[18px] shrink-0", className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const stroke = { strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.75 };

export function AdminIcon({
  name,
  className,
}: {
  name: AdminNavIcon;
  className?: string;
}) {
  switch (name) {
    case "dashboard":
      return (
        <Svg className={className}>
          <path {...stroke} d="M4 4h7v7H4V4zm9 0h7v5h-7V4zM4 13h7v7H4v-7zm9 3h7v4h-7v-4z" />
        </Svg>
      );
    case "users":
      return (
        <Svg className={className}>
          <path {...stroke} d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="3.25" {...stroke} />
          <path {...stroke} d="M22 21v-2a3.5 3.5 0 00-2.5-3.35M16.5 3.7a3.25 3.25 0 010 6.3" />
        </Svg>
      );
    case "listings":
      return (
        <Svg className={className}>
          <path {...stroke} d="M4 6h16M4 12h16M4 18h10" />
        </Svg>
      );
    case "requests":
      return (
        <Svg className={className}>
          <path {...stroke} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <path {...stroke} d="M9 5a2 2 0 012-2h2a2 2 0 012 2v0a2 2 0 01-2 2h-2a2 2 0 01-2-2v0zM9 12h6M9 16h4" />
        </Svg>
      );
    case "support":
      return (
        <Svg className={className}>
          <path {...stroke} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </Svg>
      );
    case "devices":
      return (
        <Svg className={className}>
          <rect x="7" y="2.5" width="10" height="19" rx="2" {...stroke} />
          <path {...stroke} d="M11 18h2" />
        </Svg>
      );
    case "categories":
      return (
        <Svg className={className}>
          <path {...stroke} d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
        </Svg>
      );
    case "chat":
      return (
        <Svg className={className}>
          <path {...stroke} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
        </Svg>
      );
    case "broadcast":
      return (
        <Svg className={className}>
          <path {...stroke} d="M5 9v6M8 7v10M12 4v16M16 7v10M19 9v6" />
        </Svg>
      );
    case "ads":
      return (
        <Svg className={className}>
          <path {...stroke} d="M4 7h16v10H4zM8 7V5a1 1 0 011-1h6a1 1 0 011 1v2" />
          <path {...stroke} d="M9 12h6" />
        </Svg>
      );
    case "updates":
      return (
        <Svg className={className}>
          <path {...stroke} d="M12 8v4l2.5 2.5M21 12a9 9 0 11-3-6.7L21 8" />
        </Svg>
      );
    case "reports":
      return (
        <Svg className={className}>
          <path {...stroke} d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3" />
        </Svg>
      );
    case "settings":
      return (
        <Svg className={className}>
          <circle cx="12" cy="12" r="3" {...stroke} />
          <path {...stroke} d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </Svg>
      );
    case "disputes":
      return (
        <Svg className={className}>
          <path {...stroke} d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </Svg>
      );
    case "tools":
    default:
      return (
        <Svg className={className}>
          <path {...stroke} d="M14.7 6.3a4 4 0 015 5L12 19l-7-7 7.3-7.3a4 4 0 015 0z" />
        </Svg>
      );
  }
}

export function IconMenu({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path {...stroke} d="M4 7h16M4 12h16M4 17h16" />
    </Svg>
  );
}

export function IconPanelLeft({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" {...stroke} />
      <path {...stroke} d="M9 4v16" />
    </Svg>
  );
}

export function IconLogout({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path {...stroke} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
    </Svg>
  );
}

export function IconHome({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path {...stroke} d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" />
    </Svg>
  );
}

export function IconChevron({ className }: { className?: string }) {
  return (
    <Svg className={cn("h-3.5 w-3.5", className)}>
      <path {...stroke} d="M9 6l6 6-6 6" />
    </Svg>
  );
}
