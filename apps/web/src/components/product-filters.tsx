'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@sparesx/ui';
import { Button } from '@sparesx/ui';
import { Input } from '@sparesx/ui';
import { Badge } from '@sparesx/ui';
import { Search, X } from 'lucide-react';

interface Filters {
  search: string;
  category: string;
  condition: string;
  minPrice: string;
  maxPrice: string;
  location: string;
  brand: string;
}

const categories = [
  'Automotive',
  'Electronics',
  'Mobile & Gadgets',
  'Tools & Equipment',
  'Home Appliances',
  'Gaming & Entertainment',
];

const conditions = ['NEW', 'USED', 'REFURBISHED'];

export function ProductFilters() {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: '',
    condition: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    brand: '',
  });

  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));

    // Update active filters
    if (value) {
      setActiveFilters(prev => [...prev.filter(f => !f.startsWith(key)), `${key}:${value}`]);
    } else {
      setActiveFilters(prev => prev.filter(f => !f.startsWith(key)));
    }
  };

  const clearFilter = (filterKey: string) => {
    const [key] = filterKey.split(':');
    setFilters(prev => ({
      ...prev,
      [key]: '',
    }));
    setActiveFilters(prev => prev.filter(f => f !== filterKey));
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      category: '',
      condition: '',
      minPrice: '',
      maxPrice: '',
      location: '',
      brand: '',
    });
    setActiveFilters([]);
  };

  const applyFilters = () => {
    // TODO: Apply filters to product list
    console.log('Applying filters:', filters);
  };

  return (
    <div className="space-y-6">
      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Active Filters</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => {
                const [key, value] = filter.split(':');
                return (
                  <Badge
                    key={filter}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <span className="capitalize">{key}: {value}</span>
                    <button
                      onClick={() => clearFilter(filter)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search for parts..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categories.map((category) => (
              <label key={category} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={category}
                  checked={filters.category === category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="rounded"
                />
                <span className="text-sm">{category}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Condition */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Condition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {conditions.map((condition) => (
              <label key={condition} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  value={condition}
                  checked={filters.condition === condition}
                  onChange={(e) => handleFilterChange('condition', e.target.value)}
                  className="rounded"
                />
                <span className="text-sm">{condition}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Price Range */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Price Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Min Price</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Price</label>
              <Input
                type="number"
                placeholder="10000"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Location</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Enter city or state"
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Brand */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Brand</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Enter brand name"
            value={filters.brand}
            onChange={(e) => handleFilterChange('brand', e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Apply Filters Button */}
      <Button onClick={applyFilters} className="w-full">
        Apply Filters
      </Button>
    </div>
  );
}





