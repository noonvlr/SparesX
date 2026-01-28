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
                    href="/admin/categories"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition"
                  >
                    Categories
                  </Link>
                  <Link
                    href="/admin/device-categories"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition"
                  >
                    Device Brands
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
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none transition-all duration-200"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              <span className="sr-only">Open menu</span>
              <svg
                className="h-6 w-6 transition-transform duration-300"
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
                    className="animate-spin-slow"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu with slide-down animation */}
      <div
        className={`md:hidden border-t border-gray-200 transition-all duration-300 ease-in-out overflow-hidden ${
          mobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 bg-gradient-to-b from-white to-gray-50">
          <Link
            href="/products"
            className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-all duration-200 hover:translate-x-1"
          >
            Products
          </Link>
          {isAuthenticated && userRole === "technician" && (
            <>
              <Link
                href="/technician/dashboard"
                className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-all duration-200 hover:translate-x-1"
              >
                Dashboard
              </Link>
              <Link
                href="/technician/products"
                className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-all duration-200 hover:translate-x-1"
              >
                My Products
              </Link>
            </>
          )}
          {isAuthenticated && userRole === "admin" && (
            <>
              <Link
                href="/admin/dashboard"
                className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-all duration-200 hover:translate-x-1"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/products"
                className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-all duration-200 hover:translate-x-1"
              >
                Products
              </Link>
              <Link
                href="/admin/technicians"
                className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-all duration-200 hover:translate-x-1"
              >
                Users
              </Link>
              <Link
                href="/admin/categories"
                className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-all duration-200 hover:translate-x-1"
              >
                Categories
              </Link>
              <Link
                href="/admin/device-categories"
                className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-all duration-200 hover:translate-x-1"
              >
                Device Brands
              </Link>
            </>
          )}
          {!isAuthenticated ? (
            <>
              <Link
                href="/login"
                className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-all duration-200 hover:translate-x-1"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="block bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-md text-base font-medium text-center transition-all duration-200 hover:shadow-lg mt-2"
              >
                Register
              </Link>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="block w-full text-left bg-red-600 text-white hover:bg-red-700 px-3 py-2 rounded-md text-base font-medium transition-all duration-200 hover:shadow-lg mt-2"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
