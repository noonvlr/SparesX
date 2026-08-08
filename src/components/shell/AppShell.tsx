"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Footer from "@/components/Footer";
import ToastHost from "@/components/ToastHost";
import VerificationBanner from "@/components/VerificationBanner";
import PasswordSetupBanner from "@/components/PasswordSetupBanner";
import { Avatar, Badge } from "@/components/ui/Card";
import { ThemeToggle, ThemeCycleButton } from "@/components/theme/ThemeToggle";
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
  | {
      kind: "link";
      href: string;
      label: string;
      icon: ReactNode;
      badge?: number;
    }
  | {
      kind: "action";
      label: string;
      icon: ReactNode;
      onClick: () => void;
      badge?: number;
      active?: boolean;
    };

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
    notifUnread,
    handleLogout,
    openMessages,
  } = auth;

  const [desktopProfileOpen, setDesktopProfileOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const desktopProfileRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    setDesktopProfileOpen(false);
    setMobileProfileOpen(false);
    setMobileMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!desktopProfileOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!desktopProfileRef.current?.contains(e.target as Node)) {
        setDesktopProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [desktopProfileOpen]);

  useEffect(() => {
    if (!mobileProfileOpen && !mobileMoreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileProfileOpen(false);
        setMobileMoreOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileProfileOpen, mobileMoreOpen]);

  const openMobileProfile = () => {
    if (!isAuthenticated) return;
    setMobileMoreOpen(false);
    setMobileProfileOpen(true);
  };

  const openMobileMore = () => {
    setMobileProfileOpen(false);
    setMobileMoreOpen((v) => !v);
  };

  const onLogout = async () => {
    setDesktopProfileOpen(false);
    setMobileProfileOpen(false);
    setMobileMoreOpen(false);
    await handleLogout();
  };

  type MoreLink = {
    href?: string;
    label: string;
    icon: ReactNode;
    badge?: number;
    onClick?: () => void;
    danger?: boolean;
  };

  const moreLinks: MoreLink[] = (() => {
    if (isAdminUser) {
      return [
        { href: "/admin/requests", label: "Requests", icon: <IconGrid className="h-5 w-5" /> },
        { href: "/admin/device-management", label: "Devices", icon: <IconSearch className="h-5 w-5" /> },
        { href: "/admin/chat", label: "Chat disputes", icon: <IconChat className="h-5 w-5" /> },
        { href: "/admin/disputes", label: "Dispute SOP", icon: <IconMore className="h-5 w-5" /> },
        { href: "/admin/site-settings", label: "Site settings", icon: <IconMore className="h-5 w-5" /> },
        { href: "/admin/settings", label: "Control center", icon: <IconUser className="h-5 w-5" /> },
        {
          label: "Logout",
          icon: <IconUser className="h-5 w-5" />,
          onClick: () => void onLogout(),
          danger: true,
        },
      ];
    }
    if (!isAuthenticated) {
      return [
        { href: "/login", label: "Login", icon: <IconUser className="h-5 w-5" /> },
        { href: "/register", label: "Register", icon: <IconGrid className="h-5 w-5" /> },
        { href: "/requests", label: "Requests", icon: <IconBookmark className="h-5 w-5" /> },
        { href: "/support", label: "Support", icon: <IconChat className="h-5 w-5" /> },
      ];
    }
    const links: MoreLink[] = [
      { href: profileHref, label: "Profile", icon: <IconUser className="h-5 w-5" /> },
    ];
    if (isTechnician) {
      links.push({
        href: "/technician/products",
        label: "My Products",
        icon: <IconGrid className="h-5 w-5" />,
      });
    }
    links.push(
      { href: "/requests", label: "Requests", icon: <IconBookmark className="h-5 w-5" /> },
      {
        href: "/dashboard/buyer/saved",
        label: "Saved",
        icon: <IconBookmark className="h-5 w-5" />,
      },
      {
        href: "/whatsapp-connect",
        label: "WhatsApp",
        icon: <IconChat className="h-5 w-5" />,
        badge: waPending,
      },
      {
        href: "/notifications",
        label: "Notifications",
        icon: <IconBookmark className="h-5 w-5" />,
        badge: notifUnread,
      },
      { href: "/support", label: "Support", icon: <IconChat className="h-5 w-5" /> },
      {
        label: "Logout",
        icon: <IconUser className="h-5 w-5" />,
        onClick: () => void onLogout(),
        danger: true,
      },
    );
    return links;
  })();

  const mobileItems: NavItem[] = (() => {
    if (isAdminUser) {
      return [
        {
          kind: "link",
          href: "/admin/dashboard",
          label: "Dashboard",
          icon: <IconGrid className="h-5 w-5" />,
        },
        {
          kind: "link",
          href: "/admin/users",
          label: "Users",
          icon: <IconUsers className="h-5 w-5" />,
        },
        {
          kind: "link",
          href: "/admin/products",
          label: "Listings",
          icon: <IconSearch className="h-5 w-5" />,
        },
        {
          kind: "link",
          href: "/admin/support",
          label: "Support",
          icon: <IconChat className="h-5 w-5" />,
          badge: supportUnread,
        },
        {
          kind: "action",
          label: "More",
          icon: <IconMore className="h-5 w-5" />,
          onClick: openMobileMore,
          active: mobileMoreOpen,
        },
      ];
    }

    if (!isAuthenticated) {
      return [
        { kind: "link", href: "/", label: "Home", icon: <IconHome className="h-5 w-5" /> },
        {
          kind: "link",
          href: "/products",
          label: "Browse",
          icon: <IconSearch className="h-5 w-5" />,
        },
        {
          kind: "link",
          href: "/login",
          label: "Messages",
          icon: <IconChat className="h-5 w-5" />,
        },
        {
          kind: "link",
          href: "/register",
          label: "Sell",
          icon: <IconGrid className="h-5 w-5" />,
        },
        {
          kind: "action",
          label: "More",
          icon: <IconMore className="h-5 w-5" />,
          onClick: openMobileMore,
          active: mobileMoreOpen,
        },
      ];
    }

    if (isTechnician) {
      return [
        { kind: "link", href: "/", label: "Home", icon: <IconHome className="h-5 w-5" /> },
        {
          kind: "link",
          href: "/products",
          label: "Browse",
          icon: <IconSearch className="h-5 w-5" />,
        },
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
          label: "Dashboard",
          icon: <IconGrid className="h-5 w-5" />,
        },
        {
          kind: "action",
          label: "More",
          icon: <IconMore className="h-5 w-5" />,
          onClick: openMobileMore,
          active: mobileMoreOpen,
        },
      ];
    }

    return [
      { kind: "link", href: "/", label: "Home", icon: <IconHome className="h-5 w-5" /> },
      {
        kind: "link",
        href: "/products",
        label: "Browse",
        icon: <IconSearch className="h-5 w-5" />,
      },
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
        kind: "action",
        label: "More",
        icon: <IconMore className="h-5 w-5" />,
        onClick: openMobileMore,
        active: mobileMoreOpen,
      },
    ];
  })();

  const topLinks: { href: string; label: string; badge?: number }[] = (() => {
    if (isAuthenticated && userRole === "admin") {
      return [
        { href: "/admin/dashboard", label: "Dashboard" },
        { href: "/admin/users", label: "Users" },
        { href: "/admin/products", label: "Listings" },
        { href: "/admin/requests", label: "Requests" },
        { href: "/admin/device-management", label: "Devices" },
        { href: "/admin/support", label: "Support", badge: supportUnread },
        { href: "/admin/chat", label: "Chat disputes" },
        { href: "/admin/disputes", label: "Dispute SOP" },
        { href: "/admin/site-settings", label: "Site settings" },
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
      links.push({ href: "/whatsapp-connect", label: "WhatsApp", badge: waPending });
      links.push({
        href: "/notifications",
        label: "Notifications",
        badge: notifUnread,
      });
    }
    links.push({ href: "/support", label: "Support" });
    return links;
  })();

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {hideShell && (
        <header className="sticky top-0 z-40 glass h-[var(--nav-h)] relative flex items-center justify-center px-4">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-[var(--brand)]"
          >
            SparesX
          </Link>
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <ThemeToggle size="sm" />
          </div>
        </header>
      )}

      {/* Desktop top navbar */}
      {!hideShell && (
        <header className="hidden md:block sticky top-0 z-40 glass-nav">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[var(--nav-h)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-6 min-w-0">
              <Link
                href="/"
                className="text-xl font-semibold tracking-tight text-[var(--brand)] shrink-0"
              >
                SparesX
              </Link>
              <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
                {topLinks.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-[var(--radius)] px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                        active
                          ? "bg-[var(--brand-soft)] text-[var(--brand-hover)]"
                          : "text-[var(--ink-secondary)] hover:bg-[var(--surface-3)] hover:text-[var(--ink)]",
                      )}
                    >
                      {item.label}
                      {item.badge && item.badge > 0 ? (
                        <Badge
                          tone="success"
                          className="min-w-[1.15rem] justify-center px-1 py-0 text-[10px] bg-[var(--success)] text-white border-0"
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
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-[var(--radius)] px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                      "text-[var(--ink-secondary)] hover:bg-[var(--surface-3)] hover:text-[var(--ink)]",
                    )}
                  >
                    Messages
                    {chatUnread > 0 ? (
                      <Badge
                        tone="success"
                        className="min-w-[1.15rem] justify-center px-1 py-0 text-[10px] bg-[var(--success)] text-white border-0"
                      >
                        {chatUnread > 99 ? "99+" : chatUnread}
                      </Badge>
                    ) : null}
                  </button>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <ThemeToggle size="sm" />
              {isAuthenticated && userRole !== "admin" ? (
                <Link
                  href="/notifications"
                  className="relative rounded-[var(--radius)] p-2 text-[var(--ink-secondary)] hover:bg-[var(--surface-3)] hover:text-[var(--ink)]"
                  aria-label="Notifications"
                >
                  <IconBookmark className="h-5 w-5" />
                  <UnreadCount count={notifUnread} />
                </Link>
              ) : null}
              {!isAuthenticated ? (
                <>
                  <Link
                    href="/login"
                    className="rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-[var(--ink-secondary)] hover:bg-[var(--surface-3)]"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-[var(--radius)] px-3.5 py-2 text-sm font-semibold bg-[var(--brand)] text-[var(--primary-foreground)] hover:bg-[var(--brand-hover)] transition-colors"
                  >
                    Register
                  </Link>
                </>
              ) : (
                <div className="relative" ref={desktopProfileRef}>
                  <button
                    type="button"
                    onClick={() => setDesktopProfileOpen((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-full p-1 pr-2.5 hover:bg-[var(--surface-3)] transition-colors"
                    aria-expanded={desktopProfileOpen}
                    aria-haspopup="menu"
                  >
                    <Avatar src={profilePicture} name={userName || "U"} size="sm" />
                    <span className="text-sm font-medium text-[var(--ink)] max-w-[9rem] truncate">
                      {userName || "Account"}
                    </span>
                  </button>
                  {desktopProfileOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-56 rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-[var(--dropdown-bg)] shadow-[var(--shadow-dropdown)] py-1.5 z-[var(--z-dropdown)] glass"
                    >
                      <div className="px-3 py-2 border-b border-[var(--divider)]">
                        <p className="text-sm font-semibold text-[var(--ink)] truncate">
                          {userName || "Account"}
                        </p>
                        <p className="text-xs text-[var(--muted)] capitalize">
                          {userRole || "user"}
                        </p>
                      </div>
                      <Link
                        href={profileHref}
                        role="menuitem"
                        className="block px-3 py-2.5 text-sm text-[var(--ink-secondary)] hover:bg-[var(--surface-3)] hover:text-[var(--ink)]"
                        onClick={() => setDesktopProfileOpen(false)}
                      >
                        Profile
                      </Link>
                      {userRole === "admin" && (
                        <Link
                          href="/admin/settings"
                          role="menuitem"
                          className="block px-3 py-2.5 text-sm text-[var(--ink-secondary)] hover:bg-[var(--surface-3)] hover:text-[var(--ink)]"
                          onClick={() => setDesktopProfileOpen(false)}
                        >
                          Control center
                        </Link>
                      )}
                      <div className="border-t border-[var(--divider)] my-1 pt-1">
                        <p className="px-3 py-1 text-tiny uppercase tracking-wide text-[var(--muted)]">
                          Theme
                        </p>
                        <ThemeToggle showLabels className="px-1" />
                      </div>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => void onLogout()}
                        className="w-full text-left px-3 py-2.5 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)] border-t border-[var(--divider)] mt-1"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Mobile top bar */}
      {!hideShell && (
        <header className="md:hidden sticky top-0 z-40 glass-nav relative flex items-center justify-between gap-3 px-4 h-[var(--nav-h)]">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-[var(--brand)]"
          >
            SparesX
          </Link>
          <div className="flex items-center gap-1">
            <ThemeCycleButton />
            <Link
              href="/products"
              className="inline-flex items-center justify-center min-h-12 min-w-12 rounded-[var(--radius)] text-[var(--ink-secondary)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)] transition-colors"
              aria-label="Search products"
            >
              <IconSearch className="h-5 w-5 opacity-[var(--icon-opacity-inactive)]" />
            </Link>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={openMobileProfile}
                className="inline-flex items-center justify-center min-h-12 min-w-12 rounded-full"
                aria-label="Account menu"
                aria-expanded={mobileProfileOpen}
              >
                <Avatar src={profilePicture} name={userName || "U"} size="sm" />
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center min-h-12 min-w-12 rounded-full"
                aria-label="Login"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-hover)]">
                  <IconUser className="h-4 w-4" />
                </span>
              </Link>
            )}
          </div>

          {/* Mobile profile dropdown — opens under top bar (top of screen) */}
          {mobileProfileOpen && isAuthenticated && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-[45] bg-transparent"
                aria-label="Close account menu"
                onClick={() => setMobileProfileOpen(false)}
              />
              <div
                role="menu"
                className="absolute right-3 top-[calc(100%-4px)] z-[50] w-64 rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-[var(--dropdown-bg)] shadow-[var(--shadow-dropdown)] py-1.5 animate-in glass"
              >
                <div className="px-3 py-2.5 border-b border-[var(--divider)] flex items-center gap-3">
                  <Avatar src={profilePicture} name={userName || "U"} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--ink)] truncate">
                      {userName || "Account"}
                    </p>
                    <p className="text-xs text-[var(--muted)] capitalize">
                      {userRole || "user"}
                    </p>
                  </div>
                </div>
                <Link
                  href={profileHref}
                  role="menuitem"
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-[var(--ink)] hover:bg-[var(--surface-3)] min-h-11"
                  onClick={() => setMobileProfileOpen(false)}
                >
                  <IconUser className="h-4 w-4 opacity-[var(--icon-opacity-inactive)]" />
                  View profile
                </Link>
                {isTechnician && (
                  <Link
                    href="/technician/dashboard"
                    role="menuitem"
                    className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-[var(--ink)] hover:bg-[var(--surface-3)] min-h-11"
                    onClick={() => setMobileProfileOpen(false)}
                  >
                    <IconGrid className="h-4 w-4 opacity-[var(--icon-opacity-inactive)]" />
                    Dashboard
                  </Link>
                )}
                {userRole === "admin" && (
                  <Link
                    href="/admin/settings"
                    role="menuitem"
                    className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-[var(--ink)] hover:bg-[var(--surface-3)] min-h-11"
                    onClick={() => setMobileProfileOpen(false)}
                  >
                    <IconMore className="h-4 w-4 opacity-[var(--icon-opacity-inactive)]" />
                    Control center
                  </Link>
                )}
                <div className="border-t border-[var(--divider)] my-1 pt-1">
                  <p className="px-3 py-1 text-tiny uppercase tracking-wide text-[var(--muted)]">
                    Theme
                  </p>
                  <ThemeToggle showLabels className="px-1 pb-1" />
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void onLogout()}
                  className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-[var(--danger)] hover:bg-[var(--danger-soft)] min-h-11 border-t border-[var(--divider)]"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
                    />
                  </svg>
                  Logout
                </button>
              </div>
            </>
          )}
        </header>
      )}

      {/* Mobile bottom nav */}
      {!hideShell && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-nav border-t border-[var(--border)] flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom,0px)] h-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom,0px))]"
          aria-label="Primary"
        >
          {mobileItems.map((item) => {
            if (item.kind === "action") {
              const active = !!item.active;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
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

      {/* Mobile More sheet — remaining nav items */}
      {mobileMoreOpen && !hideShell && (
        <div className="md:hidden fixed inset-0 z-[var(--z-modal)]">
          <button
            type="button"
            className="absolute inset-0 bg-[var(--overlay)]"
            aria-label="Close more menu"
            onClick={() => setMobileMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[var(--radius-xl)] bg-[var(--surface-elevated)] shadow-[var(--shadow-modal)] border-t border-[var(--border)] pb-[env(safe-area-inset-bottom,0px)] animate-in">
            <div className="flex justify-center pt-3 pb-1">
              <span className="h-1 w-10 rounded-full bg-[var(--border-strong)]" />
            </div>
            <p className="px-5 pb-2 text-sm font-semibold text-[var(--ink)]">
              More
            </p>
            <div className="px-3 pb-2 border-b border-[var(--divider)] mb-1">
              <p className="px-2 py-1 text-tiny uppercase tracking-wide text-[var(--muted)]">
                Theme
              </p>
              <ThemeToggle showLabels />
            </div>
            <div className="px-3 pb-3 space-y-0.5 max-h-[50dvh] overflow-y-auto">
              {moreLinks.map((item) => {
                const className = cn(
                  "flex w-full items-center gap-3 rounded-[var(--radius)] px-3 py-3.5 text-sm font-medium min-h-12",
                  item.danger
                    ? "text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                    : "text-[var(--ink)] hover:bg-[var(--surface-3)]",
                );
                if (item.onClick) {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={className}
                      onClick={() => {
                        setMobileMoreOpen(false);
                        item.onClick?.();
                      }}
                    >
                      <span className="opacity-[var(--icon-opacity-inactive)]">
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  );
                }
                return (
                  <Link
                    key={`${item.label}-${item.href}`}
                    href={item.href || "/"}
                    className={className}
                    onClick={() => setMobileMoreOpen(false)}
                  >
                    <span className="opacity-[var(--icon-opacity-inactive)]">
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && item.badge > 0 ? (
                      <Badge
                        tone="success"
                        className="min-w-[1.25rem] justify-center px-1.5 py-0 text-[10px] bg-[var(--success)] text-[var(--ink-inverse)] border-0"
                      >
                        {item.badge > 99 ? "99+" : item.badge}
                      </Badge>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
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
