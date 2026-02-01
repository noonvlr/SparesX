"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserRole(payload.role);
      } catch (e) {
        setUserRole(null);
      }
    }
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("nav")) {
        setMobileMenuOpen(false);
      }
    };
    const handleTouchOutside = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("nav")) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("touchstart", handleTouchOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("touchstart", handleTouchOutside);
    };
  }, [mobileMenuOpen]);

  function handleLogout() {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUserRole(null);
    router.push("/");
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Menu */}
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
                </>
              )}
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-4">
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
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Logout
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 focus:outline-none transition-all duration-200"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              <span className="sr-only">Open menu</span>
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

      {/* Mobile Menu Overlay - Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden transition-all duration-300"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide Menu - Sleek Sidebar with Rounded Corners */}
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
          {isAuthenticated && userRole === "technician" && (
            <>
              <div className="border-t border-gray-100 pt-2 mt-2">
                <p className="text-xs font-bold text-gray-400 px-3 py-1.5 uppercase tracking-wider">
                  Technician
                </p>
                <Link
                  href="/technician/dashboard"
                  className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/technician/products"
                  className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Products
                </Link>
              </div>
            </>
          )}
          {isAuthenticated && userRole === "admin" && (
            <>
              <div className="border-t border-gray-100 pt-2 mt-2">
                <p className="text-xs font-bold text-gray-400 px-3 py-1.5 uppercase tracking-wider">
                  Admin
                </p>
                <Link
                  href="/admin/dashboard"
                  className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/products"
                  className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Products
                </Link>
                <Link
                  href="/admin/technicians"
                  className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Users
                </Link>
                <Link
                  href="/admin/device-management"
                  className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Device Management
                </Link>
              </div>
            </>
          )}
          <div className="border-t border-gray-100 pt-2 mt-2">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/login"
                  className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block bg-blue-600 text-white hover:bg-blue-700 px-3 py-2.5 rounded-lg text-sm font-medium text-center transition-all duration-200 hover:shadow-lg mt-1"
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
                className="w-full bg-red-600 text-white hover:bg-red-700 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg"
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
