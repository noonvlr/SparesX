"use client";
import type { AdminUser } from "@/app/admin/users/_components/types";
import TrustBadges from "@/components/TrustBadges";
import { Card, Badge, EmptyState, Avatar } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";

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
      <Card padding="lg" className="text-center">
        <div className="flex justify-center mb-4">
          <Spinner size="lg" className="text-[var(--brand)]" />
        </div>
        <p className="text-[var(--ink-secondary)] font-medium">Loading users...</p>
        <p className="text-[var(--muted)] text-sm mt-2">Please wait a moment</p>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <EmptyState
          title="No users found"
          description="Try adjusting your filters or search criteria"
        />
      </Card>
    );
  }

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-[var(--divider)]">
        {users.map((user) => (
          <button
            key={user._id}
            onClick={() => onUserClick(user)}
            className="w-full text-left p-4 hover:bg-[var(--brand-soft)] transition duration-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <Avatar src={user.profilePicture} name={user.name} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[var(--ink)] truncate">
                  {user.name}
                </div>
                <div className="mt-1">
                  <TrustBadges
                    density="compact"
                    phoneVerified={user.phoneVerified}
                    emailVerified={user.emailVerified}
                    kycVerified={user.kycVerified}
                    businessVerified={user.businessVerified}
                    addressVerified={user.addressVerified}
                    isTrusted={user.isTrusted}
                    trustScore={user.trustScore}
                    activeBadgeKeys={user.activeBadgeKeys}
                    showScore
                  />
                </div>
                <div className="text-xs text-[var(--muted)] truncate">
                  {user.email}
                </div>
              </div>
              <span className="text-[var(--muted)] text-lg flex-shrink-0">›</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-[var(--ink-secondary)]">
              <div>
                <span className="font-medium">Phone:</span> {user.countryCode}{" "}
                {user.mobile}
              </div>
              <div>
                <span className="font-medium">Location:</span> {user.city},{" "}
                {user.state}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <Badge tone={user.role === "admin" ? "info" : "brand"}>
                {user.role}
              </Badge>
              <Badge tone={user.isBlocked ? "danger" : "success"}>
                {user.isBlocked ? "Blocked" : "Active"}
              </Badge>
            </div>
          </button>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Table className="border-0 rounded-none">
          <THead>
            <TR>
              <TH>User</TH>
              <TH>Mobile</TH>
              <TH>Location</TH>
              <TH>Role</TH>
              <TH>Status</TH>
              <TH>Joined</TH>
              <TH className="text-right">View</TH>
            </TR>
          </THead>
          <TBody>
            {users.map((user) => (
              <TR
                key={user._id}
                onClick={() => onUserClick(user)}
                className="cursor-pointer hover:bg-[var(--brand-soft)] border-l-4 border-transparent hover:border-l-[var(--brand)]"
              >
                <TD>
                  <div className="flex items-center gap-3">
                    <Avatar src={user.profilePicture} name={user.name} size="sm" />
                    <div>
                      <div className="font-semibold text-[var(--ink)] leading-tight">
                        {user.name}
                      </div>
                      <div className="mt-1">
                        <TrustBadges
                          density="compact"
                          phoneVerified={user.phoneVerified}
                          emailVerified={user.emailVerified}
                          kycVerified={user.kycVerified}
                          businessVerified={user.businessVerified}
                          addressVerified={user.addressVerified}
                          isTrusted={user.isTrusted}
                          trustScore={user.trustScore}
                          activeBadgeKeys={user.activeBadgeKeys}
                          showScore
                        />
                      </div>
                      <div className="text-sm text-[var(--muted)]">{user.email}</div>
                    </div>
                  </div>
                </TD>
                <TD className="text-sm font-medium text-[var(--ink-secondary)]">
                  {user.countryCode} {user.mobile}
                </TD>
                <TD className="text-sm text-[var(--ink-secondary)]">
                  {user.city}, {user.state}
                </TD>
                <TD>
                  <Badge tone={user.role === "admin" ? "info" : "brand"}>
                    {user.role}
                  </Badge>
                </TD>
                <TD>
                  <Badge tone={user.isBlocked ? "danger" : "success"}>
                    {user.isBlocked ? "Blocked" : "Active"}
                  </Badge>
                </TD>
                <TD className="text-sm text-[var(--ink-secondary)]">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </TD>
                <TD className="text-right text-sm font-semibold text-[var(--brand)]">
                  View ›
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-5 border-t border-[var(--divider)] flex items-center justify-between bg-[var(--surface-2)]">
          <p className="text-sm font-medium text-[var(--ink-secondary)]">
            Page <span className="font-bold text-[var(--ink)]">{page}</span> of{" "}
            <span className="font-bold text-[var(--ink)]">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
