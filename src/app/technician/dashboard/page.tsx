import Link from "next/link";
import type { Metadata } from "next";
import DashboardStats from "./_components/DashboardStats";

export const metadata: Metadata = {
  title: "Technician Dashboard - SparesX",
  description: "Manage your spare part listings and profile on SparesX.",
};

export default function TechnicianDashboard() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 md:p-8">
      <section className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-5xl font-bold text-gray-900 mb-2 md:mb-3">
            Technician Dashboard
          </h1>
          <p className="text-gray-600 text-sm md:text-lg leading-relaxed">
            Manage your spare part listings and seller profile.
          </p>
        </div>

        {/* Main Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {/* My Products Card */}
          <Link
            href="/technician/products"
            className="group relative bg-white rounded-xl shadow-md border border-gray-200 p-3 md:p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mb-2">
                <svg
                  className="w-5 h-5 text-blue-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h3 className="text-sm md:text-base font-bold text-gray-900 mb-2">
                My Products
              </h3>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-700 transition">
                  View <span>→</span>
                </p>
              </div>
            </div>
          </Link>

          {/* Messages Card */}
          <Link
            href="/messages"
            className="group relative bg-white rounded-xl shadow-md border border-gray-200 p-3 md:p-4 hover:shadow-lg hover:border-emerald-300 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center mb-2">
                <svg
                  className="w-5 h-5 text-emerald-700"
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
              </div>
              <h3 className="text-sm md:text-base font-bold text-gray-900 mb-2">
                Messages
              </h3>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 hover:text-emerald-700 transition">
                  Inbox <span>→</span>
                </p>
              </div>
            </div>
          </Link>

          {/* Add New Product Card */}
          <Link
            href="/technician/products/new"
            className="group relative bg-white rounded-xl shadow-md border border-gray-200 p-3 md:p-4 hover:shadow-lg hover:border-green-300 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center mb-2">
                <svg
                  className="w-5 h-5 text-green-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h3 className="text-sm md:text-base font-bold text-gray-900 mb-2">
                Add Product
              </h3>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-green-600 font-semibold flex items-center gap-1 hover:text-green-700 transition">
                  Create <span>→</span>
                </p>
              </div>
            </div>
          </Link>

          {/* Profile Card */}
          <Link
            href="/technician/profile"
            className="group relative bg-white rounded-xl shadow-md border border-gray-200 p-3 md:p-4 hover:shadow-lg hover:border-purple-300 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center mb-2">
                <svg
                  className="w-5 h-5 text-purple-700"
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
              </div>
              <h3 className="text-sm md:text-base font-bold text-gray-900 mb-2">
                Profile
              </h3>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-purple-600 font-semibold flex items-center gap-1 hover:text-purple-700 transition">
                  Edit <span>→</span>
                </p>
              </div>
            </div>
          </Link>
        </div>

        <DashboardStats />

        {/* Quick Tips - Hidden on mobile, visible on md+ */}
        <div className="hidden md:block bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Quick Tips to Boost Sales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-700">
                1
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  Add High-Quality Photos
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Clear images help buyers decide faster and increase inquiries.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-green-700">
                2
              </div>
              <div>
                <p className="font-semibold text-gray-900">Be Responsive</p>
                <p className="text-sm text-gray-600 mt-1">
                  Reply to enquiries quickly to build trust and close deals.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-purple-700">
                3
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  Competitive Pricing
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Research market prices to ensure your listings are
                  competitive.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-indigo-700">
                4
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  Detailed Descriptions
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Clear details about condition, specs, and compatibility
                  matter.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
