"use client";
import type { AdminUser } from "@/app/admin/users/_components/types";

interface UsersListProps {
  users: AdminUser[];
  loading: boolean;
  onUserClick: (user: AdminUser) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function UsersList({
  users,
  loading,
  onUserClick,
  page,
  totalPages,
  onPageChange,
}: UsersListProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center justify-center">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 animate-spin"></div>
            </div>
          </div>
        </div>
        <p className="text-gray-600 font-medium text-lg">Loading users...</p>
        <p className="text-gray-500 text-sm mt-2">Please wait a moment</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
        <p className="text-gray-900 font-semibold text-lg">No users found</p>
        <p className="text-gray-500 text-sm mt-2">
          Try adjusting your filters or search criteria
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {users.map((user) => (
          <button
            key={user._id}
            onClick={() => onUserClick(user)}
            className="w-full text-left p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition duration-200 active:bg-blue-100"
          >
            <div className="flex items-center gap-3 mb-3">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center ring-2 ring-blue-100">
                  <span className="text-blue-700 font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  {user.name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {user.email}
                </div>
              </div>
              <span className="text-gray-400 text-lg flex-shrink-0">›</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-gray-600">
                <span className="font-medium">Phone:</span> {user.countryCode}{" "}
                {user.mobile}
              </div>
              <div className="text-gray-600">
                <span className="font-medium">Location:</span> {user.city},{" "}
                {user.state}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                  user.role === "admin"
                    ? "bg-purple-100 text-purple-700 ring-1 ring-purple-200"
                    : "bg-blue-100 text-blue-700 ring-1 ring-blue-200"
                }`}
              >
                {user.role}
              </span>
              <span
                className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                  user.isBlocked
                    ? "bg-red-100 text-red-700 ring-1 ring-red-200"
                    : "bg-green-100 text-green-700 ring-1 ring-green-200"
                }`}
              >
                {user.isBlocked ? "Blocked" : "Active"}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                Mobile
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                Location
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                Role
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                Joined
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">
                View
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr
                key={user._id}
                onClick={() => onUserClick(user)}
                className="hover:bg-blue-50 cursor-pointer transition duration-150 border-l-4 border-transparent hover:border-l-blue-500"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center ring-2 ring-blue-100">
                        <span className="text-blue-700 font-bold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-gray-900 leading-tight">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                  {user.countryCode} {user.mobile}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {user.city}, {user.state}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ring-1 ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-700 ring-purple-200"
                        : "bg-blue-100 text-blue-700 ring-blue-200"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ring-1 ${
                      user.isBlocked
                        ? "bg-red-100 text-red-700 ring-red-200"
                        : "bg-green-100 text-green-700 ring-green-200"
                    }`}
                  >
                    {user.isBlocked ? "Blocked" : "Active"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-6 py-4 text-right text-sm font-semibold text-blue-600 hover:text-blue-700">
                  View ›
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-5 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <p className="text-sm font-medium text-gray-700">
            Page <span className="font-bold text-gray-900">{page}</span> of{" "}
            <span className="font-bold text-gray-900">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
