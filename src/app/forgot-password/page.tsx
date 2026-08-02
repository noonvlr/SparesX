import type { Metadata } from "next";
import ForgotPasswordForm from "./_components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password | SparesX",
  description: "Reset your password using email OTP verification",
  robots: {
    index: false,
    follow: true,
  },
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-[var(--surface-2)] flex items-center justify-center p-4">
      <ForgotPasswordForm />
    </main>
  );
}
