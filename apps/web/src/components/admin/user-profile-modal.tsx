'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@sparesx/ui';
import { Button } from '@sparesx/ui';
import { Badge } from '@sparesx/ui';
import { Input } from '@sparesx/ui';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Package, 
  ShoppingCart,
  Key,
  Activity,
  Eye,
  EyeOff,
  IndianRupee,
  Clock,
  CheckCircle,
  Truck,
  Home,
  XCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';

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

interface UserProfileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: () => void;
}

export function UserProfileModal({ userId, isOpen, onClose, onUserUpdate }: UserProfileModalProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activity, setActivity] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'password'>('profile');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadUserProfile();
      loadUserActivity();
    }
  }, [isOpen, userId]);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      console.log('Loading user profile for userId:', userId);
      console.log('API client base URL:', apiClient.defaults.baseURL);
      console.log('Request URL:', `/users/${userId}/profile`);
      
      const response = await apiClient.get(`/users/${userId}/profile`);
      console.log('User profile response:', response.data);
      
      if (response.data.success) {
        setUser(response.data.data);
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
    try {
      const response = await apiClient.get(`/users/${userId}/activity?limit=20`);
      if (response.data.success) {
        setActivity(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading user activity:', error);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await apiClient.put(`/users/${userId}/password`, {
        newPassword,
      });
      if (response.data.success) {
        toast.success('Password updated successfully');
        setNewPassword('');
        setActiveTab('profile');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">User Profile</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
              { id: 'activity', label: 'Activity', icon: <Activity className="h-4 w-4" /> },
              { id: 'password', label: 'Password', icon: <Key className="h-4 w-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {activeTab === 'profile' && user && (
                <div className="space-y-6">
                  {/* User Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <span>User Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={user.name}
                                  className="w-16 h-16 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-primary font-semibold text-xl">
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
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Statistics */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{user._count.products}</div>
                          <div className="text-sm text-muted-foreground">Products</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{user._count.ordersAsBuyer}</div>
                          <div className="text-sm text-muted-foreground">Orders (Buyer)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{user._count.ordersAsSeller}</div>
                          <div className="text-sm text-muted-foreground">Orders (Seller)</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Products */}
                  {user.products.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Products</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {user.products.map((product) => (
                            <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <h4 className="font-medium">{product.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  ₹{product.price} • {product.condition} • {product.category}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge variant={product.isActive ? 'default' : 'secondary'}>
                                  {product.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
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
                                    <p className="text-sm text-muted-foreground">
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
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(item.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No activity found for this user.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'password' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Key className="h-5 w-5" />
                        <span>Change Password</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                            New Password
                          </label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showPassword ? 'text' : 'password'}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password"
                              className="pr-10"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Password must be at least 6 characters long
                          </p>
                        </div>
                        <Button 
                          onClick={handlePasswordChange}
                          disabled={passwordLoading || !newPassword || newPassword.length < 6}
                          className="w-full"
                        >
                          {passwordLoading ? 'Updating...' : 'Update Password'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
