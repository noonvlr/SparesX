'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@sparesx/ui';
import { Button } from '@sparesx/ui';
import { Badge } from '@sparesx/ui';
import { Input } from '@sparesx/ui';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  IndianRupee, 
  Search, 
  Edit, 
  Trash2, 
  Shield,
  UserCheck,
  UserX,
  Settings,
  BarChart3,
  Tag,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Home,
  Plus,
  Filter,
  Bell,
  ChevronUp,
  ChevronDown,
  Save,
  Navigation,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { UserProfileModal } from '@/components/admin/user-profile-modal';
import { CategoryModal } from '@/components/admin/category-modal';
import { useAuth } from '@/lib/auth-context';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'BUYER' | 'SELLER' | 'DEALER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
    ordersAsBuyer: number;
    ordersAsSeller: number;
  };
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  category: string;
  brand?: string;
  model?: string;
  location: string;
  isActive: boolean;
  createdAt: string;
  seller: {
    id: string;
    name: string;
    email: string;
  };
  images: Array<{ url: string }>;
  _count: {
    messages: number;
    orders: number;
  };
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  shippingAddress: string;
  createdAt: string;
  product: {
    id: string;
    title: string;
    images: Array<{ url: string }>;
  };
  buyer: {
    id: string;
    name: string;
    email: string;
  };
  seller: {
    id: string;
    name: string;
    email: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
}

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  activeProducts: number;
  pendingOrders: number;
}

type TabType = 'overview' | 'users' | 'products' | 'orders' | 'categories' | 'analytics';

