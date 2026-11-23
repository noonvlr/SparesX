"use client";
import { useState, useEffect } from "react";
import UsersList from "@/app/admin/users/_components/UsersList";
import UserDetailsModal from "@/app/admin/users/_components/UserDetailsModal";
import type { AdminUser } from "@/app/admin/users/_components/types";
import { AdminPage } from "@/components/layout";
import { AdminPageHeader } from "@/components/admin/AdminPageChrome";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { authFetch, isLoggedInClient } from "@/lib/auth/clientAuth";
import {
  AdminFilterRow,
  AdminStatStrip,
  AdminToolbar,
} from "@/components/admin/AdminToolbar";

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
      if (!isLoggedInClient()) return;
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
    if (!isLoggedInClient()) return;
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
      <AdminPageHeader
        title="Users"
        description="Search, filter, create, and edit accounts"
        actions={
          <Button type="button" onClick={() => setShowCreate(true)}>
            Create user
          </Button>
        }
      />

      <AdminStatStrip
        items={[
          { label: "On this page", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Blocked", value: stats.blocked },
          { label: "Admins", value: stats.admins },
        ]}
      />

      <AdminToolbar>
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            type="text"
            placeholder="Search name, email, or mobile…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-w-0 flex-1"
            size="sm"
          />
          <div className="flex shrink-0 gap-2">
            <Button type="submit" size="sm">
              Search
            </Button>
            {searchQuery ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleClearSearch}
              >
                Clear
              </Button>
            ) : null}
          </div>
        </form>
        <AdminFilterRow>
          <Select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "active" | "blocked")
            }
            size="sm"
            aria-label="Filter by status"
            className="w-auto min-w-[7.5rem]"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </Select>
          <Select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value as "all" | "admin" | "technician")
            }
            size="sm"
            aria-label="Filter by role"
            className="w-auto min-w-[8.5rem]"
          >
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="technician">Technician</option>
          </Select>
          <p className="w-full text-xs text-[var(--muted)] sm:ml-auto sm:w-auto">
            Showing{" "}
            <span className="font-semibold text-[var(--ink)]">
              {filteredUsers.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-[var(--ink)]">{users.length}</span>
            · tap a row to edit
          </p>
        </AdminFilterRow>
      </AdminToolbar>

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
              {key === "password" ? (
                <PasswordInput
                  id={`create-${key}`}
                  value={createForm[key]}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  required
                  size="sm"
                  autoComplete="new-password"
                />
              ) : (
                <Input
                  id={`create-${key}`}
                  type={key === "email" ? "email" : "text"}
                  value={createForm[key]}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  required
                  size="sm"
                />
              )}
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
