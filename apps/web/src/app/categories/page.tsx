'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@sparesx/ui';
import { Button } from '@sparesx/ui';
import { CategoryFileBrowser } from '@/components/category-file-browser';
import { useAuth } from '@/lib/auth-context';
import { 
  FolderOpen, 
  Package,
  ArrowRight
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

export default function CategoriesPage() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    // You can add additional logic here, like redirecting to products page
    console.log('Selected category:', category);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Browse Categories</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select a category to browse products. Choose from our wide range of spare parts and components.
          </p>
        </div>
      </div>

      {/* Category Selection Card */}
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              <FolderOpen className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Select a Category</CardTitle>
            <p className="text-muted-foreground">
              Choose from our organized categories to find the parts you need
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedCategory ? (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="font-medium">Selected Category:</span>
                </div>
                <div className="text-lg font-semibold text-primary">
                  {selectedCategory.name}
                </div>
                {selectedCategory.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCategory.description}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">
                  No category selected yet. Click the button below to browse available categories.
                </p>
              </div>
            )}
            
            <Button 
              onClick={() => setIsModalOpen(true)}
              size="lg"
              className="w-full"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Browse Categories
            </Button>
            
            {selectedCategory && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsModalOpen(true)}
                  className="flex-1"
                >
                  Change Category
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => window.location.href = `/products?category=${selectedCategory.slug}`}
                >
                  View Products
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category File Browser */}
      <CategoryFileBrowser
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleCategorySelect}
        selectedCategory={selectedCategory}
        title="Browse Categories"
      />
    </div>
  );
}
