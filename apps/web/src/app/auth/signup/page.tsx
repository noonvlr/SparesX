import { SignupForm } from '@/components/auth/signup-form';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Join SparesX</h1>
            <p className="text-muted-foreground">
              Create your account to start buying and selling
            </p>
          </div>
          <SignupForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}





