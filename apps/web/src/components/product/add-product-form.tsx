'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@sparesx/ui';
import { toast } from 'react-hot-toast';
import { Upload, X, Plus } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { isAuthError } from '@/lib/session-utils';

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

interface AddProductFormData {
  title: string;
  description: string;
  price: number;
  condition: 'NEW' | 'USED' | 'REFURBISHED';
  category: string;
  brand?: string;
  model?: string;
  year?: number;
  location: string;
  quantity: number;
}

export function AddProductForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddProductFormData>();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await apiClient.get('/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Don't show error toast for auth errors as they will redirect to login
      if (!isAuthError(error)) {
        toast.error('Failed to load categories');
      }
    } finally {
      setCategoriesLoading(false);
    }
  };

  const addImage = () => {
    if (imageInput.trim() && images.length < 10) {
      setImages([...images, imageInput.trim()]);
      setImageInput('');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: AddProductFormData) => {
    if (images.length === 0) {
      toast.error('Please add at least one image');
      return;
    }

    setIsLoading(true);
    
    try {
      const productData = {
        ...data,
        images,
      };
      
      console.log('Sending product data:', productData);
      
      const response = await apiClient.post('/products', productData);

      if (response.data.success) {
        toast.success('Product created successfully!');
        router.push('/dashboard');
      } else {
        toast.error(response.data.error || 'Failed to create product');
      }
    } catch (error: any) {
      console.error('Product creation error:', error.response?.data);
      console.error('Validation details:', error.response?.data?.details);
      toast.error(error.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Product</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Product Title *
              </label>
              <Input
                id="title"
                type="text"
                placeholder="Enter product title"
                {...register('title', {
                  required: 'Title is required',
                  minLength: {
                    value: 1,
                    message: 'Title must be at least 1 character',
                  },
                  maxLength: {
                    value: 200,
                    message: 'Title must be less than 200 characters',
                  },
                })}
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description *
              </label>
              <textarea
                id="description"
                rows={4}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe your product in detail"
                {...register('description', {
                  required: 'Description is required',
                  minLength: {
                    value: 1,
                    message: 'Description must be at least 1 character',
                  },
                  maxLength: {
                    value: 2000,
                    message: 'Description must be less than 2000 characters',
                  },
                })}
              />
              {errors.description && (
                <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium mb-2">
                  Price (₹) *
                </label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register('price', {
                    required: 'Price is required',
                    min: {
                      value: 0,
                      message: 'Price must be greater than 0',
                    },
                  })}
                />
                {errors.price && (
                  <p className="text-sm text-destructive mt-1">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="condition" className="block text-sm font-medium mb-2">
                  Condition *
                </label>
                <select
                  id="condition"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  {...register('condition', {
                    required: 'Condition is required',
                  })}
                >
                  <option value="">Select condition</option>
                  <option value="NEW">New</option>
                  <option value="USED">Used</option>
                  <option value="REFURBISHED">Refurbished</option>
                </select>
                {errors.condition && (
                  <p className="text-sm text-destructive mt-1">{errors.condition.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Product Details</h3>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-2">
                Category *
              </label>
              {categoriesLoading ? (
                <div className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm text-muted-foreground">
                  Loading categories...
                </div>
              ) : (
                <select
                  id="category"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  {...register('category', {
                    required: 'Category is required',
                  })}
                >
                  <option value="">Select a category</option>
                  {categories
                    .filter(cat => !cat.parentId) // Only show parent categories
                    .map((category) => (
                      <optgroup key={category.id} label={category.name}>
                        <option value={category.name}>{category.name}</option>
                        {category.children?.map((subcategory) => (
                          <option key={subcategory.id} value={subcategory.name}>
                            {subcategory.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                </select>
              )}
              {errors.category && (
                <p className="text-sm text-destructive mt-1">{errors.category.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="brand" className="block text-sm font-medium mb-2">
                  Brand
                </label>
                <Input
                  id="brand"
                  type="text"
                  placeholder="e.g., BMW, Apple, Dell"
                  {...register('brand')}
                />
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium mb-2">
                  Model
                </label>
                <Input
                  id="model"
                  type="text"
                  placeholder="e.g., E46, iPhone 12, Inspiron"
                  {...register('model')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="year" className="block text-sm font-medium mb-2">
                  Year
                </label>
                <Input
                  id="year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  placeholder="e.g., 2020"
                  {...register('year', {
                    min: {
                      value: 1900,
                      message: 'Year must be after 1900',
                    },
                    max: {
                      value: new Date().getFullYear() + 1,
                      message: 'Year cannot be in the future',
                    },
                  })}
                />
                {errors.year && (
                  <p className="text-sm text-destructive mt-1">{errors.year.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium mb-2">
                  Quantity *
                </label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="e.g., 1"
                  {...register('quantity', {
                    required: 'Quantity is required',
                    min: {
                      value: 1,
                      message: 'Quantity must be at least 1',
                    },
                  })}
                />
                {errors.quantity && (
                  <p className="text-sm text-destructive mt-1">{errors.quantity.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium mb-2">
                  Location *
                </label>
                <Input
                  id="location"
                  type="text"
                  placeholder="e.g., New York, NY"
                  {...register('location', {
                    required: 'Location is required',
                  })}
                />
                {errors.location && (
                  <p className="text-sm text-destructive mt-1">{errors.location.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Product Images</h3>
            <p className="text-sm text-muted-foreground">
              Add up to 10 images. You can add images by URL or upload files.
            </p>
            
            {/* Image URL Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Add Image by URL</label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addImage}
                  disabled={!imageInput.trim() || images.length >= 10}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add URL
                </Button>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Image Files</label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach(file => {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result && images.length < 10) {
                          setImages(prev => [...prev, event.target.result as string]);
                        }
                      };
                      reader.readAsDataURL(file);
                    });
                  }}
                  className="hidden"
                  id="file-upload"
                  disabled={images.length >= 10}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={images.length >= 10}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
                <span className="text-sm text-muted-foreground">
                  {images.length}/10 images
                </span>
              </div>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-image.jpg';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Creating Product...' : 'Create Product'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard')}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
