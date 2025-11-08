'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@sparesx/ui';
import { Button } from '@sparesx/ui';
import { Input } from '@sparesx/ui';
import { Badge } from '@sparesx/ui';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { isAuthError } from '@/lib/session-utils';
import { 
  X, 
  Search, 
  FolderOpen, 
  Folder,
  ChevronRight,
  Package,
  Check
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

interface CategorySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (category: Category) => void;
  selectedCategory?: Category | null;
  title?: string;
}

export function CategorySelectionModal({
  isOpen,
  onClose,
  onSelect,
  selectedCategory,
  title = "Select Category"
}: CategorySelectionModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

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

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const parentCategories = filteredCategories.filter(cat => !cat.parentId);
  const getChildCategories = (parentId: string) => 
    filteredCategories.filter(cat => cat.parentId === parentId);

  const handleCategorySelect = (category: Category) => {
    onSelect(category);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading categories...</p>
              </div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No categories found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms' : 'No categories available'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {parentCategories.map((parentCategory) => (
                <div key={parentCategory.id}>
                  {/* Parent Category */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedCategory?.id === parentCategory.id 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleCategorySelect(parentCategory)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FolderOpen className="h-5 w-5 text-blue-500" />
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {parentCategory.name}
                              {selectedCategory?.id === parentCategory.id && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {parentCategory.slug} • {parentCategory.description}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Child Categories */}
                  {getChildCategories(parentCategory.id).length > 0 && (
                    <div className="ml-6 space-y-2 mt-2">
                      {getChildCategories(parentCategory.id).map((childCategory) => (
                        <Card 
                          key={childCategory.id} 
                          className={`cursor-pointer transition-all hover:shadow-md border-l-4 border-l-blue-200 ${
                            selectedCategory?.id === childCategory.id 
                              ? 'ring-2 ring-primary bg-primary/5' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleCategorySelect(childCategory)}
                        >
                          <CardHeader className="py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Folder className="h-4 w-4 text-blue-400" />
                                <div>
                                  <CardTitle className="text-base flex items-center gap-2">
                                    {childCategory.name}
                                    {selectedCategory?.id === childCategory.id && (
                                      <Check className="h-4 w-4 text-primary" />
                                    )}
                                  </CardTitle>
                                  <p className="text-sm text-muted-foreground">
                                    {childCategory.slug} • {childCategory.description}
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-muted-foreground">
            {filteredCategories.length} categories available
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {selectedCategory && (
              <Button onClick={() => handleCategorySelect(selectedCategory)}>
                Select {selectedCategory.name}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
