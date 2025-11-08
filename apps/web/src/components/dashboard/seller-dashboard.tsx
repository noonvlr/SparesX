'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@sparesx/ui';
import { Button } from '@sparesx/ui';
import { Badge } from '@sparesx/ui';
import { Plus, Eye, Edit, Trash2, IndianRupee, Package, ShoppingCart } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';

interface Product {
  id: string;
  title: string;
  price: number;
  condition: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    orders: number;
  };
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  product: {
    id: string;
    title: string;
  };
  buyer: {
    id: string;
    name: string;
    email: string;
  };
}

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalRevenue: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentProducts: Product[];
  recentOrders: Order[];
}

export function SellerDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      console.log('Loading seller dashboard data...');
      console.log('Auth token:', localStorage.getItem('accessToken') ? 'Present' : 'Missing');
      const response = await apiClient.get('/users/dashboard');
      console.log('Dashboard response:', response.data);
      
      if (response.data.success) {
        const data: DashboardData = response.data.data;
        setProducts(data.recentProducts);
        setOrders(data.recentOrders);
        setStats(data.stats);
        console.log('Dashboard data loaded successfully');
      } else {
        console.error('API returned success: false', response.data);
        toast.error('Failed to load dashboard data: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('Seller access required to view dashboard.');
      } else {
        toast.error('Failed to load dashboard data: ' + (error.response?.data?.error || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await apiClient.delete(`/products/${productId}`);
        toast.success('Product deleted successfully');
        loadDashboardData(); // Reload dashboard data
      } catch (error: any) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleToggleActive = async (productId: string, isActive: boolean) => {
    try {
      await apiClient.put(`/products/${productId}`, { isActive: !isActive });
      toast.success(`Product ${!isActive ? 'activated' : 'deactivated'} successfully`);
      loadDashboardData(); // Reload dashboard data
    } catch (error: any) {
      console.error('Error toggling product status:', error);
      toast.error('Failed to update product status: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <p className="text-muted-foreground">Manage your spare parts listings</p>
        </div>
        <Button onClick={() => router.push('/dashboard/add-product')}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Products</p>
                <p className="text-2xl font-bold">{stats.activeProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <IndianRupee className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">₹{stats.totalRevenue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Products */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No products found. Start by adding your first product!</p>
              </div>
            ) : (
              products.map((product) => (
                <div key={product.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>₹{product.price}</span>
                      <Badge variant={product.isActive ? 'default' : 'secondary'}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <span>{product.condition}</span>
                      <span>{product.category}</span>
                      <span>{product._count.orders} orders</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(product.id, product.isActive)}
                    >
                      {product.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No orders yet. Your orders will appear here when customers purchase your products!</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{order.product.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Buyer: {order.buyer.name}</span>
                      <span>₹{order.totalAmount}</span>
                      <Badge variant="outline">{order.status}</Badge>
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





