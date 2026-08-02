"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import ToastHost from "@/components/ToastHost";
import VerificationBanner from "@/components/VerificationBanner";
import PasswordSetupBanner from "@/components/PasswordSetupBanner";
import { Avatar, Badge } from "@/components/ui/Card";
import { cn } from "@/lib/ui/cn";
import { useShellAuth } from "./useShellAuth";

const HIDE_SHELL_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/complete-profile",
];

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
    </svg>
  );
}

function IconChat({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function IconGrid({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 5h6v6H4V5zm10 0h6v6h-6V5zM4 13h6v6H4v-6zm10 0h6v6h-6v-6z" />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function IconBookmark({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 10a4 4 0 100-8 4 4 0 000 8zm12 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function IconMore({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zm0 6a.75.75 0 110-1.5.75.75 0 010 1.5zm0 6a.75.75 0 110-1.5.75.75 0 010 1.5z" />
    </svg>
  );
}

function UnreadCount({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <Badge
      tone="success"
      className="absolute -top-0.5 -right-0.5 min-w-[1.15rem] h-[1.15rem] px-1 py-0 justify-center text-[10px] font-bold leading-none bg-[var(--success)] text-white border-0"
    >
      {count > 99 ? "99+" : count}
    </Badge>
  );
}

type NavItem =
  | { kind: "link"; href: string; label: string; icon: ReactNode; badge?: number; match?: (path: string) => boolean }
  | { kind: "action"; label: string; icon: ReactNode; onClick: () => void; badge?: number };

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const auth = useShellAuth();
  const {
    isAuthenticated,
    userRole,
    userName,
    profilePicture,
    supportUnread,
    chatUnread,
    waPending,
    handleLogout,
    openMessages,
  } = auth;

  const hideShell = HIDE_SHELL_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );
  const isTechnician = userRole === "technician";
  const isAdminUser = isAuthenticated && userRole === "admin";

  const profileHref =
    userRole === "admin"
      ? "/admin/settings"
      : userRole === "technician"
        ? "/technician/profile"
        : isAuthenticated
          ? "/technician/profile"
          : "/login";

  const mobileItems: NavItem[] = (() => {
    if (isAdminUser) {
      return [
        { kind: "link", href: "/admin/dashboard", label: "Dashboard", icon: <IconGrid className="h-5 w-5" /> },
        { kind: "link", href: "/admin/users", label: "Users", icon: <IconUsers className="h-5 w-5" /> },
        { kind: "link", href: "/admin/products", label: "Listings", icon: <IconSearch className="h-5 w-5" /> },
        {
          kind: "link",
          href: "/admin/support",
          label: "Support",
          icon: <IconChat className="h-5 w-5" />,
          badge: supportUnread,
        },
        { kind: "link", href: "/admin/settings", label: "More", icon: <IconMore className="h-5 w-5" /> },
      ];
    }

    if (!isAuthenticated) {
      return [
        { kind: "link", href: "/", label: "Home", icon: <IconHome className="h-5 w-5" /> },
        { kind: "link", href: "/products", label: "Browse", icon: <IconSearch className="h-5 w-5" /> },
        {
          kind: "link",
          href: "/login",
          label: "Messages",
          icon: <IconChat className="h-5 w-5" />,
        },
        { kind: "link", href: "/register", label: "Sell", icon: <IconGrid className="h-5 w-5" /> },
        { kind: "link", href: "/login", label: "Profile", icon: <IconUser className="h-5 w-5" /> },
      ];
    }

    if (isTechnician) {
      return [
        { kind: "link", href: "/", label: "Home", icon: <IconHome className="h-5 w-5" /> },
        { kind: "link", href: "/products", label: "Browse", icon: <IconSearch className="h-5 w-5" /> },
        {
          kind: "action",
          label: "Messages",
          icon: <IconChat className="h-5 w-5" />,
          onClick: openMessages,
          badge: chatUnread,
        },
        {
          kind: "link",
          href: "/technician/dashboard",
          label: "Sell",
          icon: <IconGrid className="h-5 w-5" />,
        },
        {
          kind: "link",
          href: "/technician/profile",
          label: "Profile",
          icon: <IconUser className="h-5 w-5" />,
        },
      ];
    }

    // Buyer-like authenticated non-admin
    return [
      { kind: "link", href: "/", label: "Home", icon: <IconHome className="h-5 w-5" /> },
      { kind: "link", href: "/products", label: "Browse", icon: <IconSearch className="h-5 w-5" /> },
      {
        kind: "action",
        label: "Messages",
        icon: <IconChat className="h-5 w-5" />,
        onClick: openMessages,
        badge: chatUnread,
      },
      {
        kind: "link",
        href: "/dashboard/buyer/saved",
        label: "Saved",
        icon: <IconBookmark className="h-5 w-5" />,
      },
      {
        kind: "link",
        href: profileHref,
        label: "Profile",
        icon: <IconUser className="h-5 w-5" />,
      },
    ];
  })();

  const sidebarLinks: { href: string; label: string; badge?: number }[] = (() => {
    if (isAuthenticated && userRole === "admin") {
      return [
        { href: "/admin/dashboard", label: "Dashboard" },
        { href: "/admin/users", label: "Users" },
        { href: "/admin/products", label: "Listings" },
        { href: "/admin/requests", label: "Requests" },
        { href: "/admin/device-management", label: "Devices" },
        { href: "/admin/support", label: "Support", badge: supportUnread },
        { href: "/admin/chat", label: "Chat disputes" },
        { href: "/admin/site-settings", label: "Site settings" },
        { href: "/admin/settings", label: "Control center" },
      ];
    }

    const links: { href: string; label: string; badge?: number }[] = [
      { href: "/", label: "Home" },
      { href: "/products", label: "Products" },
      { href: "/requests", label: "Requests" },
    ];
    if (isAuthenticated && isTechnician) {
      links.splice(1, 0, { href: "/technician/dashboard", label: "Dashboard" });
      links.push({ href: "/technician/products", label: "My Products" });
    }
    if (isAuthenticated) {
      links.push({ href: "/dashboard/buyer/saved", label: "Saved" });
    }
    links.push({ href: "/support", label: "Support" });
    if (isAuthenticated) {
      links.push({ href: "/whatsapp-connect", label: "WhatsApp", badge: waPending });
    }
    return links;
  })();

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Minimal logo bar on auth/hide routes */}
      {hideShell && (
        <header className="sticky top-0 z-40 glass h-[var(--nav-h)] flex items-center px-4">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-[var(--brand)]"
          >
            SparesX
          </Link>
        </header>
      )}

      {/* Mobile top bar */}
      {!hideShell && (
        <header className="md:hidden sticky top-0 z-40 glass flex items-center justify-between gap-3 px-4 h-[var(--nav-h)]">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-[var(--brand)]"
          >
            SparesX
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/products"
              className="inline-flex items-center justify-center min-h-12 min-w-12 rounded-[var(--radius)] text-[var(--ink-secondary)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)] transition-colors"
              aria-label="Search products"
            >
              <IconSearch className="h-5 w-5" />
            </Link>
            <Link
              href={profileHref}
              className="inline-flex items-center justify-center min-h-12 min-w-12 rounded-full"
              aria-label="Profile"
            >
              {isAuthenticated ? (
                <Avatar src={profilePicture} name={userName || "U"} size="sm" />
              ) : (
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-hover)]">
                  <IconUser className="h-4 w-4" />
                </span>
              )}
            </Link>
          </div>
        </header>
      )}

      {/* Desktop sidebar */}
      {!hideShell && (
        <aside
          className="hidden md:flex fixed left-0 top-0 bottom-0 z-40 flex-col glass border-r border-[var(--border)] w-[var(--sidebar-w)]"
        >
          <div className="h-[var(--nav-h)] flex items-center px-5 shrink-0">
            <Link
              href="/"
              className="text-xl font-semibold tracking-tight text-[var(--brand)]"
            >
              SparesX
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
            {sidebarLinks.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-[var(--brand-soft)] text-[var(--brand-hover)]"
                      : "text-[var(--ink-secondary)] hover:bg-[var(--surface-3)] hover:text-[var(--ink)]",
                    userRole === "admin" && "py-2 text-[13px]",
                  )}
                >
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <Badge
                      tone="success"
                      className="min-w-[1.25rem] justify-center px-1.5 py-0 text-[10px] bg-[var(--success)] text-white border-0"
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </Badge>
                  ) : null}
                </Link>
              );
            })}

            {isAuthenticated && userRole !== "admin" && (
              <button
                type="button"
                onClick={openMessages}
                className="w-full flex items-center justify-between gap-2 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium text-[var(--ink-secondary)] hover:bg-[var(--surface-3)] hover:text-[var(--ink)] transition-colors"
              >
                <span>Messages</span>
                {chatUnread > 0 ? (
                  <Badge
                    tone="success"
                    className="min-w-[1.25rem] justify-center px-1.5 py-0 text-[10px] bg-[var(--success)] text-white border-0"
                  >
                    {chatUnread > 99 ? "99+" : chatUnread}
                  </Badge>
                ) : null}
              </button>
            )}
          </nav>

          <div className="shrink-0 border-t border-[var(--border)] p-3 space-y-1">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/login"
                  className="block rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium text-[var(--ink-secondary)] hover:bg-[var(--surface-3)]"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium text-center bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] transition-colors"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={profileHref}
                  className="flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 hover:bg-[var(--surface-3)] transition-colors"
                >
                  <Avatar src={profilePicture} name={userName || "U"} size="sm" />
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-semibold text-[var(--ink)] truncate">
                      {userName || "Account"}
                    </p>
                    <p className="text-xs text-[var(--muted)] capitalize">
                      {userRole || "user"}
                    </p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors text-left"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </aside>
      )}

      {/* Mobile bottom nav */}
      {!hideShell && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-[var(--border)] flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom,0px)] h-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom,0px))]"
          aria-label="Primary"
        >
          {mobileItems.map((item) => {
            if (item.kind === "action") {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className="relative flex flex-1 flex-col items-center justify-center gap-0.5 min-h-12 min-w-[48px] text-[10px] font-medium text-[var(--muted)] hover:text-[var(--brand)] transition-colors"
                >
                  <span className="relative inline-flex">
                    {item.icon}
                    <UnreadCount count={item.badge || 0} />
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            }

            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-0.5 min-h-12 min-w-[48px] text-[10px] font-medium transition-colors",
                  active
                    ? "text-[var(--brand)]"
                    : "text-[var(--muted)] hover:text-[var(--brand)]",
                )}
              >
                <span className="relative inline-flex">
                  {item.icon}
                  <UnreadCount count={item.badge || 0} />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}

      <ToastHost />

      <div
        className={cn(
          "flex flex-1 flex-col min-h-0",
          hideShell ? "app-main--flush" : "app-main",
        )}
      >
        <VerificationBanner />
        <PasswordSetupBanner />
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    </div>
  );
}
