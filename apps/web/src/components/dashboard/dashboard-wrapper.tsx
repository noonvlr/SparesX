'use client';

import { useAuth } from '@/lib/auth-context';
import { SellerDashboard } from './seller-dashboard';
import { BuyerDashboard } from './buyer-dashboard';
import { AdminDashboard } from './admin-dashboard';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function DashboardWrapper() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
            <p className="text-muted-foreground">
              You need to be signed in to access your dashboard.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isSeller = user.role === 'SELLER';
  const isDealer = user.role === 'DEALER';
  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {isAdmin ? (
          <AdminDashboard />
        ) : isSeller || isDealer ? (
          <SellerDashboard />
        ) : (
          <BuyerDashboard />
        )}
      </main>
      <Footer />
    </div>
  );
}

