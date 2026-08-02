import type { Metadata } from "next";
import { AuthPage } from "@/components/layout";
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
    <AuthPage>
      <ForgotPasswordForm />
    </AuthPage>
  );
}
