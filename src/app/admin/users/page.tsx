import type { Metadata } from "next";
import UsersManager from "./_components/UsersManager";

export const metadata: Metadata = {
  title: "User Management | Admin",
  description:
    "Manage all users, search by mobile number, and edit user information",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminUsersPage() {
  return <UsersManager />;
}
