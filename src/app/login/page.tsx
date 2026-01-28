import type { Metadata } from "next";
import LoginForm from "./_components/LoginForm";

export const metadata: Metadata = {
  title: "Login - SparesX",
  description: "Login to your SparesX account to manage listings or requests.",
  openGraph: {
    title: "Login - SparesX",
    description:
      "Login to your SparesX account to manage listings or requests.",
    type: "website",
  },
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoginForm />
    </main>
  );
}
