'use client';

import { Button } from '@sparesx/ui';
import Link from 'next/link';
import { Search, Shield, Users, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function Hero() {
  const { user, isLoading } = useAuth();
  
  const handleStartSelling = () => {
    if (isLoading) {
      // Still loading, wait a moment
      setTimeout(() => {
        if (user) {
          window.location.href = '/dashboard/add-product';
        } else {
          window.location.href = '/auth/signup';
        }
      }, 100);
    } else if (user) {
      window.location.href = '/dashboard/add-product';
    } else {
      window.location.href = '/auth/signup';
    }
  };
  
  return (
    <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find the Perfect{' '}
            <span className="text-primary">Spare Parts</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with technicians and enthusiasts to buy and sell quality spare parts. 
            From automotive to electronics, find what you need or list what you have.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" asChild>
              <Link href="/products">
                <Search className="mr-2 h-5 w-5" />
                Browse Parts
              </Link>
            </Button>
            <Button variant="outline" size="lg" onClick={handleStartSelling}>
              Start Selling
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Trusted Sellers</h3>
              <p className="text-sm text-muted-foreground">
                All sellers are verified technicians and enthusiasts with quality parts
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Community Driven</h3>
              <p className="text-sm text-muted-foreground">
                Connect with like-minded individuals who share your passion
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Quick & Easy</h3>
              <p className="text-sm text-muted-foreground">
                List items in minutes and find buyers quickly
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}





