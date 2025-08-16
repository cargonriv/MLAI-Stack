import { useState, useEffect, useCallback } from 'react';

interface OfflineOptions {
  onOnline?: () => void;
  onOffline?: () => void;
  checkInterval?: number;
  pingUrl?: string;
}

interface OfflineState {
  isOnline: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
}

export const useOffline = (options: OfflineOptions = {}) => {
  const {
    onOnline,
    onOffline,
    checkInterval = 30000, // 30 seconds
    pingUrl = '/favicon.ico'
  } = options;

  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isChecking: false,
    lastChecked: null
  });

  // Enhanced connectivity check
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isChecking: true }));

    try {
      // Try to fetch a small resource
      const response = await fetch(pingUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      const isOnline = response.ok;
      setState(prev => ({
        ...prev,
        isOnline,
        isChecking: false,
        lastChecked: new Date()
      }));
      
      return isOnline;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isOnline: false,
        isChecking: false,
        lastChecked: new Date()
      }));
      
      return false;
    }
  }, [pingUrl]);

  // Handle browser online/offline events
  useEffect(() => {
    const handleOnline = async () => {
      const isActuallyOnline = await checkConnectivity();
      if (isActuallyOnline && !state.isOnline) {
        onOnline?.();
      }
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false, lastChecked: new Date() }));
      onOffline?.();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnectivity, state.isOnline, onOnline, onOffline]);

  // Periodic connectivity check
  useEffect(() => {
    if (checkInterval <= 0) return;

    const interval = setInterval(async () => {
      const wasOnline = state.isOnline;
      const isOnline = await checkConnectivity();
      
      if (wasOnline !== isOnline) {
        if (isOnline) {
          onOnline?.();
        } else {
          onOffline?.();
        }
      }
    }, checkInterval);

    return () => clearInterval(interval);
  }, [checkConnectivity, checkInterval, state.isOnline, onOnline, onOffline]);

  return {
    ...state,
    checkConnectivity
  };
};

// Hook for handling offline-first data
export const useOfflineData = <T,>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    cacheTimeout?: number;
    retryOnReconnect?: boolean;
  } = {}
) => {
  const { cacheTimeout = 300000, retryOnReconnect = true } = options; // 5 minutes default
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  
  const { isOnline } = useOffline({
    onOnline: () => {
      if (retryOnReconnect && error) {
        fetchData();
      }
    }
  });

  // Cache management
  const getCachedData = useCallback((): { data: T; timestamp: number } | null => {
    try {
      const cached = localStorage.getItem(`offline_cache_${key}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        const isExpired = Date.now() - parsed.timestamp > cacheTimeout;
        return isExpired ? null : parsed;
      }
    } catch (error) {
      console.warn('Failed to read from cache:', error);
    }
    return null;
  }, [key, cacheTimeout]);

  const setCachedData = useCallback((data: T) => {
    try {
      localStorage.setItem(`offline_cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to write to cache:', error);
    }
  }, [key]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isOnline) {
        // Try to fetch fresh data
        const freshData = await fetcher();
        setData(freshData);
        setIsFromCache(false);
        setCachedData(freshData);
      } else {
        // Use cached data if offline
        const cached = getCachedData();
        if (cached) {
          setData(cached.data);
          setIsFromCache(true);
        } else {
          throw new Error('No cached data available while offline');
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      
      // Try to use cached data as fallback
      const cached = getCachedData();
      if (cached) {
        setData(cached.data);
        setIsFromCache(true);
        setError(new Error('Using cached data due to network error'));
      } else {
        setError(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, fetcher, getCachedData, setCachedData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    isFromCache,
    isOnline,
    refetch: fetchData
  };
};

// Component for displaying offline status
export const OfflineIndicator: React.FC<{ className?: string }> = ({ className }) => {
  const { isOnline, isChecking } = useOffline();

  if (isOnline) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white p-2 text-center text-sm ${className}`}>
      <div className="flex items-center justify-center space-x-2">
        {isChecking ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Checking connection...</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-white rounded-full" />
            <span>You're offline. Some features may be limited.</span>
          </>
        )}
      </div>
    </div>
  );
};