import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { handleSessionExpired, isAuthError, shouldRedirectToLogin } from './session-utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3003';
console.log('API_BASE_URL configured as:', API_BASE_URL);
console.log('Environment variables:', {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  API_URL: process.env.API_URL,
  NODE_ENV: process.env.NODE_ENV
});

// Request deduplication map
const pendingRequests = new Map<string, Promise<AxiosResponse>>();

// Rate limiting state - more lenient for better UX
const rateLimitState = {
  requests: 0,
  windowStart: Date.now(),
  windowSize: 60000, // 1 minute window
  maxRequests: process.env.NODE_ENV === 'development' ? 1000 : 100, // Much more lenient
  retryAfter: 0,
};

// Exponential backoff configuration
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  retryableStatusCodes: [429, 500, 502, 503, 504],
};

// Utility function to create request key for deduplication
const createRequestKey = (config: AxiosRequestConfig): string => {
  return `${config.method?.toUpperCase()}_${config.url}_${JSON.stringify(config.params || {})}`;
};

// Utility function to check if we should retry
const shouldRetry = (error: AxiosError, attempt: number): boolean => {
  if (attempt >= retryConfig.maxRetries) return false;
  if (!error.response) return true; // Network error
  return retryConfig.retryableStatusCodes.includes(error.response.status);
};

// Utility function to calculate delay with exponential backoff
const calculateDelay = (attempt: number): number => {
  const delay = retryConfig.baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
  return Math.min(delay + jitter, retryConfig.maxDelay);
};

// Rate limiting check
const checkRateLimit = (): boolean => {
  const now = Date.now();
  
  // Reset window if needed
  if (now - rateLimitState.windowStart > rateLimitState.windowSize) {
    rateLimitState.requests = 0;
    rateLimitState.windowStart = now;
    rateLimitState.retryAfter = 0;
  }
  
  // Check if we're within rate limit
  if (rateLimitState.requests >= rateLimitState.maxRequests) {
    rateLimitState.retryAfter = rateLimitState.windowSize - (now - rateLimitState.windowStart);
    return false;
  }
  
  rateLimitState.requests++;
  return true;
};

// Wait for rate limit reset
const waitForRateLimitReset = (): Promise<void> => {
  return new Promise((resolve) => {
    const waitTime = rateLimitState.retryAfter;
    if (waitTime > 0) {
      console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
      setTimeout(resolve, waitTime);
    } else {
      resolve();
    }
  });
};

export const apiClient = axios.create({
  baseURL: process.env.NODE_ENV === 'development' ? '/api/v1' : `${API_BASE_URL}/api/v1`,
  timeout: 15000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor with deduplication and rate limiting
apiClient.interceptors.request.use(
  async (config) => {
    // Debug logging
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    console.log('API Request Data:', config.data);
    
    // Initialize retry count if not present
    if (!config._retryCount) {
      config._retryCount = 0;
    }

    // Check rate limit
    if (!checkRateLimit()) {
      await waitForRateLimitReset();
    }

    // Deduplication disabled due to config handling issues
    // Create request key for deduplication
    // const requestKey = createRequestKey(config);
    
    // Check if same request is already pending
    // if (pendingRequests.has(requestKey)) {
    //   console.log('Deduplicating request:', config.url);
    //   const cachedConfig = pendingRequests.get(requestKey)!;
    //   // Ensure the cached config also has _retryCount
    //   if (!cachedConfig._retryCount) {
    //     cachedConfig._retryCount = 0;
    //   }
    //   return cachedConfig;
    // }

    // Add auth token
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Create promise for this request (disabled deduplication)
    // const requestPromise = axios(config).finally(() => {
    //   pendingRequests.delete(requestKey);
    // });

    // Store pending request (disabled)
    // pendingRequests.set(requestKey, requestPromise);

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic
apiClient.interceptors.response.use(
  (response) => {
    // Debug logging
    console.log('API Response:', response.status, response.config.url);
    console.log('API Response Data:', response.data);
    
    // Clear retry after on successful response
    rateLimitState.retryAfter = 0;
    
    // Emit success event for UI components
    window.dispatchEvent(new CustomEvent('request-success', {
      detail: {
        url: response.config.url,
        status: response.status
      }
    }));
    
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as AxiosRequestConfig & { _retryCount?: number };
    
    // Initialize retry count
    if (!config._retryCount) {
      config._retryCount = 0;
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      if (retryAfter) {
        rateLimitState.retryAfter = parseInt(retryAfter) * 1000;
        console.log(`Rate limited by server. Retry after ${retryAfter} seconds`);
      } else {
        rateLimitState.retryAfter = calculateDelay(config._retryCount);
      }
    }

    // Check if we should retry
    if (shouldRetry(error, config._retryCount)) {
      config._retryCount++;
      
      // Wait before retry
      const delay = calculateDelay(config._retryCount - 1);
      console.log(`Retrying request ${config.url} in ${delay}ms (attempt ${config._retryCount})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry the request
      return apiClient(config);
    }

    // Handle auth errors
    if (isAuthError(error)) {
      const isLoginRequest = config.url?.includes('/auth/login');
      
      if (!isLoginRequest && shouldRedirectToLogin()) {
        handleSessionExpired();
      }
    }

    // Log error details for debugging
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded:', {
        url: config.url,
        status: error.response.status,
        retryAfter: error.response.headers['retry-after'],
        attempt: config._retryCount
      });
      
      // Emit rate limit event for UI components
      window.dispatchEvent(new CustomEvent('rate-limit-exceeded', {
        detail: {
          url: config.url,
          retryAfter: parseInt(error.response.headers['retry-after'] || '0'),
          attempt: config._retryCount
        }
      }));
    } else if (error.response?.status >= 500) {
      // Emit server error event
      window.dispatchEvent(new CustomEvent('request-error', {
        detail: {
          url: config.url,
          status: error.response.status,
          attempt: config._retryCount
        }
      }));
    }

    return Promise.reject(error);
  }
);

// Utility function to make requests with better error handling
export const makeRequest = async <T = any>(
  config: AxiosRequestConfig,
  options?: {
    retryOnFailure?: boolean;
    timeout?: number;
  }
): Promise<T> => {
  try {
    const response = await apiClient({
      ...config,
      timeout: options?.timeout || 15000,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response?.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      
      if (axiosError.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      
      if (!axiosError.response) {
        throw new Error('Network error. Please check your connection and try again.');
      }
    }
    
    throw error;
  }
};

export default apiClient;




