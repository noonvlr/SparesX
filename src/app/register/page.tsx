import type { Metadata } from "next";
import RegisterForm from "./_components/RegisterForm";

export const metadata: Metadata = {
  title: "Register",
  description:
    "Create your SparesX account to list spare parts, request parts, and connect with verified technicians.",
  alternates: {
    canonical: "/register",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <RegisterForm />
    </main>
  );
}
