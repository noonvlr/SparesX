import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'react-hot-toast';
import { RateLimitStatus } from '@/components/rate-limit-status';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SparesX - Marketplace for Spare Parts',
  description: 'Buy and sell spare parts from technicians and enthusiasts',
  keywords: 'spare parts, marketplace, automotive, electronics, machinery',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster position="top-right" />
          <RateLimitStatus />
        </Providers>
      </body>
    </html>
  );
}





