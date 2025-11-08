'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@sparesx/ui';
import { Badge } from '@sparesx/ui';
import { Clock, AlertTriangle, CheckCircle, Wifi, WifiOff } from 'lucide-react';

interface RateLimitStatusProps {
  className?: string;
}

export function RateLimitStatus({ className = '' }: RateLimitStatusProps) {
  const [status, setStatus] = useState<'normal' | 'rate-limited' | 'error' | 'offline'>('normal');
  const [retryAfter, setRetryAfter] = useState(0);
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    // Listen for rate limit events
    const handleRateLimit = (event: CustomEvent) => {
      setStatus('rate-limited');
      setRetryAfter(event.detail.retryAfter || 0);
    };

    const handleRequestSuccess = () => {
      setStatus('normal');
      setRetryAfter(0);
    };

    const handleRequestError = (event: CustomEvent) => {
      if (event.detail.status === 429) {
        setStatus('rate-limited');
        setRetryAfter(event.detail.retryAfter || 0);
      } else if (event.detail.status >= 500) {
        setStatus('error');
      }
    };

    const handleOffline = () => setStatus('offline');
    const handleOnline = () => setStatus('normal');

    // Add event listeners
    window.addEventListener('rate-limit-exceeded', handleRateLimit as EventListener);
    window.addEventListener('request-success', handleRequestSuccess as EventListener);
    window.addEventListener('request-error', handleRequestError as EventListener);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('rate-limit-exceeded', handleRateLimit as EventListener);
      window.removeEventListener('request-success', handleRequestSuccess as EventListener);
      window.removeEventListener('request-error', handleRequestError as EventListener);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Countdown timer for retry after
  useEffect(() => {
    if (retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter(prev => {
          if (prev <= 1) {
            setStatus('normal');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [retryAfter]);

  if (status === 'normal') {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'rate-limited':
        return {
          icon: <Clock className="h-4 w-4" />,
          message: retryAfter > 0 ? `Rate limited. Retry in ${retryAfter}s` : 'Rate limited. Please wait...',
          variant: 'destructive' as const,
          className: 'bg-red-50 border-red-200 text-red-800',
        };
      case 'error':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          message: 'Server error. Retrying...',
          variant: 'destructive' as const,
          className: 'bg-orange-50 border-orange-200 text-orange-800',
        };
      case 'offline':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          message: 'You are offline. Check your connection.',
          variant: 'secondary' as const,
          className: 'bg-gray-50 border-gray-200 text-gray-800',
        };
      default:
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          message: 'All systems operational',
          variant: 'default' as const,
          className: 'bg-green-50 border-green-200 text-green-800',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${className}`}>
      <Card className={`shadow-lg border ${config.className}`}>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            {config.icon}
            <span className="text-sm font-medium">{config.message}</span>
            <Badge variant={config.variant} className="text-xs">
              {status === 'rate-limited' ? 'SLOW' : status === 'error' ? 'ERROR' : 'OFFLINE'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


