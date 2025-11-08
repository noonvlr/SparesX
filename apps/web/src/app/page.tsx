import { Hero } from '@/components/hero';
import { FeaturedProducts } from '@/components/featured-products';
import { Categories } from '@/components/categories';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex flex-col">
        <Hero />
        <div className="container mx-auto px-4 py-8 flex-1">
          <div className="max-w-7xl mx-auto space-y-8">
            <Categories />
            <FeaturedProducts />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}





