'use client';

import { useState, useEffect } from 'react';
import { Input } from '@sparesx/ui';
import { usePincodeLookup } from '@/lib/hooks/use-pincode-lookup';
import { MapPin, CheckCircle, AlertCircle } from 'lucide-react';

interface AddressData {
  address: string;
  city: string;
  state: string;
  district: string;
  pincode: string;
  country: string;
}

interface AddressFormProps {
  initialData?: Partial<AddressData>;
  onAddressChange: (address: AddressData) => void;
  disabled?: boolean;
}

export function AddressForm({ initialData, onAddressChange, disabled = false }: AddressFormProps) {
  const [formData, setFormData] = useState<AddressData>({
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    district: initialData?.district || '',
    pincode: initialData?.pincode || '',
    country: initialData?.country || 'India',
  });

  const [pincodeValidated, setPincodeValidated] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  
  const { lookupPincode, isLoading: pincodeLoading, error: pincodeLookupError } = usePincodeLookup();

  // Update parent component when form data changes
  useEffect(() => {
    onAddressChange(formData);
  }, [formData, onAddressChange]);

  const handleInputChange = (field: keyof AddressData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Reset pincode validation when pincode changes
    if (field === 'pincode') {
      setPincodeValidated(false);
      setPincodeError(null);
    }
  };

  const handlePincodeBlur = async () => {
    if (!formData.pincode || formData.pincode.length !== 6) {
      if (formData.pincode.length > 0) {
        setPincodeError('Please enter a valid 6-digit pincode');
      }
      return;
    }

    const locationData = await lookupPincode(formData.pincode);
    
    if (locationData) {
      setFormData(prev => ({
        ...prev,
        state: locationData.state,
        district: locationData.district,
        city: locationData.city,
      }));
      setPincodeValidated(true);
      setPincodeError(null);
    } else {
      setPincodeError(pincodeLookupError || 'Pincode not found');
      setPincodeValidated(false);
    }
  };

  const validatePincode = (pincode: string) => {
    return /^\d{6}$/.test(pincode);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pincode with auto-lookup */}
        <div className="md:col-span-2">
          <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-2">
            Pincode *
          </label>
          <div className="relative">
            <Input
              id="pincode"
              type="text"
              placeholder="Enter 6-digit pincode"
              value={formData.pincode}
              onChange={(e) => handleInputChange('pincode', e.target.value)}
              onBlur={handlePincodeBlur}
              disabled={disabled}
              maxLength={6}
              className={`${
                pincodeValidated 
                  ? 'border-green-500 bg-green-50' 
                  : pincodeError 
                  ? 'border-red-500 bg-red-50' 
                  : ''
              }`}
            />
            {pincodeLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              </div>
            )}
            {pincodeValidated && !pincodeLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            )}
          </div>
          {pincodeError && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {pincodeError}
            </p>
          )}
          {pincodeValidated && (
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Location found and auto-filled
            </p>
          )}
        </div>

        {/* State */}
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
            State *
          </label>
          <Input
            id="state"
            type="text"
            placeholder="State"
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            disabled={disabled}
            className={pincodeValidated ? 'bg-green-50' : ''}
          />
        </div>

        {/* District */}
        <div>
          <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">
            District *
          </label>
          <Input
            id="district"
            type="text"
            placeholder="District"
            value={formData.district}
            onChange={(e) => handleInputChange('district', e.target.value)}
            disabled={disabled}
            className={pincodeValidated ? 'bg-green-50' : ''}
          />
        </div>

        {/* City */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <Input
            id="city"
            type="text"
            placeholder="City"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            disabled={disabled}
            className={pincodeValidated ? 'bg-green-50' : ''}
          />
        </div>

        {/* Country */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <Input
            id="country"
            type="text"
            placeholder="Country"
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
          Full Address *
        </label>
        <textarea
          id="address"
          placeholder="Enter your complete address (house number, street, area, etc.)"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          disabled={disabled}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* Help text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-700">
            <p className="font-medium">Address Tips:</p>
            <ul className="mt-1 space-y-1">
              <li>• Enter your pincode first to auto-fill state, district, and city</li>
              <li>• Provide your complete address including house number and street</li>
              <li>• This information will be used for delivery and contact purposes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
