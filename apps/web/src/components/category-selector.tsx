'use client';

import { useState } from 'react';
import { Button } from '@sparesx/ui';
import { CategorySelectionModal } from './category-selection-modal';
import { FolderOpen, X } from 'lucide-react';

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

interface CategorySelectorProps {
  selectedCategory?: Category | null;
  onSelect: (category: Category | null) => void;
  placeholder?: string;
  className?: string;
  showClear?: boolean;
}

export function CategorySelector({
  selectedCategory,
  onSelect,
  placeholder = "Select a category",
  className = "",
  showClear = true
}: CategorySelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCategorySelect = (category: Category) => {
    onSelect(category);
    setIsModalOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
  };

  return (
    <div className={className}>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsModalOpen(true)}
          className="flex-1 justify-start"
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          {selectedCategory ? selectedCategory.name : placeholder}
        </Button>
        
        {showClear && selectedCategory && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="px-3"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {selectedCategory && (
        <div className="mt-2 p-2 bg-muted/50 rounded text-sm text-muted-foreground">
          {selectedCategory.description || `Category: ${selectedCategory.slug}`}
        </div>
      )}

      <CategorySelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleCategorySelect}
        selectedCategory={selectedCategory}
        title="Select Category"
      />
    </div>
  );
}
