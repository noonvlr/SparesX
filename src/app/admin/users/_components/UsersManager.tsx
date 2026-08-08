"use client";
import { useState, useEffect } from "react";
import UsersList from "@/app/admin/users/_components/UsersList";
import UserDetailsModal from "@/app/admin/users/_components/UserDetailsModal";
import type { AdminUser } from "@/app/admin/users/_components/types";
import { AdminPage } from "@/components/layout";
import { Card, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { authFetch, getAccessToken } from "@/lib/auth/clientAuth";

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
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    whatsappNumber: "",
    address: "",
    pinCode: "",
    city: "",
    state: "",
    role: "technician" as "technician" | "admin",
  });

  const fetchUsers = async (query?: string, pageNum: number = 1) => {
    try {
      setLoading(true);
      if (!getAccessToken()) return;
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20",
      });
      if (query) {
        params.append("q", query);
      }

      const response = await authFetch(`/api/admin/users?${params}`);
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

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!getAccessToken()) return;
    setCreating(true);
    setCreateError("");
    try {
      const res = await authFetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...createForm,
          countryCode: "+91",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.message || "Failed to create user");
        return;
      }
      setShowCreate(false);
      setCreateForm({
        name: "",
        email: "",
        password: "",
        mobile: "",
        whatsappNumber: "",
        address: "",
        pinCode: "",
        city: "",
        state: "",
        role: "technician",
      });
      fetchUsers(searchQuery, 1);
    } catch {
      setCreateError("Failed to create user");
    } finally {
      setCreating(false);
    }
  }

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
    <AdminPage>
      <PageHeader
        title="User Management"
        description="Manage and monitor all system users"
        actions={
          <Button type="button" onClick={() => setShowCreate(true)}>
            + Create user
          </Button>
        }
      />

      <Card padding="lg" className="mb-8">
        <form onSubmit={handleSearch} className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              type="text"
              placeholder="Search by name, email, or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Search</Button>
            {searchQuery && (
              <Button type="button" variant="secondary" onClick={handleClearSearch}>
                Clear
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[var(--ink-secondary)]">
                Status:
              </span>
              <Select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "all" | "active" | "blocked",
                  )
                }
                size="sm"
                className="w-auto min-w-[120px]"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[var(--ink-secondary)]">
                Role:
              </span>
              <Select
                value={roleFilter}
                onChange={(e) =>
                  setRoleFilter(
                    e.target.value as "all" | "admin" | "technician",
                  )
                }
                size="sm"
                className="w-auto min-w-[140px]"
              >
                <option value="all">All</option>
                <option value="admin">Admin</option>
                <option value="technician">Technician</option>
              </Select>
            </div>
          </div>
        </form>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-[var(--radius)] bg-[var(--brand-soft)] border border-[var(--border)]">
            <p className="text-sm font-semibold text-[var(--brand-hover)] mb-2">
              Total Users
            </p>
            <p className="text-2xl font-bold text-[var(--ink)]">{stats.total}</p>
          </div>
          <div className="p-5 rounded-[var(--radius)] bg-[var(--success-soft)] border border-[var(--border)]">
            <p className="text-sm font-semibold text-[var(--success)] mb-2">
              Active
            </p>
            <p className="text-2xl font-bold text-[var(--ink)]">{stats.active}</p>
          </div>
          <div className="p-5 rounded-[var(--radius)] bg-[var(--danger-soft)] border border-[var(--border)]">
            <p className="text-sm font-semibold text-[var(--danger)] mb-2">
              Blocked
            </p>
            <p className="text-2xl font-bold text-[var(--ink)]">{stats.blocked}</p>
          </div>
          <div className="p-5 rounded-[var(--radius)] bg-[var(--info-soft)] border border-[var(--border)]">
            <p className="text-sm font-semibold text-[var(--info)] mb-2">
              Admins
            </p>
            <p className="text-2xl font-bold text-[var(--ink)]">{stats.admins}</p>
          </div>
        </div>
      </Card>

      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[var(--surface)] px-6 py-4 rounded-[var(--radius)] border border-[var(--border)]">
        <p className="text-sm text-[var(--ink-secondary)]">
          Showing{" "}
          <span className="font-semibold text-[var(--ink)]">
            {filteredUsers.length}
          </span>{" "}
          of <span className="font-semibold text-[var(--ink)]">{users.length}</span>{" "}
          users
        </p>
        <p className="text-xs text-[var(--muted)]">
          Click a row to view and edit details
        </p>
      </div>

      <UsersList
        users={filteredUsers}
        loading={loading}
        onUserClick={handleUserClick}
        page={page}
        totalPages={totalPages}
        onPageChange={(newPage: number) => fetchUsers(searchQuery, newPage)}
      />

      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={handleCloseModal}
          onUpdate={handleUserUpdate}
        />
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create user"
        sheet={false}
        className="sm:max-w-lg"
        footer={
          <Button
            type="submit"
            form="admin-create-user"
            loading={creating}
            className="w-full sm:w-auto"
          >
            Create account
          </Button>
        }
      >
        <form
          id="admin-create-user"
          onSubmit={handleCreateUser}
          className="space-y-3"
        >
          {createError && <Alert tone="danger">{createError}</Alert>}
          {(
            [
              ["name", "Full name"],
              ["email", "Email"],
              ["password", "Temp password"],
              ["mobile", "Mobile"],
              ["whatsappNumber", "WhatsApp"],
              ["address", "Address"],
              ["pinCode", "PIN code"],
              ["city", "City"],
              ["state", "State"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label} htmlFor={`create-${key}`} required>
              <Input
                id={`create-${key}`}
                type={
                  key === "password"
                    ? "password"
                    : key === "email"
                      ? "email"
                      : "text"
                }
                value={createForm[key]}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, [key]: e.target.value }))
                }
                required
                size="sm"
              />
            </Field>
          ))}
          <Field label="Role" htmlFor="create-role">
            <Select
              id="create-role"
              value={createForm.role}
              onChange={(e) =>
                setCreateForm((f) => ({
                  ...f,
                  role: e.target.value as "technician" | "admin",
                }))
              }
              size="sm"
            >
              <option value="technician">Technician</option>
              <option value="admin">Admin</option>
            </Select>
          </Field>
        </form>
      </Modal>
    </AdminPage>
  );
}
