import { AddProductForm } from '@/components/product/add-product-form';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function AddProductPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Add New Product</h1>
            <p className="text-muted-foreground">
              List your spare parts for sale on SparesX
            </p>
          </div>
          <AddProductForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
