"use client";
import { useState, useEffect } from "react";
import UsersList from "@/app/admin/users/_components/UsersList";
import UserDetailsModal from "@/app/admin/users/_components/UserDetailsModal";
import type { AdminUser } from "@/app/admin/users/_components/types";

export default function UsersManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "blocked"
  >("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "technician">(
    "all",
  );
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async (query?: string, pageNum: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20",
      });
      if (query) {
        params.append("q", query);
      }

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setTotalPages(data.pagination.pages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchQuery, 1);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    fetchUsers("", 1);
  };

  const handleUserClick = (user: AdminUser) => {
    setSelectedUser(user);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
  };

  const handleUserUpdate = (updatedUser: AdminUser) => {
    setUsers(users.map((u) => (u._id === updatedUser._id ? updatedUser : u)));
    setSelectedUser(updatedUser);
  };

  const filteredUsers = users.filter((user) => {
    if (statusFilter === "active" && user.isBlocked) return false;
    if (statusFilter === "blocked" && !user.isBlocked) return false;
    if (roleFilter !== "all" && user.role !== roleFilter) return false;
    return true;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => !u.isBlocked).length,
    blocked: users.filter((u) => u.isBlocked).length,
    admins: users.filter((u) => u.role === "admin").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          User Management
        </h1>
        <p className="text-gray-600">Manage and monitor all system users</p>
      </div>

      {/* Search & Filters Card */}
      <div className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
        <form onSubmit={handleSearch} className="flex flex-col gap-6">
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative group">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, or mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg transition"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition duration-200 transform hover:scale-105"
            >
              Search
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "all" | "active" | "blocked",
                  )
                }
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) =>
                  setRoleFilter(
                    e.target.value as "all" | "admin" | "technician",
                  )
                }
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="all">All</option>
                <option value="admin">Admin</option>
                <option value="technician">Technician</option>
              </select>
            </div>
          </div>
        </form>

        {/* Stats Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Users */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-blue-700">Total Users</p>
              <div className="p-2 bg-blue-200 rounded-lg">
                <svg
                  className="w-5 h-5 text-blue-700"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v2h8v-2zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-2a4 4 0 00-8 0v2a2 2 0 002 2h4a2 2 0 002-2z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
          </div>

          {/* Active Users */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-green-700">Active</p>
              <div className="p-2 bg-green-200 rounded-lg">
                <svg
                  className="w-5 h-5 text-green-700"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-green-900">{stats.active}</p>
          </div>

          {/* Blocked Users */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-red-700">Blocked</p>
              <div className="p-2 bg-red-200 rounded-lg">
                <svg
                  className="w-5 h-5 text-red-700"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M13.477 14.89A6 6 0 015.11 2.697m8.368 12.192a6 6 0 00-8.367-8.367m0 0a6.003 6.003 0 016.367 6.367"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-red-900">{stats.blocked}</p>
          </div>

          {/* Admins */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-purple-700">Admins</p>
              <div className="p-2 bg-purple-200 rounded-lg">
                <svg
                  className="w-5 h-5 text-purple-700"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M13 7H7v6h6V7z"></path>
                  <path
                    fillRule="evenodd"
                    d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2V2a1 1 0 112 0v1a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2v1a1 1 0 11-2 0v-1h-2v1a1 1 0 11-2 0v-1a2 2 0 01-2-2v-2H3a1 1 0 110-2h1V9H3a1 1 0 010-2h1V5a2 2 0 012-2v-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-purple-900">{stats.admins}</p>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white bg-opacity-60 backdrop-blur px-6 py-4 rounded-xl border border-gray-200">
        <p className="text-sm text-gray-700">
          Showing{" "}
          <span className="font-semibold text-gray-900">
            {filteredUsers.length}
          </span>{" "}
          of <span className="font-semibold text-gray-900">{users.length}</span>{" "}
          users
        </p>
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
            <path
              fillRule="evenodd"
              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clipRule="evenodd"
            />
          </svg>
          Click a row to view and edit details
        </p>
      </div>

      {/* Users List */}
      <UsersList
        users={filteredUsers}
        loading={loading}
        onUserClick={handleUserClick}
        page={page}
        totalPages={totalPages}
        onPageChange={(newPage: number) => fetchUsers(searchQuery, newPage)}
      />

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={handleCloseModal}
          onUpdate={handleUserUpdate}
        />
      )}
    </div>
  );
}
