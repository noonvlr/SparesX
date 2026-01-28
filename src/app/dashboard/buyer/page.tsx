import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Buyer Dashboard - SparesX",
  description: "Track your enquiries, requests, and saved parts on SparesX.",
  openGraph: {
    title: "Buyer Dashboard - SparesX",
    description: "Track your enquiries, requests, and saved parts on SparesX.",
    type: "website",
  },
};

export default function BuyerDashboardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <section className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Buyer Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your enquiries, requests, and saved parts.
          </p>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* My Requests Card */}
          <Link
            href="/dashboard/buyer/requests"
            className="group relative bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                My Requests
              </h3>
              <p className="text-sm text-gray-600">
                Review requests you have submitted for specific parts.
              </p>
            </div>
          </Link>

          {/* Enquiries Card */}
          <Link
            href="/dashboard/buyer/enquiries"
            className="group relative bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl hover:border-green-300 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-green-700"
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Enquiries
              </h3>
              <p className="text-sm text-gray-600">
                Track conversations and offers from sellers.
              </p>
            </div>
          </Link>

          {/* Saved Parts Card */}
          <Link
            href="/dashboard/buyer/saved"
            className="group relative bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl hover:border-purple-300 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-purple-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Saved Parts
              </h3>
              <p className="text-sm text-gray-600">
                Quickly revisit listings you saved.
              </p>
            </div>
          </Link>

          {/* Profile Card */}
          <Link
            href="/dashboard/buyer/profile"
            className="group relative bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl hover:border-indigo-300 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-indigo-700"
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">Profile</h3>
              <p className="text-sm text-gray-600">
                Update contact details for faster responses.
              </p>
            </div>
          </Link>
        </div>

        {/* Quick Stats Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Quick Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-blue-700">
                  Active Requests
                </p>
                <div className="p-2 bg-blue-200 rounded-lg">
                  <svg
                    className="w-5 h-5 text-blue-700"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 1 1 0 100 2H3a1 1 0 00-1 1v12a1 1 0 001 1h14a1 1 0 001-1V6a1 1 0 00-1-1h-3a1 1 0 100 2h2v11H4V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-blue-900">0</p>
              <p className="text-xs text-blue-600 mt-2">No pending requests</p>
            </div>

            <div className="p-5 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-green-700">
                  Saved Items
                </p>
                <div className="p-2 bg-green-200 rounded-lg">
                  <svg
                    className="w-5 h-5 text-green-700"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path>
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-green-900">0</p>
              <p className="text-xs text-green-600 mt-2">Start saving parts</p>
            </div>

            <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-purple-700">
                  Open Chats
                </p>
                <div className="p-2 bg-purple-200 rounded-lg">
                  <svg
                    className="w-5 h-5 text-purple-700"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0L10 9.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-purple-900">0</p>
              <p className="text-xs text-purple-600 mt-2">Start enquiries</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
