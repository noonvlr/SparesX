import { useState, useCallback, useRef, useEffect } from 'react';
import { apiClient, makeRequest } from '../api-client';
import { AxiosRequestConfig } from 'axios';

interface UseApiRequestOptions {
  immediate?: boolean;
  retryOnFailure?: boolean;
  timeout?: number;
  debounceMs?: number;
}

interface UseApiRequestReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (config?: AxiosRequestConfig) => Promise<T | null>;
  reset: () => void;
}

export function useApiRequest<T = any>(
  config: AxiosRequestConfig,
  options: UseApiRequestOptions = {}
): UseApiRequestReturn<T> {
  const {
    immediate = false,
    retryOnFailure = true,
    timeout = 15000,
    debounceMs = 0,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const execute = useCallback(async (overrideConfig?: AxiosRequestConfig): Promise<T | null> => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    return new Promise((resolve) => {
      const executeRequest = async () => {
        if (!isMountedRef.current) {
          resolve(null);
          return;
        }

        try {
          setLoading(true);
          setError(null);

          // Create new abort controller
          abortControllerRef.current = new AbortController();

          const requestConfig: AxiosRequestConfig = {
            ...config,
            ...overrideConfig,
            signal: abortControllerRef.current.signal,
            timeout,
          };

          const response = await makeRequest<T>(requestConfig, {
            retryOnFailure,
            timeout,
          });

          if (isMountedRef.current) {
            setData(response);
            setError(null);
          }

          resolve(response);
        } catch (err: any) {
          if (isMountedRef.current) {
            if (err.name === 'AbortError') {
              console.log('Request aborted');
            } else {
              const errorMessage = err.message || 'An error occurred';
              setError(errorMessage);
              console.error('API request error:', errorMessage);
            }
          }
          resolve(null);
        } finally {
          if (isMountedRef.current) {
            setLoading(false);
          }
        }
      };

      if (debounceMs > 0) {
        debounceTimeoutRef.current = setTimeout(executeRequest, debounceMs);
      } else {
        executeRequest();
      }
    });
  }, [config, retryOnFailure, timeout, debounceMs]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [immediate, execute]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

// Hook for polling data
export function useApiPolling<T = any>(
  config: AxiosRequestConfig,
  interval: number = 30000,
  options: UseApiRequestOptions = {}
) {
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const errorCountRef = useRef(0);
  const maxErrors = 5;

  const apiRequest = useApiRequest<T>(config, {
    ...options,
    immediate: false,
  });

  const startPolling = useCallback(() => {
    if (isPolling) return;

    setIsPolling(true);
    errorCountRef.current = 0;

    const poll = async () => {
      try {
        await apiRequest.execute();
        errorCountRef.current = 0; // Reset error count on success
      } catch (error) {
        errorCountRef.current++;
        console.warn(`Polling error ${errorCountRef.current}/${maxErrors}:`, error);
        
        // Stop polling after too many errors
        if (errorCountRef.current >= maxErrors) {
          console.error('Too many polling errors, stopping...');
          stopPolling();
        }
      }
    };

    // Initial poll
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, interval);
  }, [apiRequest, interval, isPolling]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    ...apiRequest,
    isPolling,
    startPolling,
    stopPolling,
  };
}


