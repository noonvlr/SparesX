'use client';

import { useState, useEffect } from 'react';
import { Button } from '@sparesx/ui';
import { Badge } from '@sparesx/ui';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { isAuthError } from '@/lib/session-utils';
import { 
  ChevronRight, 
  ChevronDown,
  Folder, 
  FolderOpen,
  Package,
  Search
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

interface CategorySidebarProps {
  onSelect: (category: Category) => void;
  selectedCategory?: Category | null;
  className?: string;
}

interface CategoryNode {
  category: Category;
  isExpanded: boolean;
  children: CategoryNode[];
}

export function CategorySidebar({
  onSelect,
  selectedCategory,
  className = ""
}: CategorySidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

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
          className={`flex items-center py-1.5 px-2 hover:bg-gray-100 cursor-pointer rounded text-sm transition-colors ${
            isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onSelect(node.category)}
        >
          {/* Expand/Collapse Button */}
          <div className="flex items-center min-w-[16px]">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(node.category.id);
                }}
                className="p-0.5 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-gray-500" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-gray-500" />
                )}
              </button>
            ) : (
              <div className="w-4" />
            )}
          </div>

          {/* Category Icon */}
          <div className="flex items-center mr-2">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="h-3.5 w-3.5 text-blue-500" />
              ) : (
                <Folder className="h-3.5 w-3.5 text-blue-500" />
              )
            ) : (
              <Package className="h-3.5 w-3.5 text-gray-400" />
            )}
          </div>

          {/* Category Name */}
          <div className="flex-1 min-w-0 truncate">
            {node.category.name}
          </div>
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

  return (
    <div className={`bg-white border-r border-gray-200 h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Categories</h3>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-6 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {/* Categories Tree */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-xs text-gray-500">Loading...</p>
            </div>
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">
              {searchTerm ? 'No matches found' : 'No categories'}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filteredTree.map(node => renderCategoryNode(node))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          {categories.length} categories
        </div>
      </div>
    </div>
  );
}
