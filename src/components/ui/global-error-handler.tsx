import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { MLError, MLErrorHandler } from '@/utils/error-handling';
import { useOffline } from '@/hooks/use-offline';
import { cn } from '@/lib/utils';

interface GlobalErrorState {
  errors: MLError[];
  isVisible: boolean;
}

interface GlobalErrorHandlerProps {
  maxErrors?: number;
  autoHideDelay?: number;
  className?: string;
}

export const GlobalErrorHandler: React.FC<GlobalErrorHandlerProps> = ({
  maxErrors = 3,
  autoHideDelay = 5000,
  className
}) => {
  const [errorState, setErrorState] = useState<GlobalErrorState>({
    errors: [],
    isVisible: false
  });
  const { isOnline } = useOffline();

  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const error = MLErrorHandler.wrapError(new Error(event.message));
      addError(error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = MLErrorHandler.wrapError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      );
      addError(error);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const addError = (error: MLError) => {
    setErrorState(prev => {
      const newErrors = [error, ...prev.errors].slice(0, maxErrors);
      return {
        errors: newErrors,
        isVisible: true
      };
    });

    // Auto-hide after delay if error is recoverable
    if (error.recoverable && autoHideDelay > 0) {
      setTimeout(() => {
        removeError(error);
      }, autoHideDelay);
    }
  };

  const removeError = (errorToRemove: MLError) => {
    setErrorState(prev => {
      const newErrors = prev.errors.filter(error => error !== errorToRemove);
      return {
        errors: newErrors,
        isVisible: newErrors.length > 0
      };
    });
  };

  const clearAllErrors = () => {
    setErrorState({
      errors: [],
      isVisible: false
    });
  };

  const retryError = async (error: MLError) => {
    // Remove the error from display
    removeError(error);
    
    // If it's a network error and we're back online, suggest refresh
    if (error.category === 'network' && isOnline) {
      window.location.reload();
    }
  };

  if (!errorState.isVisible || errorState.errors.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      'fixed top-4 right-4 z-50 space-y-2 max-w-sm',
      className
    )}>
      {errorState.errors.map((error, index) => (
        <Card
          key={`${error.code}-${index}`}
          className={cn(
            'border-red-500/20 bg-red-500/10 backdrop-blur-sm animate-in slide-in-from-right duration-300',
            error.category === 'network' && 'border-orange-500/20 bg-orange-500/10'
          )}
        >
          <CardContent className="p-3">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 mt-0.5">
                {error.category === 'network' ? (
                  isOnline ? <Wifi className="w-4 h-4 text-orange-400" /> : <WifiOff className="w-4 h-4 text-orange-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-red-400 mb-1">
                      {error.category === 'network' ? 'Connection Issue' : 'Error'}
                    </h4>
                    <p className="text-xs text-red-300 leading-relaxed">
                      {error.userMessage}
                    </p>
                    
                    {process.env.NODE_ENV === 'development' && error.technicalDetails && (
                      <details className="mt-2">
                        <summary className="text-xs text-red-400 cursor-pointer">
                          Technical Details
                        </summary>
                        <p className="text-xs text-red-300 mt-1 font-mono">
                          {error.technicalDetails}
                        </p>
                      </details>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeError(error)}
                    className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                
                {error.recoverable && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => retryError(error)}
                      className="h-6 px-2 text-xs border-red-500/20 hover:bg-red-500/10 text-red-400"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Retry
                    </Button>
                    
                    {errorState.errors.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllErrors}
                        className="h-6 px-2 text-xs text-red-400 hover:text-red-300"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Hook to manually trigger global errors
export const useGlobalErrorHandler = () => {
  const triggerError = (error: Error | string, category?: MLError['category']) => {
    const mlError = typeof error === 'string' 
      ? MLErrorHandler.createError(error, 'MANUAL_ERROR', category || 'unknown')
      : MLErrorHandler.wrapError(error);
    
    // Dispatch custom event that GlobalErrorHandler will catch
    window.dispatchEvent(new ErrorEvent('error', {
      message: mlError.message,
      error: mlError
    }));
  };

  return { triggerError };
};

// Context for error handling throughout the app
interface ErrorContextValue {
  reportError: (error: Error | string, context?: Record<string, any>) => void;
  clearErrors: () => void;
}

const ErrorContext = React.createContext<ErrorContextValue | null>(null);

export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const reportError = (error: Error | string, context?: Record<string, any>) => {
    const mlError = typeof error === 'string' 
      ? MLErrorHandler.createError(error, 'REPORTED_ERROR', 'unknown')
      : MLErrorHandler.wrapError(error);
    
    MLErrorHandler.logError(mlError, context);
    
    // Trigger global error handler
    window.dispatchEvent(new ErrorEvent('error', {
      message: mlError.message,
      error: mlError
    }));
  };

  const clearErrors = () => {
    // Dispatch custom event to clear errors
    window.dispatchEvent(new CustomEvent('clearErrors'));
  };

  return (
    <ErrorContext.Provider value={{ reportError, clearErrors }}>
      {children}
      <GlobalErrorHandler />
    </ErrorContext.Provider>
  );
};

export const useErrorReporting = () => {
  const context = React.useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorReporting must be used within ErrorProvider');
  }
  return context;
};