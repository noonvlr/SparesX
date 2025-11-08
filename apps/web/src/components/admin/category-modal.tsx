'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@sparesx/ui';
import { Button } from '@sparesx/ui';
import { Input } from '@sparesx/ui';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';

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

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  category?: Category | null;
}

export function CategoryModal({ isOpen, onClose, onSave, category }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parentId: '',
  });
  const [loading, setLoading] = useState(false);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadParentCategories();
      if (category) {
        setFormData({
          name: category.name,
          slug: category.slug,
          description: category.description || '',
          parentId: category.parentId || '',
        });
      } else {
        setFormData({
          name: '',
          slug: '',
          description: '',
          parentId: '',
        });
      }
    }
  }, [isOpen, category]);

  const loadParentCategories = async () => {
    try {
      const response = await apiClient.get('/categories');
      if (response.data.success) {
        // Filter out the current category and its children to prevent circular references
        const filtered = response.data.data.filter((cat: Category) => 
          !category || (cat.id !== category.id && cat.parentId !== category.id)
        );
        setParentCategories(filtered.filter((cat: Category) => !cat.parentId));
      }
    } catch (error) {
      console.error('Error loading parent categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        parentId: formData.parentId || undefined,
        description: formData.description || undefined,
      };

      if (category) {
        // Update existing category
        await apiClient.put(`/categories/${category.id}`, payload);
        toast.success('Category updated successfully');
      } else {
        // Create new category
        await apiClient.post('/categories', payload);
        toast.success('Category created successfully');
      }
      
      onSave();
    } catch (error: any) {
      console.error('Error saving category:', error);
      const errorMessage = error.response?.data?.error || 'Failed to save category';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData({ ...formData, name, slug });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {category ? 'Edit Category' : 'Create New Category'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name *</label>
            <Input
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Category name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Slug *</label>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="category-slug"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Category description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Parent Category</label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">No parent (root category)</option>
              {parentCategories.map((parentCategory) => (
                <option key={parentCategory.id} value={parentCategory.id}>
                  {parentCategory.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : (category ? 'Update Category' : 'Create Category')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
