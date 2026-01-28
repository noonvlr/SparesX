import type { Metadata } from "next";
import RegisterForm from "./_components/RegisterForm";

export const metadata: Metadata = {
  title: "Register - SparesX",
  description:
    "Create a SparesX technician account to list spare parts and reach buyers.",
  openGraph: {
    title: "Register - SparesX",
    description:
      "Create a SparesX technician account to list spare parts and reach buyers.",
    type: "website",
  },
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <RegisterForm />
    </main>
  );
}
