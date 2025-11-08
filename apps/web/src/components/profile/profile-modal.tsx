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
import { ProfilePictureModal } from './profile-picture-modal';
import { isAuthError } from '@/lib/session-utils';

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

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
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
  const [isProfilePictureModalOpen, setIsProfilePictureModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && authUser) {
      loadUserProfile();
      loadUserActivity();
    }
  }, [isOpen, authUser]);

  const loadUserProfile = async () => {
    if (!authUser) return;
    
    setLoading(true);
    try {
      const response = await apiClient.get('/users/profile/full');
      
      if (response.data.success) {
        setUser(response.data.data);
        setEditData({
          name: response.data.data.name,
          phone: response.data.data.phone || '',
        });
      }
    } catch (error: any) {
      console.error('Error loading user profile:', error);
      // Don't show error toast for auth errors as they will redirect
      if (!isAuthError(error)) {
        const errorMessage = error.response?.data?.error || 'Failed to load user profile';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUserActivity = async () => {
    if (!authUser) return;
    
    try {
      const response = await apiClient.get('/users/activity?limit=10');
      if (response.data.success) {
        setActivity(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading user activity:', error);
      // Don't show error toast for auth errors as they will redirect
      if (!isAuthError(error)) {
        console.warn('Failed to load user activity');
      }
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
        loadUserProfile();
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      // Don't show error toast for auth errors as they will redirect
      if (!isAuthError(error)) {
        toast.error('Failed to update profile');
      }
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

  const handleProfilePictureUpdate = (newAvatar: string | null) => {
    if (user) {
      setUser({
        ...user,
        avatar: newAvatar || undefined
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Enhanced Backdrop */}
        <div 
          className="fixed inset-0 bg-gradient-to-br from-black/60 via-gray-900/50 to-black/60 backdrop-blur-sm transition-all duration-300"
          onClick={onClose}
        />
        
        {/* Modal with enhanced styling */}
        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 animate-in fade-in-0 zoom-in-95 duration-300 hover:shadow-3xl transition-all duration-300">
          {/* Subtle floating animation */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 rounded-2xl pointer-events-none"></div>
          {/* Enhanced Header */}
          <div className="relative flex items-center justify-between p-6 border-b border-gray-200/50 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2 hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  My Profile
                </h2>
                <p className="text-sm text-gray-600">Manage your account information</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 hover:bg-red-50 hover:text-red-600 transition-all duration-200 hover:scale-110 hover:shadow-lg"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Enhanced Tabs */}
          <div className="border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-transparent">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
                { id: 'activity', label: 'Activity', icon: <Activity className="h-4 w-4" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Enhanced Content */}
          <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-6 bg-gradient-to-b from-transparent via-gray-50/30 to-transparent">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20"></div>
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent absolute top-0 left-0" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
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
                              <button
                                onClick={() => setIsProfilePictureModalOpen(true)}
                                className="relative w-16 h-16 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 rounded-full flex items-center justify-center shadow-lg border-2 border-white/50 hover:shadow-xl hover:scale-105 transition-all duration-200 group"
                              >
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-white/50"
                                  />
                                ) : (
                                  <span className="text-primary font-semibold text-xl bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
                                {/* Camera overlay on hover */}
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <Camera className="h-6 w-6 text-white" />
                                </div>
                              </button>
                              <div>
                                <h3 className="text-lg font-semibold">{user.name}</h3>
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
                              <span className="text-sm">{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">{user.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
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
                          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50/50 to-blue-100/30 border border-blue-200/30 hover:shadow-md transition-all duration-200">
                            <div className="text-xl font-bold text-blue-600">{user._count.products}</div>
                            <div className="text-xs text-gray-600">Products</div>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-50/50 to-green-100/30 border border-green-200/30 hover:shadow-md transition-all duration-200">
                            <div className="text-xl font-bold text-green-600">{user._count.ordersAsBuyer}</div>
                            <div className="text-xs text-gray-600">Orders (Buyer)</div>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-50/50 to-purple-100/30 border border-purple-200/30 hover:shadow-md transition-all duration-200">
                            <div className="text-xl font-bold text-purple-600">{user._count.ordersAsSeller}</div>
                            <div className="text-xs text-gray-600">Orders (Seller)</div>
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
                          <div className="space-y-2">
                            {user.products.slice(0, 3).map((product) => (
                              <div key={product.id} className="flex items-center justify-between p-2 border rounded-lg">
                                <div>
                                  <h4 className="font-medium text-sm">{product.title}</h4>
                                  <p className="text-xs text-gray-600">
                                    ₹{product.price} • {product.condition}
                                  </p>
                                </div>
                                <Badge variant={product.isActive ? 'default' : 'secondary'} className="text-xs">
                                  {product.isActive ? 'Active' : 'Inactive'}
                                </Badge>
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
                          <div className="space-y-2">
                            {[...user.ordersAsBuyer, ...user.ordersAsSeller]
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .slice(0, 3)
                              .map((order) => {
                                const statusConfig = getOrderStatusBadge(order.status);
                                return (
                                  <div key={order.id} className="flex items-center justify-between p-2 border rounded-lg">
                                    <div>
                                      <h4 className="font-medium text-sm">{order.product.title}</h4>
                                      <p className="text-xs text-gray-600">
                                        ₹{order.totalAmount} • {new Date(order.createdAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <Badge variant={statusConfig.variant} className="text-xs">
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
                      <div className="space-y-2">
                        {activity.map((item) => (
                          <div key={`${item.type}-${item.id}`} className="flex items-start space-x-3 p-3 border rounded-lg">
                            <div className="flex-shrink-0 mt-1">
                              {getActivityIcon(item.type)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{item.title}</h4>
                              <p className="text-xs text-gray-600">{item.description}</p>
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
      </div>

      {/* Profile Picture Modal */}
      {user && (
        <ProfilePictureModal
          isOpen={isProfilePictureModalOpen}
          onClose={() => setIsProfilePictureModalOpen(false)}
          currentAvatar={user.avatar}
          userName={user.name}
          onUpdate={handleProfilePictureUpdate}
        />
      )}
    </div>
  );
}
