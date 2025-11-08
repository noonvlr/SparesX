import { ProductList } from '@/components/product-list';
import { ProductFilters } from '@/components/product-filters';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Browse Spare Parts</h1>
          <p className="text-muted-foreground">
            Find the perfect spare parts for your needs
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <ProductFilters />
          </aside>
          <div className="lg:col-span-3">
            <ProductList />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}