export function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeProducts: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [navBarConfig, setNavBarConfig] = useState({
    showInNav: true,
    maxVisibleCategories: 6,
    showSubcategories: true,
    showMoreButton: true,
    customOrder: [] as string[]
  });
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    console.log('AdminDashboard useEffect triggered:', { activeTab, currentPage, searchTerm });
    console.log('Current user from auth context:', user);
    loadDashboardData();
    
    // Load navigation config when categories tab is active
    if (activeTab === 'categories') {
      loadNavBarConfig();
    }
  }, [activeTab, currentPage, searchTerm, user]);

  const loadDashboardData = async () => {
    setLoading(true);
    console.log('Loading dashboard data for tab:', activeTab);
    try {
      switch (activeTab) {
        case 'users':
          await loadUsers();
          break;
        case 'products':
          await loadProducts();
          break;
        case 'orders':
          await loadOrders();
          break;
        case 'categories':
          await loadCategories();
          break;
        case 'overview':
        default:
          await loadOverview();
          break;
      }
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOverview = async () => {
    // Mock data for now - replace with actual API calls
    const mockStats: DashboardStats = {
      totalUsers: 156,
      totalProducts: 89,
      totalOrders: 234,
      totalRevenue: 125000,
      activeProducts: 67,
      pendingOrders: 12,
    };
    setStats(mockStats);
  };

  const loadUsers = async () => {
    try {
      console.log('Loading users...');
      console.log('API URL:', `/users?page=${currentPage}&limit=10&search=${searchTerm}`);
      console.log('Current user token:', localStorage.getItem('accessToken') ? 'Present' : 'Missing');
      
      const response = await apiClient.get(`/users?page=${currentPage}&limit=10&search=${searchTerm}`);
      console.log('Users response:', response.data);
      
      if (response.data.success) {
        setUsers(response.data.data);
        setTotalPages(response.data.pagination.pages);
        console.log('Users loaded successfully:', response.data.data.length, 'users');
      } else {
        console.error('API returned success: false', response.data);
        toast.error('Failed to load users: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error loading users:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('Admin access required to view users.');
      } else {
        toast.error('Failed to load users: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const loadProducts = async () => {
    try {
      console.log('Loading products...');
      const response = await apiClient.get(`/products/admin/all?page=${currentPage}&limit=10&search=${searchTerm}`);
      console.log('Products response:', response.data);
      if (response.data.success) {
        setProducts(response.data.data);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    }
  };

  const loadOrders = async () => {
    try {
      console.log('Loading orders...');
      const response = await apiClient.get(`/orders/admin/all?page=${currentPage}&limit=10&search=${searchTerm}`);
      console.log('Orders response:', response.data);
      if (response.data.success) {
        setOrders(response.data.data);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    }
  };

  const loadCategories = async () => {
    try {
      console.log('Loading categories...');
      console.log('Auth token:', localStorage.getItem('accessToken') ? 'Present' : 'Missing');
      const response = await apiClient.get('/categories');
      console.log('Categories response:', response.data);
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Only show error toast if categories tab is active
      if (activeTab === 'categories') {
        toast.error('Failed to load categories');
      }
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      try {
        await apiClient.delete(`/users/${userId}`);
        toast.success('User deleted successfully');
        loadUsers();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await apiClient.put(`/users/${userId}/role`, { role: newRole });
      toast.success('User role updated successfully');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update user role');
    }
  };

  const handleToggleProductStatus = async (productId: string, isActive: boolean) => {
    try {
      await apiClient.put(`/products/admin/${productId}`, { isActive: !isActive });
      toast.success(`Product ${!isActive ? 'activated' : 'deactivated'} successfully`);
      loadProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update product status');
    }
  };

  const handleDeleteProduct = async (productId: string, productTitle: string) => {
    if (confirm(`Are you sure you want to delete product "${productTitle}"? This action cannot be undone.`)) {
      try {
        await apiClient.delete(`/products/admin/${productId}`);
        toast.success('Product deleted successfully');
        loadProducts();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to delete product');
      }
    }
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (confirm(`Are you sure you want to delete category "${categoryName}"? This action cannot be undone.`)) {
      try {
        await apiClient.delete(`/categories/${categoryId}`);
        toast.success('Category deleted successfully');
        loadCategories();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to delete category');
      }
    }
  };

  const handleCategoryModalClose = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  const handleCategorySave = () => {
    loadCategories();
    handleCategoryModalClose();
  };

  const handleCreateTestNotification = async () => {
    try {
      await apiClient.post('/notifications/test');
      toast.success('Test notification created successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create test notification');
    }
  };

  const handleNavBarConfigChange = (key: string, value: any) => {
    setNavBarConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCategoryOrderChange = (categoryId: string, direction: 'up' | 'down') => {
    // Only work with root categories (parent categories)
    const rootCategories = categories.filter(cat => !cat.parentId);
    const currentOrder = navBarConfig.customOrder.length > 0 ? navBarConfig.customOrder : rootCategories.map(c => c.id);
    const currentIndex = currentOrder.indexOf(categoryId);
    
    if (currentIndex === -1) return;
    
    const newOrder = [...currentOrder];
    if (direction === 'up' && currentIndex > 0) {
      [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];
    } else if (direction === 'down' && currentIndex < newOrder.length - 1) {
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
    }
    
    setNavBarConfig(prev => ({
      ...prev,
      customOrder: newOrder
    }));
  };

  const handleDragStart = (e: React.DragEvent, categoryId: string) => {
    e.dataTransfer.setData('text/plain', categoryId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault();
    const draggedCategoryId = e.dataTransfer.getData('text/plain');
    
    if (draggedCategoryId === targetCategoryId) return;
    
    // Only work with root categories (parent categories)
    const rootCategories = categories.filter(cat => !cat.parentId);
    const currentOrder = navBarConfig.customOrder.length > 0 ? navBarConfig.customOrder : rootCategories.map(c => c.id);
    const draggedIndex = currentOrder.indexOf(draggedCategoryId);
    const targetIndex = currentOrder.indexOf(targetCategoryId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedCategoryId);
    
    setNavBarConfig(prev => ({
      ...prev,
      customOrder: newOrder
    }));
  };

  const loadNavBarConfig = async () => {
    try {
      const response = await apiClient.get('/navigation');
      if (response.data.success) {
        setNavBarConfig(response.data.data);
      }
    } catch (error) {
      console.error('Error loading nav bar config:', error);
    }
  };

  const saveNavBarConfig = async () => {
    setSavingConfig(true);
    try {
      console.log('Saving navigation config:', navBarConfig);
      const response = await apiClient.put('/navigation', navBarConfig);
      console.log('Save response:', response.data);
      
      if (response.data.success) {
        toast.success('Navigation bar configuration saved successfully!');
        console.log('Nav bar config saved:', response.data.data);
      } else {
        toast.error(response.data.message || 'Failed to save navigation bar configuration');
      }
    } catch (error: any) {
      console.error('Error saving nav bar config:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('Admin access required to save navigation configuration.');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to save navigation bar configuration. Please try again.');
      }
    } finally {
      setSavingConfig(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await apiClient.put(`/orders/admin/${orderId}/status`, { status: newStatus });
      toast.success('Order status updated successfully');
      loadOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update order status');
    }
  };

  const handleViewUserProfile = (userId: string) => {
    setSelectedUserId(userId);
    setIsProfileModalOpen(true);
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
    setSelectedUserId(null);
  };

  const handleUserUpdate = () => {
    // Refresh users list when user is updated
    if (activeTab === 'users') {
      loadUsers();
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'default';
      case 'SELLER': return 'secondary';
      case 'DEALER': return 'secondary';
      case 'BUYER': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Shield className="h-4 w-4" />;
      case 'SELLER': return <UserCheck className="h-4 w-4" />;
      case 'DEALER': return <UserCheck className="h-4 w-4" />;
      case 'BUYER': return <UserX className="h-4 w-4" />;
      default: return <UserX className="h-4 w-4" />;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { variant: 'outline' as const, icon: <Clock className="h-3 w-3" />, color: 'text-yellow-600' },
      CONFIRMED: { variant: 'secondary' as const, icon: <CheckCircle className="h-3 w-3" />, color: 'text-blue-600' },
      SHIPPED: { variant: 'default' as const, icon: <Truck className="h-3 w-3" />, color: 'text-purple-600' },
      DELIVERED: { variant: 'default' as const, icon: <Home className="h-3 w-3" />, color: 'text-green-600' },
      CANCELLED: { variant: 'outline' as const, icon: <XCircle className="h-3 w-3" />, color: 'text-red-600' },
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="h-4 w-4" /> },
    { id: 'products', label: 'Products', icon: <Package className="h-4 w-4" /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart className="h-4 w-4" /> },
    { id: 'categories', label: 'Categories', icon: <Tag className="h-4 w-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <Settings className="h-4 w-4" /> },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Users</p>
                <p className="text-lg font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Total Products</p>
                <p className="text-lg font-bold">{stats.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Active Products</p>
                <p className="text-lg font-bold">{stats.activeProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-xs text-muted-foreground">Total Orders</p>
                <p className="text-lg font-bold">{stats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-6 w-6 text-yellow-600" />
              <div>
                <p className="text-xs text-muted-foreground">Pending Orders</p>
                <p className="text-lg font-bold">{stats.pendingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <IndianRupee className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-lg font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Testing */}
      <Card>
        <CardHeader>
          <CardTitle>System Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleCreateTestNotification}
                className="flex items-center space-x-2"
              >
                <Bell className="h-4 w-4" />
                <span>Create Test Notification</span>
              </Button>
              <p className="text-sm text-muted-foreground">
                Click to create a test notification for the current user
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                onClick={async () => {
                  try {
                    console.log('Testing API connection...');
                    const response = await apiClient.get('/users?page=1&limit=1');
                    console.log('API test successful:', response.data);
                    toast.success('API connection successful!');
                  } catch (error: any) {
                    console.error('API test failed:', error);
                    toast.error('API connection failed: ' + (error.response?.data?.error || error.message));
                  }
                }}
                className="flex items-center space-x-2"
                variant="outline"
              >
                <Users className="h-4 w-4" />
                <span>Test Users API</span>
              </Button>
              <p className="text-sm text-muted-foreground">
                Test the users API endpoint
              </p>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p><strong>Current User:</strong> {user?.name} ({user?.role})</p>
              <p><strong>User ID:</strong> {user?.id}</p>
              <p><strong>Token:</strong> {localStorage.getItem('accessToken') ? 'Present' : 'Missing'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                    {user.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => {
                const statusConfig = getOrderStatusBadge(order.status);
                return (
                  <div key={order.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                      <img
                        src={order.product.images[0]?.url || '/placeholder-image.jpg'}
                        alt={order.product.title}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{order.product.title}</p>
                      <p className="text-xs text-muted-foreground">{order.buyer.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">₹{order.totalAmount}</p>
                      <Badge variant={statusConfig.variant} className="text-xs">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderUsers = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>User Management</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-primary font-semibold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleViewUserProfile(user.id)}
                    className="font-semibold text-primary hover:underline cursor-pointer"
                  >
                    {user.name}
                  </button>
                  <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center space-x-1">
                    {getRoleIcon(user.role)}
                    <span>{user.role}</span>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                  <span>{user._count.products} products</span>
                  <span>{user._count.ordersAsBuyer + user._count.ordersAsSeller} orders</span>
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewUserProfile(user.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Profile
                </Button>

                <select
                  value={user.role}
                  onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                  className="px-3 py-1 border rounded-md text-sm"
                  disabled={user.role === 'ADMIN'}
                >
                  <option value="BUYER">Buyer</option>
                  <option value="SELLER">Seller</option>
                  <option value="DEALER">Dealer</option>
                  <option value="ADMIN">Admin</option>
                </select>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteUser(user.id, user.name)}
                  disabled={user.role === 'ADMIN'}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderProducts = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Product Management</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="flex items-center space-x-4 p-4 border rounded-lg">
              <img
                src={product.images[0]?.url || '/placeholder-image.jpg'}
                alt={product.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold">{product.title}</h3>
                  <Badge variant={product.isActive ? 'default' : 'secondary'}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{product.description.substring(0, 100)}...</p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                  <span>₹{product.price}</span>
                  <span>{product.condition}</span>
                  <span>{product.category}</span>
                  <span>by {product.seller.name}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleProductStatus(product.id, product.isActive)}
                >
                  {product.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteProduct(product.id, product.title)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderOrders = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Order Management</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.map((order) => {
            const statusConfig = getOrderStatusBadge(order.status);
            return (
              <div key={order.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <img
                  src={order.product.images[0]?.url || '/placeholder-image.jpg'}
                  alt={order.product.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                
                <div className="flex-1">
                  <h3 className="font-semibold">{order.product.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                    <span>Buyer: {order.buyer.name}</span>
                    <span>Seller: {order.seller.name}</span>
                    <span>₹{order.totalAmount}</span>
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{order.shippingAddress}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={order.status}
                    onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const renderCategories = () => (
    <div className="space-y-6">
      {/* Navigation Bar Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Navigation className="h-5 w-5" />
              <CardTitle>Navigation Bar Configuration</CardTitle>
            </div>
            <Button 
              onClick={saveNavBarConfig} 
              disabled={savingConfig}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{savingConfig ? 'Saving...' : 'Save Configuration'}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* General Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">General Settings</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Show in Navigation</label>
                  <p className="text-xs text-muted-foreground">Display categories in the main navigation bar</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavBarConfigChange('showInNav', !navBarConfig.showInNav)}
                  className="flex items-center space-x-2"
                >
                  {navBarConfig.showInNav ? (
                    <ToggleRight className="h-5 w-5 text-primary" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Show Subcategories</label>
                  <p className="text-xs text-muted-foreground">Display subcategories in dropdown menus</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavBarConfigChange('showSubcategories', !navBarConfig.showSubcategories)}
                  className="flex items-center space-x-2"
                >
                  {navBarConfig.showSubcategories ? (
                    <ToggleRight className="h-5 w-5 text-primary" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Show "More" Button</label>
                  <p className="text-xs text-muted-foreground">Display "More" button for additional categories</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavBarConfigChange('showMoreButton', !navBarConfig.showMoreButton)}
                  className="flex items-center space-x-2"
                >
                  {navBarConfig.showMoreButton ? (
                    <ToggleRight className="h-5 w-5 text-primary" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Display Settings</h3>
              
              <div>
                <label className="text-sm font-medium">Max Visible Categories</label>
                <p className="text-xs text-muted-foreground mb-2">Number of categories to show before "More" button</p>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={navBarConfig.maxVisibleCategories}
                  onChange={(e) => handleNavBarConfigChange('maxVisibleCategories', parseInt(e.target.value))}
                  className="w-20"
                />
              </div>
            </div>
          </div>

          {/* Category Order */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Category Order</h3>
            <p className="text-sm text-muted-foreground">Drag and drop or use arrows to reorder root categories in the navigation bar. Only parent categories are shown here.</p>
            
            <div className="space-y-2">
              {(() => {
                // Only show root categories (parent categories) in the drag and drop section
                const rootCategories = categories.filter(cat => !cat.parentId);
                const orderedCategories = navBarConfig.customOrder.length > 0 
                  ? navBarConfig.customOrder
                      .map(id => rootCategories.find(c => c.id === id))
                      .filter(Boolean) as Category[]
                  : rootCategories;
                
                return orderedCategories.map((category, index) => {
                  return (
                    <div 
                      key={category.id} 
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/50 cursor-move hover:bg-muted/70 transition-colors"
                      draggable
                      onDragStart={(e) => handleDragStart(e, category.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, category.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{category.name}</h4>
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCategoryOrderChange(category.id, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCategoryOrderChange(category.id, 'down')}
                          disabled={index === orderedCategories.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Category Management</CardTitle>
            <Button onClick={handleCreateCategory}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {(() => {
              // Group categories by parent
              const parentCategories = categories.filter(cat => !cat.parentId);
              const childCategories = categories.filter(cat => cat.parentId);
              
              return parentCategories.map((parentCategory) => {
                const children = childCategories.filter(child => child.parentId === parentCategory.id);
                
                return (
                  <div key={parentCategory.id} className="border rounded-lg p-4">
                    {/* Parent Category */}
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                          📁
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{parentCategory.name}</h3>
                          <p className="text-sm text-muted-foreground">{parentCategory.description}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditCategory(parentCategory)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive"
                          onClick={() => handleDeleteCategory(parentCategory.id, parentCategory.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Child Categories */}
                    {children.length > 0 && (
                      <div className="ml-6 space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Subcategories ({children.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {children.map((childCategory) => (
                            <div key={childCategory.id} className="p-3 border rounded-lg bg-background">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center text-xs">
                                    📄
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-sm">{childCategory.name}</h4>
                                    <p className="text-xs text-muted-foreground">{childCategory.description}</p>
                                  </div>
                                </div>
                                <div className="flex space-x-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEditCategory(childCategory)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-destructive"
                                    onClick={() => handleDeleteCategory(childCategory.id, childCategory.name)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Show message if no subcategories */}
                    {children.length === 0 && (
                      <div className="ml-6 text-sm text-muted-foreground italic">
                        No subcategories
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Platform Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'users': return renderUsers();
      case 'products': return renderProducts();
      case 'orders': return renderOrders();
      case 'categories': return renderCategories();
      case 'analytics': return renderAnalytics();
      case 'overview':
      default: return renderOverview();
    }
  };

  if (loading && activeTab === 'overview') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-muted rounded w-3/4"></div>
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
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, products, orders, and platform settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          isOpen={isProfileModalOpen}
          onClose={handleCloseProfileModal}
          onUserUpdate={handleUserUpdate}
        />
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={handleCategoryModalClose}
        onSave={handleCategorySave}
        category={editingCategory}
      />
    </div>
  );
}