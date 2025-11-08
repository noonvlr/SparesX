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
  ChevronRight, 
  ChevronDown,
  Folder, 
  FolderOpen,
  Search,
  Package,
  X,
  ArrowLeft,
  Home
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

interface CategoryFileBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (category: Category) => void;
  selectedCategory?: Category | null;
  title?: string;
}

interface CategoryNode {
  category: Category;
  isExpanded: boolean;
  children: CategoryNode[];
}

export function CategoryFileBrowser({
  isOpen,
  onClose,
  onSelect,
  selectedCategory,
  title = "Browse Categories"
}: CategoryFileBrowserProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (categories.length > 0) {
      buildCategoryTree();
    }
  }, [categories]);

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

  const buildCategoryTree = () => {
    const categoryMap = new Map<string, CategoryNode>();
    const rootNodes: CategoryNode[] = [];

    // Create nodes for all categories
    categories.forEach(category => {
      categoryMap.set(category.id, {
        category,
        isExpanded: false,
        children: []
      });
    });

    // Build the tree structure
    categories.forEach(category => {
      const node = categoryMap.get(category.id)!;
      
      if (category.parentId) {
        const parentNode = categoryMap.get(category.parentId);
        if (parentNode) {
          parentNode.children.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    // Sort children alphabetically
    const sortNodes = (nodes: CategoryNode[]) => {
      nodes.sort((a, b) => a.category.name.localeCompare(b.category.name));
      nodes.forEach(node => sortNodes(node.children));
    };

    sortNodes(rootNodes);
    setCategoryTree(rootNodes);
  };

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleCategorySelect = (category: Category) => {
    onSelect(category);
    onClose();
  };

  const filteredTree = searchTerm 
    ? filterTreeBySearch(categoryTree, searchTerm.toLowerCase())
    : categoryTree;

  const filterTreeBySearch = (nodes: CategoryNode[], search: string): CategoryNode[] => {
    const filtered: CategoryNode[] = [];
    
    nodes.forEach(node => {
      const matchesSearch = 
        node.category.name.toLowerCase().includes(search) ||
        node.category.slug.toLowerCase().includes(search) ||
        (node.category.description && node.category.description.toLowerCase().includes(search));
      
      const filteredChildren = filterTreeBySearch(node.children, search);
      
      if (matchesSearch || filteredChildren.length > 0) {
        filtered.push({
          ...node,
          children: filteredChildren,
          isExpanded: matchesSearch || filteredChildren.length > 0
        });
      }
    });
    
    return filtered;
  };

  const renderCategoryNode = (node: CategoryNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.category.id);
    const hasChildren = node.children.length > 0;
    const isSelected = selectedCategory?.id === node.category.id;

    return (
      <div key={node.category.id}>
        <div 
          className={`flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer rounded-md transition-colors ${
            isSelected ? 'bg-primary/10 border border-primary/20' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => handleCategorySelect(node.category)}
        >
          {/* Expand/Collapse Button */}
          <div className="flex items-center min-w-[20px]">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(node.category.id);
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}
          </div>

          {/* Category Icon */}
          <div className="flex items-center mr-3">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4 text-blue-500" />
              ) : (
                <Folder className="h-4 w-4 text-blue-500" />
              )
            ) : (
              <Package className="h-4 w-4 text-gray-400" />
            )}
          </div>

          {/* Category Info */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {node.category.name}
            </div>
            {node.category.description && (
              <div className="text-xs text-gray-500 truncate">
                {node.category.description}
              </div>
            )}
          </div>

          {/* Category Slug Badge */}
          <Badge variant="secondary" className="text-xs">
            {node.category.slug}
          </Badge>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderCategoryNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-sm text-gray-500">Browse and select a category</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* File Browser Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-500">Loading categories...</p>
              </div>
            </div>
          ) : filteredTree.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No categories found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search terms' : 'No categories available'}
              </p>
            </div>
          ) : (
            <div className="h-[400px] overflow-y-auto">
              <div className="p-2">
                {filteredTree.map(node => renderCategoryNode(node))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            {categories.length} categories available
            {searchTerm && ` • ${filteredTree.length} matching`}
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
