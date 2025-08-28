import { useState, useCallback, useRef } from 'react';

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  onRetry?: (attempt: number) => void;
  onMaxAttemptsReached?: () => void;
}

interface RetryState {
  isRetrying: boolean;
  attempt: number;
  canRetry: boolean;
  error: Error | null;
}

export const useRetry = (options: RetryOptions = {}) => {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 'exponential',
    onRetry,
    onMaxAttemptsReached
  } = options;

  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    attempt: 0,
    canRetry: true,
    error: null
  });

  const timeoutRef = useRef<NodeJS.Timeout>();

  const calculateDelay = useCallback((attempt: number) => {
    if (backoff === 'exponential') {
      return delay * Math.pow(2, attempt);
    }
    return delay * (attempt + 1);
  }, [delay, backoff]);

  const retry = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    const executeAttempt = async (attemptNumber: number): Promise<T> => {
      try {
        setState(prev => ({
          ...prev,
          isRetrying: attemptNumber > 0,
          attempt: attemptNumber,
          error: null
        }));

        if (attemptNumber > 0 && onRetry) {
          onRetry(attemptNumber);
        }

        const result = await operation();
        
        setState(prev => ({
          ...prev,
          isRetrying: false,
          error: null
        }));

        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        
        if (attemptNumber < maxAttempts - 1) {
          const retryDelay = calculateDelay(attemptNumber);
          
          setState(prev => ({
            ...prev,
            error: err,
            canRetry: true
          }));

          return new Promise((resolve, reject) => {
            timeoutRef.current = setTimeout(() => {
              executeAttempt(attemptNumber + 1).then(resolve).catch(reject);
            }, retryDelay);
          });
        } else {
          setState(prev => ({
            ...prev,
            isRetrying: false,
            canRetry: false,
            error: err
          }));

          if (onMaxAttemptsReached) {
            onMaxAttemptsReached();
          }

          throw err;
        }
      }
    };

    return executeAttempt(0);
  }, [maxAttempts, calculateDelay, onRetry, onMaxAttemptsReached]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setState({
      isRetrying: false,
      attempt: 0,
      canRetry: true,
      error: null
    });
  }, []);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setState(prev => ({
      ...prev,
      isRetrying: false,
      canRetry: false
    }));
  }, []);

  return {
    retry,
    reset,
    cancel,
    ...state
  };
};

// Hook for handling async operations with retry logic
export const useAsyncWithRetry = <T>(
  operation: () => Promise<T>,
  dependencies: React.DependencyList = [],
  options: RetryOptions = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { retry, isRetrying, attempt, canRetry } = useRetry({
    ...options,
    onRetry: (attemptNumber) => {
      console.log(`Retrying operation, attempt ${attemptNumber + 1}`);
      options.onRetry?.(attemptNumber);
    }
  });

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await retry(operation);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [retry, operation]);

  const refetch = useCallback(() => {
    execute();
  }, [execute]);

  React.useEffect(() => {
    execute();
  }, dependencies);

  return {
    data,
    isLoading: isLoading || isRetrying,
    error,
    refetch,
    attempt,
    canRetry,
    isRetrying
  };
};