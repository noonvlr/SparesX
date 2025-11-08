import { ProductDetail } from '@/components/product-detail';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Metadata } from 'next';
import { apiClient } from '@/lib/api-client';

interface ProductPageProps {
  params: {
    id: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    const response = await apiClient.get(`/products/${params.id}`);
    const product = response.data.data;
    
    return {
      title: `${product.title} - SparesX`,
      description: product.description,
      keywords: `${product.title}, ${product.category}, ${product.brand}, spare parts, ${product.location}`,
      openGraph: {
        title: product.title,
        description: product.description,
        images: product.images?.map((img: any) => img.url) || [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: product.title,
        description: product.description,
        images: product.images?.[0]?.url,
      },
    };
  } catch (error) {
    return {
      title: 'Product - SparesX',
      description: 'Find spare parts on SparesX marketplace',
    };
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <ProductDetail productId={params.id} />
      </main>
      <Footer />
    </div>
  );
}





