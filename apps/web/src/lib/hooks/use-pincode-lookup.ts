import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface PincodeData {
  pincode: string;
  state: string;
  district: string;
  city: string;
}

interface UsePincodeLookupReturn {
  lookupPincode: (pincode: string) => Promise<PincodeData | null>;
  isLoading: boolean;
  error: string | null;
}

export function usePincodeLookup(): UsePincodeLookupReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupPincode = async (pincode: string): Promise<PincodeData | null> => {
    if (!pincode || pincode.length !== 6) {
      setError('Please enter a valid 6-digit pincode');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(`/pincode/${pincode}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        setError(response.data.error || 'Pincode not found');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to lookup pincode';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    lookupPincode,
    isLoading,
    error,
  };
}
