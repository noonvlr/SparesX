'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@sparesx/ui';
import { Button } from '@sparesx/ui';
import { Badge } from '@sparesx/ui';
import { Package, Heart, Clock } from 'lucide-react';

interface Order {
  id: string;
  product: {
    id: string;
    title: string;
    price: number;
    images: Array<{ url: string }>;
  };
  status: string;
  createdAt: string;
  totalAmount: number;
}

interface Favorite {
  id: string;
  product: {
    id: string;
    title: string;
    price: number;
    images: Array<{ url: string }>;
  };
  createdAt: string;
}

export function BuyerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    // Mock data - replace with actual API call
    const mockOrders: Order[] = [
      {
        id: '1',
        product: {
          id: 'prod-1',
          title: 'BMW E46 Engine Block',
          price: 1200,
          images: [{ url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' }],
        },
        status: 'PENDING',
        createdAt: '2024-01-15',
        totalAmount: 1200,
      },
      {
        id: '2',
        product: {
          id: 'prod-2',
          title: 'iPhone 12 Pro Display',
          price: 180,
          images: [{ url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400' }],
        },
        status: 'CONFIRMED',
        createdAt: '2024-01-14',
        totalAmount: 180,
      },
    ];

    const mockFavorites: Favorite[] = [
      {
        id: '1',
        product: {
          id: 'prod-3',
          title: 'Dell Laptop Motherboard',
          price: 250,
          images: [{ url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400' }],
        },
        createdAt: '2024-01-13',
      },
    ];

    setTimeout(() => {
      setOrders(mockOrders);
      setFavorites(mockFavorites);
      setLoading(false);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Buyer Dashboard</h1>
        <p className="text-muted-foreground">Manage your orders and favorites</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Favorites</p>
                <p className="text-2xl font-bold">{favorites.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <img
                  src={order.product.images[0]?.url || '/placeholder-image.jpg'}
                  alt={order.product.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{order.product.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>₹{order.totalAmount}</span>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Favorites */}
      <Card>
        <CardHeader>
          <CardTitle>Favorite Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((favorite) => (
              <div key={favorite.id} className="border rounded-lg p-4">
                <img
                  src={favorite.product.images[0]?.url || '/placeholder-image.jpg'}
                  alt={favorite.product.title}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
                <h3 className="font-semibold mb-2">{favorite.product.title}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    ₹{favorite.product.price}
                  </span>
                  <Button variant="outline" size="sm">
                    View Product
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





