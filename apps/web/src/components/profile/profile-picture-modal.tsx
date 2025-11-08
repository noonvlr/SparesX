'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@sparesx/ui';
import { Input } from '@sparesx/ui';
import { 
  X, 
  Upload, 
  Camera, 
  Trash2, 
  Image as ImageIcon,
  Check,
  AlertCircle,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Crop,
  Undo2
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { isAuthError } from '@/lib/session-utils';

interface ProfilePictureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  userName: string;
  onUpdate: (newAvatar: string | null) => void;
}

export function ProfilePictureModal({ 
  isOpen, 
  onClose, 
  currentAvatar, 
  userName, 
  onUpdate 
}: ProfilePictureModalProps) {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use refs to persist values across re-mounts
  const imageUrlRef = useRef<string>('');
  const previewUrlRef = useRef<string | null>(null);
  
  // Image editing state
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editHistory, setEditHistory] = useState<string[]>([]);
  const [currentEditIndex, setCurrentEditIndex] = useState(-1);
  const [imageTransform, setImageTransform] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0,
    rotation: 0
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Cleanup effect to remove any stuck event listeners
  useEffect(() => {
    return () => {
      // Clean up any stuck cursor styles
      document.body.style.cursor = '';
      // Remove any global event listeners that might be stuck
      document.removeEventListener('mousemove', () => {});
      document.removeEventListener('mouseup', () => {});
    };
  }, []);

  // Cleanup when editing mode changes
  useEffect(() => {
    if (!isEditing) {
      document.body.style.cursor = '';
    }
  }, [isEditing]);


  // Restore values from refs when component mounts
  useEffect(() => {
    if (isOpen && imageUrlRef.current && !imageUrl) {
      console.log('Restoring image URL from ref:', imageUrlRef.current.substring(0, 50) + '...');
      setImageUrl(imageUrlRef.current);
    }
    if (isOpen && previewUrlRef.current && !previewUrl) {
      console.log('Restoring preview URL from ref:', previewUrlRef.current.substring(0, 50) + '...');
      setPreviewUrl(previewUrlRef.current);
    }
  }, [isOpen, imageUrl, previewUrl]);

  const handleClose = () => {
    console.log('handleClose called - resetting all states');
    setImageUrl('');
    setPreviewUrl(null);
    imageUrlRef.current = '';
    previewUrlRef.current = null;
    setDragActive(false);
    setIsEditing(false);
    setEditHistory([]);
    setCurrentEditIndex(-1);
    setImageTransform({
      scale: 1,
      translateX: 0,
      translateY: 0,
      rotation: 0
    });
    onClose();
  };

  const handleImageUrlChange = (url: string) => {
    console.log('Image URL input changed to:', url);
    setImageUrl(url);
    imageUrlRef.current = url;
    if (url.trim()) {
      setPreviewUrl(url.trim());
      previewUrlRef.current = url.trim();
    } else {
      setPreviewUrl(null);
      previewUrlRef.current = null;
    }
  };

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      console.log('File selected, reading file...');
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log('File read, setting new image URL');
        setPreviewUrl(result);
        setImageUrl(result);
        previewUrlRef.current = result;
        imageUrlRef.current = result;
        setIsEditing(false); // Reset editing state on new file select
        setEditHistory([]);
        setCurrentEditIndex(-1);
        setImageTransform({
          scale: 1,
          translateX: 0,
          translateY: 0,
          rotation: 0
        });
      };
      reader.readAsDataURL(file);
    } else {
      toast.error('Please select a valid image file');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpdateProfilePicture = async () => {
    if (!imageUrl.trim()) {
      toast.error('Please provide an image URL or select a file');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.put('/users/profile', {
        avatar: imageUrl.trim()
      });
      
      if (response.data.success) {
        toast.success('Profile picture updated successfully');
        onUpdate(imageUrl.trim());
        handleClose();
      }
    } catch (error: any) {
      console.error('Error updating profile picture:', error);
      // Don't show error toast for auth errors as they will redirect
      if (!isAuthError(error)) {
        toast.error('Failed to update profile picture');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    setLoading(true);
    try {
      const response = await apiClient.put('/users/profile', {
        avatar: null
      });
      
      if (response.data.success) {
        toast.success('Profile picture removed successfully');
        onUpdate(null);
        handleClose();
      }
    } catch (error: any) {
      console.error('Error removing profile picture:', error);
      // Don't show error toast for auth errors as they will redirect
      if (!isAuthError(error)) {
        toast.error('Failed to remove profile picture');
      }
    } finally {
      setLoading(false);
    }
  };

  // Image editing functions
  const saveToHistory = useCallback((url: string) => {
    const newHistory = editHistory.slice(0, currentEditIndex + 1);
    newHistory.push(url);
    setEditHistory(newHistory);
    setCurrentEditIndex(newHistory.length - 1);
  }, [editHistory, currentEditIndex]);

  const handleEditImage = () => {
    if (previewUrl) {
      saveToHistory(previewUrl);
      setIsEditing(true);
      
      // Ensure the image is loaded before editing
      if (imageRef.current) {
        const img = imageRef.current;
        if (!img.complete || img.naturalWidth === 0) {
          img.onload = () => {
            // Image is now loaded and ready for editing
          };
        }
      }
    }
  };

  const handleUndo = () => {
    if (currentEditIndex > 0) {
      const newIndex = currentEditIndex - 1;
      setCurrentEditIndex(newIndex);
      setPreviewUrl(editHistory[newIndex]);
      setImageUrl(editHistory[newIndex]);
    }
  };

  const handleRedo = () => {
    if (currentEditIndex < editHistory.length - 1) {
      const newIndex = currentEditIndex + 1;
      setCurrentEditIndex(newIndex);
      setPreviewUrl(editHistory[newIndex]);
      setImageUrl(editHistory[newIndex]);
    }
  };

  const handleZoomIn = () => {
    setImageTransform(prev => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, 3)
    }));
  };

  const handleZoomOut = () => {
    setImageTransform(prev => ({
      ...prev,
      scale: Math.max(prev.scale / 1.2, 0.5)
    }));
  };

  const handleRotate = () => {
    setImageTransform(prev => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360
    }));
  };

  const handleReset = () => {
    setImageTransform({
      scale: 1,
      translateX: 0,
      translateY: 0,
      rotation: 0
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditing) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startTranslateX = imageTransform.translateX;
    const startTranslateY = imageTransform.translateY;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      setImageTransform(prev => ({
        ...prev,
        translateX: startTranslateX + deltaX,
        translateY: startTranslateY + deltaY
      }));
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Remove any cursor styles that might be stuck
      document.body.style.cursor = '';
      if (imageRef.current) {
        imageRef.current.style.cursor = 'move';
      }
    };

    // Add cursor feedback
    document.body.style.cursor = 'grabbing';
    if (imageRef.current) {
      imageRef.current.style.cursor = 'grabbing';
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };


  const handleSaveEdit = () => {
    if (canvasRef.current && imageRef.current) {
      setIsSavingEdit(true);
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = imageRef.current;
      
      const processImage = () => {
        if (ctx && img) {
          console.log('Processing image with transforms:', imageTransform);
          
          // Set canvas size to 200x200 for profile picture
          canvas.width = 200;
          canvas.height = 200;
          
          // Clear canvas with white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Save current transform state
          ctx.save();
          
          // Move to center of canvas
          ctx.translate(canvas.width / 2, canvas.height / 2);
          
          // Apply user's translation first (positioning)
          ctx.translate(imageTransform.translateX, imageTransform.translateY);
          
          // Apply user's scaling
          ctx.scale(imageTransform.scale, imageTransform.scale);
          
          // Apply user's rotation
          ctx.rotate((imageTransform.rotation * Math.PI) / 180);
          
          // Draw image centered - use the same size as the preview (128px)
          const previewSize = 128; // This matches the preview size
          const imageScale = previewSize / Math.max(img.naturalWidth, img.naturalHeight);
          const scaledWidth = img.naturalWidth * imageScale;
          const scaledHeight = img.naturalHeight * imageScale;
          
          ctx.drawImage(img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
          
          // Restore transform state
          ctx.restore();
          
          // Convert to data URL
          const editedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
          console.log('Generated edited image URL:', editedImageUrl.substring(0, 50) + '...');
          console.log('Setting preview URL to edited image');
          setPreviewUrl(editedImageUrl);
          previewUrlRef.current = editedImageUrl;
          console.log('Setting image URL to edited image');
          setImageUrl(editedImageUrl);
          imageUrlRef.current = editedImageUrl;
          console.log('Saving to history');
          saveToHistory(editedImageUrl);
          console.log('Save completed - exiting edit mode');
          setIsSavingEdit(false);
          // Add a small delay before exiting edit mode to ensure state is stable
          setTimeout(() => {
            console.log('Exiting edit mode after delay');
            setIsEditing(false);
          }, 100);
        }
      };
      
      if (ctx && img && img.complete && img.naturalWidth > 0) {
        processImage();
      } else {
        // If image isn't ready, wait for it to load
        const handleImageLoad = () => {
          processImage();
        };
        
        if (img.complete) {
          handleImageLoad();
        } else {
          img.onload = handleImageLoad;
        }
      }
    }
  };

  const handleCancelEdit = () => {
    if (editHistory.length > 0) {
      setPreviewUrl(editHistory[currentEditIndex]);
      setImageUrl(editHistory[currentEditIndex]);
    }
    setIsEditing(false);
    setIsSavingEdit(false);
    setImageTransform({
      scale: 1,
      translateX: 0,
      translateY: 0,
      rotation: 0
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 animate-in fade-in-0 zoom-in-95 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
            <div>
              <h2 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Update Profile Picture
              </h2>
              <p className="text-sm text-gray-600">Change or remove your profile picture</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="p-2 hover:bg-red-50 hover:text-red-600 transition-all duration-200 hover:scale-110"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Current Profile Picture */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 rounded-full flex items-center justify-center shadow-lg border-2 border-white/50 mx-auto">
                  {currentAvatar ? (
                    <img
                      src={currentAvatar}
                      alt={userName}
                      className="w-24 h-24 rounded-full object-cover border-2 border-white/50"
                    />
                  ) : (
                    <span className="text-primary font-semibold text-2xl">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">Current profile picture</p>
            </div>

            {/* Image URL Input */}
            <div className="space-y-2">
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                Image URL
              </label>
              <div className="relative">
                <Input
                  id="imageUrl"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  placeholder="https://example.com/your-image.jpg"
                  className="pr-10"
                />
                <ImageIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* File Upload Area */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Or upload a file
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-300 hover:border-primary/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-sm text-gray-600">
                      Drag and drop an image here, or{' '}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary hover:text-primary/80 font-medium"
                      >
                        browse files
                      </button>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Preview
                </label>
                
                {/* Image Preview */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    {isEditing ? (
                      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary/30 bg-gray-100">
                        <div 
                          className="w-full h-full relative cursor-move"
                          onMouseDown={handleMouseDown}
                        >
                          <img
                            ref={imageRef}
                            src={previewUrl}
                            alt="Preview"
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{
                              transform: `
                                translate(${imageTransform.translateX}px, ${imageTransform.translateY}px) 
                                scale(${imageTransform.scale}) 
                                rotate(${imageTransform.rotation}deg)
                              `,
                              transformOrigin: 'center center'
                            }}
                            onError={() => {
                              setPreviewUrl(null);
                              toast.error('Invalid image URL');
                            }}
                          />
                        </div>
                        <div className="absolute inset-0 border-2 border-dashed border-primary/50 rounded-full pointer-events-none">
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-primary rounded-full"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                          onError={() => {
                            setPreviewUrl(null);
                            toast.error('Invalid image URL');
                          }}
                        />
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Edit Controls */}
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditImage}
                      className="flex items-center space-x-2"
                    >
                      <Crop className="h-4 w-4" />
                      <span>Edit Image</span>
                    </Button>
                  ) : (
                    <div className="space-y-3 w-full">
                      {/* Edit Toolbar */}
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleZoomIn}
                          title="Zoom In"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleZoomOut}
                          title="Zoom Out"
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRotate}
                          title="Rotate"
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleReset}
                          title="Reset"
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* History Controls */}
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleUndo}
                          disabled={currentEditIndex <= 0}
                          title="Undo"
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRedo}
                          disabled={currentEditIndex >= editHistory.length - 1}
                          title="Redo"
                        >
                          <Undo2 className="h-4 w-4 rotate-180" />
                        </Button>
                      </div>

                      {/* Edit Actions */}
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={isSavingEdit}
                          className="flex-1"
                        >
                          {isSavingEdit ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>

                      {/* Instructions */}
                      <div className="text-xs text-gray-600 text-center">
                        <p>• Drag to move the image</p>
                        <p>• Use zoom and rotate buttons to adjust</p>
                        <p>• Center your face in the circle</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hidden canvas for image processing */}
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleUpdateProfilePicture}
                disabled={loading || !imageUrl.trim()}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                {loading ? 'Updating...' : 'Update Picture'}
              </Button>
              {currentAvatar && (
                <Button
                  variant="outline"
                  onClick={handleRemoveProfilePicture}
                  disabled={loading}
                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>

            {/* Help Text */}
            <div className="bg-blue-50/50 border border-blue-200/30 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium">Tips for best results:</p>
                  <ul className="mt-1 space-y-1">
                    <li>• Use square images (1:1 ratio) for best display</li>
                    <li>• Recommended size: 200x200 pixels or larger</li>
                    <li>• Supported formats: JPG, PNG, GIF, WebP</li>
                    <li>• Keep file size under 10MB</li>
                    <li>• Use the edit feature to center your face in the circle</li>
                    <li>• Drag to move, zoom to resize, rotate to adjust orientation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
