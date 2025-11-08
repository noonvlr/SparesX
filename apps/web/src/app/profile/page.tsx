'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@sparesx/ui';
import { Button } from '@sparesx/ui';
import { Badge } from '@sparesx/ui';
import { Input } from '@sparesx/ui';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Package, 
  ShoppingCart,
  Edit,
  Save,
  X,
  Camera,
  IndianRupee,
  Clock,
  CheckCircle,
  Truck,
  Home,
  XCircle,
  Activity,
  ArrowLeft
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
    ordersAsBuyer: number;
    ordersAsSeller: number;
  };
  products: Array<{
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
  }>;
  ordersAsBuyer: Array<{
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    product: {
      id: string;
      title: string;
      seller: {
        name: string;
        email: string;
      };
    };
  }>;
  ordersAsSeller: Array<{
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    product: {
      id: string;
      title: string;
    };
    buyer: {
      name: string;
      email: string;
    };
  }>;
}

interface UserActivity {
  type: string;
  id: string;
  title: string;
  description: string;
  createdAt: string;
  data: any;
}

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activity, setActivity] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'edit'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
  });

  useEffect(() => {
    console.log('Profile page useEffect - authUser:', authUser);
    if (authUser) {
      console.log('Auth user found, loading profile and activity');
      loadUserProfile();
      loadUserActivity();
    } else {
      console.log('No auth user, checking localStorage...');
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('accessToken');
      console.log('Stored user:', storedUser);
      console.log('Stored token:', storedToken ? 'exists' : 'missing');
    }
  }, [authUser]);

  const loadUserProfile = async () => {
    if (!authUser) {
      console.log('No auth user found');
      return;
    }
    
    console.log('Loading user profile for:', authUser);
    setLoading(true);
    try {
      console.log('Making API request to /users/profile/full');
      const response = await apiClient.get('/users/profile/full');
      console.log('Profile response:', response.data);
      
      if (response.data.success) {
        setUser(response.data.data);
        setEditData({
          name: response.data.data.name,
          phone: response.data.data.phone || '',
        });
      }
    } catch (error: any) {
      console.error('Error loading user profile:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      const errorMessage = error.response?.data?.error || 'Failed to load user profile';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadUserActivity = async () => {
    if (!authUser) return;
    
    try {
      const response = await apiClient.get('/users/activity?limit=20');
      if (response.data.success) {
        setActivity(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading user activity:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!authUser) return;
    
    setLoading(true);
    try {
      const response = await apiClient.put('/users/profile', editData);
      if (response.data.success) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        loadUserProfile(); // Reload profile data
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setEditData({
        name: user.name,
        phone: user.phone || '',
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'default';
      case 'SELLER': return 'secondary';
      case 'BUYER': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Shield className="h-4 w-4" />;
      case 'SELLER': return <Package className="h-4 w-4" />;
      case 'BUYER': return <ShoppingCart className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'product_created': return <Package className="h-4 w-4 text-blue-600" />;
      case 'order_bought': return <ShoppingCart className="h-4 w-4 text-green-600" />;
      case 'order_sold': return <IndianRupee className="h-4 w-4 text-purple-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your profile</h1>
          <Button onClick={() => window.location.href = '/auth/login'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account information and view your activity</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
              { id: 'activity', label: 'Activity', icon: <Activity className="h-4 w-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {activeTab === 'profile' && user && (
              <div className="space-y-6">
                {/* User Info Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <span>Profile Information</span>
                      </CardTitle>
                      {!isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-20 h-20 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-primary font-semibold text-2xl">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">{user.name}</h3>
                            <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center space-x-1 mt-1">
                              {getRoleIcon(user.role)}
                              <span>{user.role}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Edit Form */}
                    {isEditing && (
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="text-lg font-medium mb-4">Edit Profile</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                              Full Name
                            </label>
                            <Input
                              id="name"
                              value={editData.name}
                              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                              placeholder="Enter your full name"
                            />
                          </div>
                          <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                              Phone Number
                            </label>
                            <Input
                              id="phone"
                              value={editData.phone}
                              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                              placeholder="Enter your phone number"
                            />
                          </div>
                        </div>
                        <div className="flex space-x-3 mt-4">
                          <Button onClick={handleSaveProfile} disabled={loading}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button variant="outline" onClick={handleCancelEdit}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{user._count.products}</div>
                        <div className="text-sm text-gray-600">Products</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{user._count.ordersAsBuyer}</div>
                        <div className="text-sm text-gray-600">Orders (Buyer)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{user._count.ordersAsSeller}</div>
                        <div className="text-sm text-gray-600">Orders (Seller)</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Products */}
                {user.products.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Recent Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {user.products.map((product) => (
                          <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{product.title}</h4>
                              <p className="text-sm text-gray-600">
                                ₹{product.price} • {product.condition} • {product.category}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant={product.isActive ? 'default' : 'secondary'}>
                                {product.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                {product._count.orders} orders
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Orders */}
                {(user.ordersAsBuyer.length > 0 || user.ordersAsSeller.length > 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[...user.ordersAsBuyer, ...user.ordersAsSeller]
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .slice(0, 5)
                          .map((order) => {
                            const statusConfig = getOrderStatusBadge(order.status);
                            return (
                              <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <h4 className="font-medium">{order.product.title}</h4>
                                  <p className="text-sm text-gray-600">
                                    ₹{order.totalAmount} • {new Date(order.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge variant={statusConfig.variant}>
                                  {order.status}
                                </Badge>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                {activity.length > 0 ? (
                  <div className="space-y-3">
                    {activity.map((item) => (
                      <div key={`${item.type}-${item.id}`} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0 mt-1">
                          {getActivityIcon(item.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No activity found.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
