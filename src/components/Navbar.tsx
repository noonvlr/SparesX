"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useChatDockOptional } from "@/components/chat/ChatProvider";
import { openChatUi } from "@/components/chat/openChat";
import { announceChatOffline } from "@/lib/chat/announceOffline";

export default function Navbar() {
  const chatDock = useChatDockOptional();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [supportUnread, setSupportUnread] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const profileHref =
    userRole === "admin"
      ? "/admin/settings"
      : userRole === "technician"
        ? "/technician/profile"
        : "/login";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserRole(payload.role);
      } catch {
        setUserRole(null);
      }

      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.user?.name) setUserName(data.user.name);
          setProfilePicture(data.user?.profilePicture || null);
        })
        .catch(() => {});
    } else {
      setIsAuthenticated(false);
      setUserRole(null);
      setUserName(null);
      setProfilePicture(null);
    }
    setMobileMenuOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("nav")) setMobileMenuOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!profileOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [profileOpen]);

  // Admin support unread badge — poll + listen for inbox updates
  useEffect(() => {
    if (!isAuthenticated || userRole !== "admin") {
      setSupportUnread(0);
      return;
    }

    const fetchUnread = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("/api/admin/support/unread-count", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setSupportUnread(data.unreadCount || 0);
      } catch {
        // ignore transient errors
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);

    const onUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail?.unreadCount === "number") {
        setSupportUnread(detail.unreadCount);
      } else {
        fetchUnread();
      }
    };
    window.addEventListener("support-unread-updated", onUpdated);
    window.addEventListener("focus", fetchUnread);

    return () => {
      clearInterval(interval);
      window.removeEventListener("support-unread-updated", onUpdated);
      window.removeEventListener("focus", fetchUnread);
    };
  }, [isAuthenticated, userRole, pathname]);

  // Chat unread badge for any authenticated user
  useEffect(() => {
    if (!isAuthenticated) {
      setChatUnread(0);
      return;
    }

    const fetchUnread = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("/api/chat/unread-count", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setChatUnread(data.unreadTotal || 0);
      } catch {
        // ignore
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 12000);
    const onUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail?.unreadTotal === "number") {
        setChatUnread(detail.unreadTotal);
      } else {
        fetchUnread();
      }
    };
    window.addEventListener("chat-unread-updated", onUpdated);
    window.addEventListener("focus", fetchUnread);

    return () => {
      clearInterval(interval);
      window.removeEventListener("chat-unread-updated", onUpdated);
      window.removeEventListener("focus", fetchUnread);
    };
  }, [isAuthenticated, pathname]);

  async function handleLogout() {
    // Mark offline while auth token is still available
    await announceChatOffline();
    try {
      (globalThis as any).__sparesx_socket?.disconnect?.();
    } catch {
      // ignore
    }
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("sparesx-auth-changed"));
    setIsAuthenticated(false);
    setUserRole(null);
    setUserName(null);
    setProfilePicture(null);
    setSupportUnread(0);
    setChatUnread(0);
    setProfileOpen(false);
    router.push("/");
  }

  const openMessages = () => {
    if (chatDock?.openPanel) chatDock.openPanel();
    else openChatUi({});
  };

  const UnreadBadge = ({ count }: { count: number }) =>
    count > 0 ? (
      <span className="inline-flex items-center justify-center min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-green-500 text-white text-[10px] font-bold leading-none">
        {count > 99 ? "99+" : count}
      </span>
    ) : null;

  const initial = (userName || "U").charAt(0).toUpperCase();

  const Avatar = ({ className = "w-9 h-9" }: { className?: string }) =>
    profilePicture ? (
      <img
        src={profilePicture}
        alt={userName || "Profile"}
        className={`${className} rounded-full object-cover border border-blue-100 shadow-sm`}
      />
    ) : (
      <span
        className={`${className} rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-sm font-bold shadow-sm`}
      >
        {initial}
      </span>
    );

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl sm:text-2xl font-bold text-blue-600"
            >
              SparesX
            </Link>
            <div className="hidden md:ml-10 md:flex md:items-baseline md:space-x-4">
              <Link
                href="/products"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition"
              >
                Products
              </Link>
              <Link
                href="/requests"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition"
              >
                Requests
              </Link>
              <Link
                href="/support"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition"
              >
                Support
              </Link>
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={openMessages}
                  className="relative text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition inline-flex items-center gap-1.5"
                >
                  Messages
                  <UnreadBadge count={chatUnread} />
                </button>
              )}
              {isAuthenticated && userRole === "technician" && (
                <>
                  <Link
                    href="/technician/dashboard"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/technician/products"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition"
                  >
                    My Products
                  </Link>
                </>
              )}
              {isAuthenticated && userRole === "admin" && (
                <>
                  <Link
                    href="/admin/dashboard"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/products"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition"
                  >
                    Products
                  </Link>
                  <Link
                    href="/admin/requests"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition"
                  >
                    Requests
                  </Link>
                  <Link
                    href="/admin/technicians"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition"
                  >
                    Users
                  </Link>
                  <Link
                    href="/admin/device-management"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition"
                  >
                    Device Management
                  </Link>
                  <Link
                    href="/admin/support"
                    className="relative text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition inline-flex items-center gap-1.5"
                  >
                    Support Inbox
                    <UnreadBadge count={supportUnread} />
                  </Link>
                  <Link
                    href="/admin/chat"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition"
                  >
                    Chat disputes
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-3">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  Register
                </Link>
              </>
            ) : (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-gray-50 transition border border-transparent hover:border-gray-200"
                  aria-label="Open profile menu"
                >
                  <Avatar />
                  <svg
                    className={`w-4 h-4 text-gray-500 transition ${profileOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-3">
                      <Avatar className="w-10 h-10" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {userName || "Account"}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {userRole || "user"}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={profileHref}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        openMessages();
                      }}
                      className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <span className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                        Messages
                      </span>
                      <UnreadBadge count={chatUnread} />
                    </button>
                    <Link
                      href="/support"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                      Support
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated && (
              <Link href={profileHref} aria-label="Profile">
                <Avatar />
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 focus:outline-none transition-all duration-200"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              <svg
                className={`h-6 w-6 transition-transform duration-300 ${mobileMenuOpen ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {!mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden transition-all duration-300"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed right-0 top-16 h-auto max-h-[calc(100vh-4rem)] w-64 bg-white shadow-xl z-50 md:hidden transform transition-transform duration-300 ease-out overflow-y-auto rounded-l-2xl ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="px-3 py-4 space-y-2">
          <Link
            href="/products"
            className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
            onClick={() => setMobileMenuOpen(false)}
          >
            Products
          </Link>
          <Link
            href="/requests"
            className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
            onClick={() => setMobileMenuOpen(false)}
          >
            Requests
          </Link>
          <Link
            href="/support"
            className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
            onClick={() => setMobileMenuOpen(false)}
          >
            Support
          </Link>
          {isAuthenticated && (
            <button
              type="button"
              className="flex w-full items-center justify-between text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium"
              onClick={() => {
                setMobileMenuOpen(false);
                openMessages();
              }}
            >
              <span>Messages</span>
              <UnreadBadge count={chatUnread} />
            </button>
          )}
          {isAuthenticated && userRole === "technician" && (
            <div className="border-t border-gray-100 pt-2 mt-2">
              <p className="text-xs font-bold text-gray-400 px-3 py-1.5 uppercase tracking-wider">
                Technician
              </p>
              <Link
                href="/technician/dashboard"
                className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <button
                type="button"
                className="block w-full text-left text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openMessages();
                }}
              >
                Messages
              </button>
              <Link
                href="/technician/products"
                className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Products
              </Link>
              <Link
                href="/technician/profile"
                className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </Link>
            </div>
          )}
          {isAuthenticated && userRole === "admin" && (
            <div className="border-t border-gray-100 pt-2 mt-2">
              <p className="text-xs font-bold text-gray-400 px-3 py-1.5 uppercase tracking-wider">
                Admin
              </p>
              <Link
                href="/admin/dashboard"
                className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/products"
                className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                href="/admin/requests"
                className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Requests
              </Link>
              <Link
                href="/admin/users"
                className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Users
              </Link>
              <Link
                href="/admin/device-management"
                className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Device Management
              </Link>
              <Link
                href="/admin/settings"
                className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile / Settings
              </Link>
              <Link
                href="/admin/support"
                className="flex items-center justify-between text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>Support Inbox</span>
                <UnreadBadge count={supportUnread} />
              </Link>
              <Link
                href="/admin/chat"
                className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Chat disputes
              </Link>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2 mt-2">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/login"
                  className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block bg-blue-600 text-white hover:bg-blue-700 px-3 py-2.5 rounded-lg text-sm font-medium text-center mt-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            ) : (
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-red-600 text-white hover:bg-red-700 px-3 py-2.5 rounded-lg text-sm font-medium"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
