import type { Metadata } from "next";
import { AuthPage } from "@/components/layout";
import LoginForm from "./_components/LoginForm";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Login to your SparesX account to manage listings, track orders, and connect with buyers or sellers.",
  alternates: {
    canonical: "/login",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginPage() {
  return (
    <AuthPage>
      <LoginForm />
    </AuthPage>
  );
}
