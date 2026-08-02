"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
    handleLogout,
    openMessages,
  } = auth;

  const [desktopProfileOpen, setDesktopProfileOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
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
    if (!mobileProfileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileProfileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileProfileOpen]);

  const openMobileProfile = () => {
    if (!isAuthenticated) return;
    setMobileProfileOpen(true);
  };

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
          label: "Profile",
          icon: <IconUser className="h-5 w-5" />,
          onClick: openMobileProfile,
          active: mobileProfileOpen || isActivePath(pathname, profileHref),
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
          kind: "link",
          href: "/login",
          label: "Profile",
          icon: <IconUser className="h-5 w-5" />,
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
          label: "Sell",
          icon: <IconGrid className="h-5 w-5" />,
        },
        {
          kind: "action",
          label: "Profile",
          icon: <IconUser className="h-5 w-5" />,
          onClick: openMobileProfile,
          active: mobileProfileOpen || isActivePath(pathname, profileHref),
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
        label: "Profile",
        icon: <IconUser className="h-5 w-5" />,
        onClick: openMobileProfile,
        active: mobileProfileOpen || isActivePath(pathname, profileHref),
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
    }
    links.push({ href: "/support", label: "Support" });
    return links;
  })();

  const onLogout = async () => {
    setDesktopProfileOpen(false);
    setMobileProfileOpen(false);
    await handleLogout();
  };

  return (
    <div className="flex flex-1 flex-col min-h-0">
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
                    className="rounded-[var(--radius)] px-3.5 py-2 text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] transition-colors"
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
                      className="absolute right-0 mt-2 w-56 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)] py-1.5 z-50"
                    >
                      <div className="px-3 py-2 border-b border-[var(--border)]">
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
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => void onLogout()}
                        className="w-full text-left px-3 py-2.5 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)]"
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
            <Link
              href="/products"
              className="inline-flex items-center justify-center min-h-12 min-w-12 rounded-[var(--radius)] text-[var(--ink-secondary)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)] transition-colors"
              aria-label="Search products"
            >
              <IconSearch className="h-5 w-5" />
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
                className="absolute right-3 top-[calc(100%-4px)] z-[50] w-64 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)] py-1.5 animate-in"
              >
                <div className="px-3 py-2.5 border-b border-[var(--border)] flex items-center gap-3">
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
                  <IconUser className="h-4 w-4 text-[var(--muted)]" />
                  View profile
                </Link>
                {isTechnician && (
                  <Link
                    href="/technician/dashboard"
                    role="menuitem"
                    className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-[var(--ink)] hover:bg-[var(--surface-3)] min-h-11"
                    onClick={() => setMobileProfileOpen(false)}
                  >
                    <IconGrid className="h-4 w-4 text-[var(--muted)]" />
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
                    <IconMore className="h-4 w-4 text-[var(--muted)]" />
                    Control center
                  </Link>
                )}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void onLogout()}
                  className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-[var(--danger)] hover:bg-[var(--danger-soft)] min-h-11"
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
