"use client";

import {
  useCallback,
  useEffect,
  useState,
  createContext,
  useContext,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebarNav } from "@/components/admin/AdminNav";
import {
  IconHome,
  IconLogout,
  IconMenu,
  IconPanelLeft,
} from "@/components/admin/AdminIcons";
import { AdminBreadcrumbs } from "@/components/admin/AdminPageChrome";
import { BrandMark } from "@/components/BrandMark";
import { Avatar } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  authFetch,
  clearAccessToken,
  getCachedRole,
  setCachedSessionUser,
} from "@/lib/auth/clientAuth";
import { cn } from "@/lib/ui/cn";

const COLLAPSE_KEY = "sparesx-admin-sidebar-collapsed";

type ShellCtx = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
};

const AdminShellContext = createContext<ShellCtx | null>(null);

export function useAdminShell() {
  return useContext(AdminShellContext);
}

/**
 * Persistent SaaS admin frame: fixed sidebar + topbar + mobile drawer.
 * Remains mounted across /admin/* navigations (layout-owned).
 */
export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [supportUnread, setSupportUnread] = useState(0);
  const [userName, setUserName] = useState("Admin");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [collapsed, setCollapsedState] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const setCollapsed = useCallback((v: boolean) => {
    setCollapsedState(v);
    try {
      localStorage.setItem(COLLAPSE_KEY, v ? "1" : "0");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      setCollapsedState(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (getCachedRole() && getCachedRole() !== "admin") return;
    let cancelled = false;
    (async () => {
      try {
        const [meRes, unreadRes] = await Promise.all([
          authFetch("/api/auth/me"),
          authFetch("/api/admin/support/unread-count"),
        ]);
        if (cancelled) return;
        if (meRes.ok) {
          const data = await meRes.json();
          if (data?.user?.name) setUserName(data.user.name);
          setProfilePicture(data?.user?.profilePicture || null);
        }
        if (unreadRes.ok) {
          const data = await unreadRes.json();
          if (typeof data.unreadCount === "number") {
            setSupportUnread(data.unreadCount);
          }
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const onLogout = async () => {
    try {
      await authFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    clearAccessToken();
    setCachedSessionUser(null);
    router.replace("/login");
  };

  const ctx: ShellCtx = {
    collapsed,
    setCollapsed,
    mobileOpen,
    setMobileOpen,
  };

  const sidebarWidth = collapsed ? "var(--admin-sidebar-collapsed)" : "var(--admin-sidebar-w)";

  return (
    <AdminShellContext.Provider value={ctx}>
      <div className="admin-app flex h-dvh min-h-0 overflow-hidden bg-[var(--admin-bg)] text-[var(--ink)]">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "relative z-30 hidden h-full shrink-0 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-sidebar)] transition-[width] duration-200 ease-[var(--ease)] motion-reduce:transition-none lg:flex",
            !hydrated && "w-[var(--admin-sidebar-w)]",
          )}
          style={hydrated ? { width: sidebarWidth } : undefined}
          aria-label="Admin navigation"
        >
          <div
            className={cn(
              "flex h-14 shrink-0 items-center border-b border-[var(--admin-border)]",
              collapsed ? "justify-center px-2" : "gap-2 px-4",
            )}
          >
            {collapsed ? (
              <Link
                href="/admin/dashboard"
                className="flex h-9 w-9 items-center justify-center rounded-[var(--admin-radius-sm)] bg-[var(--brand-soft)] text-sm font-bold text-[var(--brand-hover)]"
                title="SparesX Admin"
              >
                SX
              </Link>
            ) : (
              <div className="min-w-0 flex-1">
                <BrandMark href="/admin/dashboard" size="sm" />
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
                  Admin
                </p>
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <AdminSidebarNav
              supportUnread={supportUnread}
              collapsed={collapsed}
            />
          </div>

          <div
            className={cn(
              "shrink-0 border-t border-[var(--admin-border)] p-2",
              collapsed ? "space-y-1" : "space-y-2",
            )}
          >
            {!collapsed ? (
              <div className="flex items-center gap-2.5 rounded-[var(--admin-radius-sm)] px-2 py-1.5">
                <Avatar src={profilePicture} name={userName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[var(--ink)]">
                    {userName}
                  </p>
                  <p className="text-[11px] text-[var(--muted)]">Administrator</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-1" title={userName}>
                <Avatar src={profilePicture} name={userName} size="sm" />
              </div>
            )}
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "flex w-full items-center gap-2 rounded-[var(--admin-radius-sm)] px-2.5 py-2 text-[13px] text-[var(--ink-secondary)] hover:bg-[var(--surface-3)] hover:text-[var(--ink)]",
                collapsed && "justify-center",
              )}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand" : "Collapse"}
            >
              <IconPanelLeft />
              {!collapsed ? <span>Collapse</span> : null}
            </button>
            <button
              type="button"
              onClick={() => void onLogout()}
              className={cn(
                "flex w-full items-center gap-2 rounded-[var(--admin-radius-sm)] px-2.5 py-2 text-[13px] font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)]",
                collapsed && "justify-center",
              )}
              title="Logout"
            >
              <IconLogout />
              {!collapsed ? <span>Logout</span> : null}
            </button>
          </div>
        </aside>

        {/* Mobile drawer */}
        {mobileOpen ? (
          <div className="fixed inset-0 z-[var(--z-modal)] lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-[var(--overlay)]"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
            />
            <aside
              className="absolute inset-y-0 left-0 flex w-[min(18.5rem,88vw)] flex-col bg-[var(--admin-sidebar)] shadow-[var(--shadow-modal)] animate-in"
              role="dialog"
              aria-modal="true"
              aria-label="Admin menu"
            >
              <div className="flex h-14 items-center justify-between border-b border-[var(--admin-border)] px-4">
                <div>
                  <BrandMark href="/admin/dashboard" size="sm" />
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
                    Admin
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-2xl leading-none text-[var(--ink)] hover:bg-[var(--surface-3)]"
                  aria-label="Close menu"
                >
                  ×
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <AdminSidebarNav
                  supportUnread={supportUnread}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
              <div className="border-t border-[var(--admin-border)] p-3 space-y-1">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-[var(--admin-radius-sm)] px-2.5 py-2.5 text-[13px] text-[var(--ink-secondary)] hover:bg-[var(--surface-3)]"
                >
                  <IconHome />
                  View marketplace
                </Link>
                <button
                  type="button"
                  onClick={() => void onLogout()}
                  className="flex w-full items-center gap-2 rounded-[var(--admin-radius-sm)] px-2.5 py-2.5 text-[13px] font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                >
                  <IconLogout />
                  Logout
                </button>
              </div>
            </aside>
          </div>
        ) : null}

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-topbar)] px-3 sm:px-5">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--admin-radius-sm)] text-[var(--ink-secondary)] hover:bg-[var(--surface-3)] lg:hidden"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <IconMenu />
            </button>

            <AdminBreadcrumbs className="min-w-0 flex-1" />

            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
              <Link
                href="/"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-[var(--admin-radius-sm)] px-2.5 py-1.5 text-xs font-medium text-[var(--ink-secondary)] hover:bg-[var(--surface-3)] hover:text-[var(--ink)]"
              >
                <IconHome className="h-4 w-4" />
                Marketplace
              </Link>
              <ThemeToggle size="sm" />
              <div className="hidden sm:block">
                <Avatar src={profilePicture} name={userName} size="sm" />
              </div>
            </div>
          </header>

          <main className="admin-main min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto w-full max-w-[90rem] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminShellContext.Provider>
  );
}
