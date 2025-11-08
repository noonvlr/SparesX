'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@sparesx/ui';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { isAuthError } from '@/lib/session-utils';
import Link from 'next/link';
import { 
  ChevronDown,
  MoreHorizontal,
  FolderOpen,
  Package
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

interface NavigationConfig {
  showInNav: boolean;
  maxVisibleCategories: number;
  showSubcategories: boolean;
  showMoreButton: boolean;
  customOrder: string[];
}

interface CategoryNavigationProps {
  className?: string;
}

export function CategoryNavigation({ className = "" }: CategoryNavigationProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
  const [navConfig, setNavConfig] = useState<NavigationConfig>({
    showInNav: true,
    maxVisibleCategories: 6,
    showSubcategories: true,
    showMoreButton: true,
    customOrder: []
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCategories();
    loadNavigationConfig();
  }, []);

  // Refresh navigation config when component becomes visible (e.g., when switching tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadNavigationConfig();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.mobile-category-dropdown')) {
        setExpandedMobileCategory(null);
      }
    };

    if (expandedMobileCategory) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [expandedMobileCategory]);


  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading categories:', error);
      // Don't show error toast for auth errors as they will redirect to login
      if (!isAuthError(error)) {
        toast.error('Failed to load categories');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadNavigationConfig = async () => {
    try {
      const response = await apiClient.get('/navigation');
      if (response.data.success) {
        setNavConfig(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading navigation config:', error);
      // Don't show error toast for navigation config as it's not critical
      // Also don't show for auth errors as they will redirect
      if (!isAuthError(error)) {
        console.warn('Navigation config failed to load, using defaults');
      }
    }
  };

  const parentCategories = categories.filter(cat => !cat.parentId);
  const getChildCategories = (parentId: string) => 
    categories.filter(cat => cat.parentId === parentId);

  // Apply custom order if configured, otherwise use default order
  const orderedCategories = navConfig.customOrder.length > 0 
    ? navConfig.customOrder
        .map(id => parentCategories.find(cat => cat.id === id))
        .filter(Boolean) as Category[]
    : parentCategories;

  // Show categories based on configuration
  const visibleCategories = navConfig.showInNav 
    ? orderedCategories.slice(0, navConfig.maxVisibleCategories)
    : [];
  const moreCategories = navConfig.showInNav && navConfig.showMoreButton
    ? orderedCategories.slice(navConfig.maxVisibleCategories)
    : [];

  const toggleMobileCategory = (categoryId: string) => {
    setExpandedMobileCategory(expandedMobileCategory === categoryId ? null : categoryId);
  };

  const scrollToCategory = (categoryId: string) => {
    if (scrollContainerRef.current) {
      const categoryElement = scrollContainerRef.current.querySelector(`[data-category-id="${categoryId}"]`);
      if (categoryElement) {
        categoryElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  };



  // Don't render navigation if disabled in config
  if (!navConfig.showInNav) {
    return null;
  }

  if (loading) {
    return (
      <div className={`bg-white border-b border-gray-200 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-6 py-3">
            <div className="animate-pulse flex space-x-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-6 w-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border-b border-gray-200 relative ${className}`}>
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scroll-smooth {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        .scroll-smooth > * {
          scroll-snap-align: start;
        }
      `}</style>
      <div className="container mx-auto px-4">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6 py-3">
          {/* Main Categories */}
          {visibleCategories.map((category) => {
            const hasSubcategories = navConfig.showSubcategories && getChildCategories(category.id).length > 0;
            const subcategories = navConfig.showSubcategories ? getChildCategories(category.id) : [];

            return (
              <div
                key={category.id}
                className="relative group"
              >
                <Link
                  href={`/products?category=${category.slug}`}
                  className="flex items-center space-x-1 text-gray-700 hover:text-primary transition-colors py-2"
                >
                  <span className="font-medium">{category.name}</span>
                  {hasSubcategories && (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Link>

                {/* Subcategories Dropdown */}
                {hasSubcategories && (
                  <div className="absolute top-full left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out">
                    <div className="p-4">
                      <div className="mb-3">
                        <h3 className="font-semibold text-gray-900 flex items-center">
                          <FolderOpen className="h-4 w-4 mr-2 text-blue-500" />
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-1">
                        {subcategories.map((subcategory) => (
                          <Link
                            key={subcategory.id}
                            href={`/products?category=${subcategory.slug}`}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-md transition-colors"
                          >
                            <Package className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-700">
                              {subcategory.name}
                            </span>
                          </Link>
                        ))}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <Link
                          href={`/products?category=${category.slug}`}
                          className="text-sm text-primary hover:text-primary/80 font-medium"
                        >
                          View all {category.name} products →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* More Button */}
          {moreCategories.length > 0 && (
            <div className="relative group">
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="flex items-center space-x-1 text-gray-700 hover:text-primary transition-colors py-2"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="font-medium">More</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* More Categories Dropdown */}
              <div className="absolute top-full left-0 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out">
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">All Categories</h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {moreCategories.map((category) => {
                      const subcategories = getChildCategories(category.id);
                      return (
                        <div key={category.id} className="space-y-1">
                          <Link
                            href={`/products?category=${category.slug}`}
                            className="block font-medium text-gray-900 hover:text-primary transition-colors"
                          >
                            {category.name}
                          </Link>
                          {subcategories.length > 0 && (
                            <div className="space-y-1 ml-2">
                              {subcategories.slice(0, 3).map((subcategory) => (
                                <Link
                                  key={subcategory.id}
                                  href={`/products?category=${subcategory.slug}`}
                                  className="block text-sm text-gray-600 hover:text-primary transition-colors"
                                >
                                  {subcategory.name}
                                </Link>
                              ))}
                              {subcategories.length > 3 && (
                                <span className="text-xs text-gray-400">
                                  +{subcategories.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <Link
                      href="/categories"
                      className="text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      Browse all categories →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden py-3">
          {/* Horizontal Scrollable Categories */}
          <div 
            ref={scrollContainerRef}
            className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth snap-x snap-mandatory"
          >
            {orderedCategories.map((category) => {
              const hasSubcategories = navConfig.showSubcategories && getChildCategories(category.id).length > 0;
              const isExpanded = expandedMobileCategory === category.id;
              const subcategories = navConfig.showSubcategories ? getChildCategories(category.id) : [];

              return (
                <div 
                  key={category.id} 
                  className="flex-shrink-0 snap-start"
                  data-category-id={category.id}
                >
                  <div className="flex items-center space-x-1">
                    <Link
                      href={`/products?category=${category.slug}`}
                      className="text-sm font-medium text-gray-700 hover:text-primary transition-colors py-2 px-2 rounded-md hover:bg-gray-50"
                    >
                      {category.name}
                    </Link>
                    {hasSubcategories && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleMobileCategory(category.id);
                          scrollToCategory(category.id);
                        }}
                        className="mobile-category-dropdown p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <ChevronDown 
                          className={`h-3 w-3 text-gray-500 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`} 
                        />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <Link
              href="/categories"
              className="flex-shrink-0 snap-start text-sm font-medium text-primary hover:text-primary/80 transition-colors py-2 px-2 rounded-md hover:bg-gray-50"
            >
              More
            </Link>
          </div>

          {/* Mobile Subcategories Dropdown */}
          {expandedMobileCategory && (
            <div className="mobile-category-dropdown mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                {getChildCategories(expandedMobileCategory).map((subcategory) => (
                  <Link
                    key={subcategory.id}
                    href={`/products?category=${subcategory.slug}`}
                    className="block text-sm text-gray-700 hover:text-primary transition-colors py-1 px-2 rounded-md hover:bg-white"
                  >
                    {subcategory.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
