'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@sparesx/ui';
import Link from 'next/link';
import { Badge } from '@sparesx/ui';
import { Star, MapPin, Calendar, Filter } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Product {
  id: string;
  title: string;
  price: number;
  condition: string;
  location: string;
  createdAt: string;
  images: Array<{ url: string }>;
  seller: {
    id: string;
    name: string;
  };
}

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [page]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/products?page=${page}&limit=12`);
      if (response.data.success) {
        if (page === 1) {
          setProducts(response.data.data);
        } else {
          setProducts(prev => [...prev, ...response.data.data]);
        }
        setHasMore(response.data.data.length === 12);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div>
      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="text-muted-foreground">
            {products.length} parts found
          </p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors">
          <Filter className="h-4 w-4" />
          <span>Sort</span>
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow group">
            <Link href={`/products/${product.id}`}>
              <div className="relative">
                <img
                  src={product.images[0]?.url || '/placeholder-image.jpg'}
                  alt={product.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <Badge
                  variant="secondary"
                  className="absolute top-2 left-2"
                >
                  {product.condition}
                </Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                  {product.title}
                </CardTitle>
              </CardHeader>
            </Link>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    ₹{product.price}
                  </span>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Star className="h-4 w-4 mr-1" />
                    <span>4.8</span>
                  </div>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{product.location}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Listed {new Date(product.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  by {product.seller.name}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg"></div>
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && !loading && (
        <div className="text-center mt-12">
          <button
            onClick={loadMore}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Load More Products
          </button>
        </div>
      )}

      {/* No More Products */}
      {!hasMore && products.length > 0 && (
        <div className="text-center mt-12">
          <p className="text-muted-foreground">No more products to load</p>
        </div>
      )}
    </div>
  );
}





