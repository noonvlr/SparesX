'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@sparesx/ui';
import { Button } from '@sparesx/ui';
import { Badge } from '@sparesx/ui';
import { Star, MapPin, Calendar, Heart, Share2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { isAuthError } from '@/lib/session-utils';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  category: string;
  brand?: string;
  model?: string;
  year?: number;
  location: string;
  quantity: number;
  createdAt: string;
  images: Array<{ url: string; order: number }>;
  seller: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    createdAt: string;
  };
}

interface ProductDetailProps {
  productId: string;
}

export function ProductDetail({ productId }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003', []);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/products/${productId}`);
      
      if (response.data.success) {
        const productData = response.data.data;
        
        // Transform the API response to match our interface
        const transformedProduct: Product = {
          id: productData.id,
          title: productData.title,
          description: productData.description,
          price: productData.price,
          condition: productData.condition,
          category: productData.category,
          brand: productData.brand,
          model: productData.model,
          year: productData.year,
          location: productData.location,
          quantity: productData.quantity,
          createdAt: productData.createdAt,
          images: productData.images || [],
          seller: {
            id: productData.seller.id,
            name: productData.seller.name,
            email: productData.seller.email,
            phone: productData.seller.phone,
            avatar: productData.seller.avatar,
            createdAt: productData.seller.createdAt,
          },
        };
        
        setProduct(transformedProduct);
      } else {
        toast.error('Failed to load product details');
      }
    } catch (error: any) {
      console.error('Error loading product:', error);
      // Don't show error toast for auth errors as they will redirect
      if (!isAuthError(error)) {
        toast.error('Failed to load product details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMessageSeller = async () => {
    if (authLoading) {
      return;
    }

    if (!product?.seller) {
      toast.error('Seller information is unavailable.');
      return;
    }

    if (!user) {
      toast.error('Please log in to message the seller.');
      router.push(`/auth/login?redirect=/products/${productId}`);
      return;
    }

    if (user.id === product.seller.id) {
      toast('This is your listing.');
      return;
    }

    try {
      setIsStartingChat(true);
      const response = await apiClient.post(`${apiBaseUrl}/api/chat`, {
        participantId: product.seller.id,
      });

      if (response.data?.success && response.data?.data?.chat?._id) {
        toast.success('Chat ready! Redirecting to messages…');
        router.push(`/chat/${response.data.data.chat._id}`);
        return;
      }

      throw new Error('Chat response missing data');
    } catch (error: any) {
      console.error('Failed to start chat:', error);
      if (isAuthError(error)) {
        toast.error('Session expired. Please log in again.');
        router.push(`/auth/login?redirect=/products/${productId}`);
        return;
      }
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to start a conversation with the seller.';
      toast.error(message);
    } finally {
      setIsStartingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg animate-pulse"></div>
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-8 bg-muted rounded animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
            <div className="h-32 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <p className="text-muted-foreground">The product you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[selectedImage]?.url || product.images[0]?.url}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <span className="text-muted-foreground">No image available</span>
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square bg-muted rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={`${product.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold">{product.title}</h1>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-4 mb-4">
              <Badge variant="secondary">{product.condition}</Badge>
              <Badge variant="outline">{product.category}</Badge>
              {product.brand && <Badge variant="outline">{product.brand}</Badge>}
            </div>
            <div className="text-4xl font-bold text-primary mb-4">
              ₹{product.price.toLocaleString()}
            </div>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line">
                {product.description}
              </p>
            </CardContent>
          </Card>

          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Condition</span>
                  <p className="font-medium">{product.condition}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Category</span>
                  <p className="font-medium">{product.category}</p>
                </div>
                {product.brand && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Brand</span>
                    <p className="font-medium">{product.brand}</p>
                  </div>
                )}
                {product.model && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Model</span>
                    <p className="font-medium">{product.model}</p>
                  </div>
                )}
                {product.year && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Year</span>
                    <p className="font-medium">{product.year}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Quantity</span>
                  <p className="font-medium">{product.quantity}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Location</span>
                  <p className="font-medium flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {product.location}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Listed</span>
                  <p className="font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(product.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seller Information */}
          <Card>
            <CardHeader>
              <CardTitle>Seller Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={product.seller.avatar || '/placeholder-avatar.jpg'}
                  alt={product.seller.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold">{product.seller.name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                    <span>4.8 (127 reviews)</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Member since {new Date(product.seller.createdAt).getFullYear()}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {product.seller.email && (
                  <Button asChild className="w-full">
                    <a href={`mailto:${product.seller.email}`}>
                      Email {product.seller.name}
                    </a>
                  </Button>
                )}
                {product.seller.phone && (
                  <Button asChild variant="outline" className="w-full">
                    <a href={`tel:${product.seller.phone}`}>
                      Call {product.seller.name}
                    </a>
                  </Button>
                )}
                <Button
                  className="w-full"
                  disabled={isStartingChat || user?.id === product.seller.id}
                  onClick={handleMessageSeller}
                >
                  {user?.id === product.seller.id ? 'This is your listing' : isStartingChat ? 'Starting chat…' : 'Message Seller'}
                </Button>
                <Button variant="outline" className="w-full">
                  View Seller Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}





