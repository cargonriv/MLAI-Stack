import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Bug, Zap } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AsyncState, LoadingFallback } from '@/components/ui/loading-fallback';
import { useRetry } from '@/hooks/use-retry';
import { useOffline } from '@/hooks/use-offline';
import { useGracefulAnimation } from '@/hooks/use-graceful-animation';
import { useErrorReporting } from '@/components/ui/global-error-handler';
import { MLErrorHandler } from '@/utils/error-handling';

// Component that intentionally throws errors for testing
const ErrorThrowingComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Intentional test error from component');
  }
  
  return (
    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
      <p className="text-green-400">Component rendered successfully!</p>
    </div>
  );
};

// Async operation that can fail
const simulateAsyncOperation = async (shouldFail: boolean, delay: number = 1000): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, delay));
  
  if (shouldFail) {
    throw MLErrorHandler.createError(
      'Simulated async operation failure',
      'ASYNC_FAIL',
      'processing',
      true,
      'This is a test error for demonstration purposes'
    );
  }
  
  return 'Async operation completed successfully!';
};

export const ErrorHandlingDemo: React.FC = () => {
  const [componentError, setComponentError] = useState(false);
  const [asyncError, setAsyncError] = useState(false);
  const [asyncData, setAsyncData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [animationError, setAnimationError] = useState(false);
  
  const { isOnline } = useOffline();
  const { reportError } = useErrorReporting();
  
  const { retry, isRetrying, attempt, canRetry } = useRetry({
    maxAttempts: 3,
    delay: 1000,
    onRetry: (attemptNumber) => {
      console.log(`Retrying operation, attempt ${attemptNumber + 1}`);
    }
  });

  const { animate, hasError: animationHasError } = useGracefulAnimation({
    onAnimationError: (error) => {
      setAnimationError(true);
      reportError(error, { component: 'ErrorHandlingDemo', operation: 'animation' });
    }
  });

  const handleAsyncOperation = async () => {
    setIsLoading(true);
    setAsyncData(null);
    setAsyncError(false);
    
    try {
      const result = await retry(() => simulateAsyncOperation(Math.random() > 0.7));
      setAsyncData(result);
    } catch (error) {
      setAsyncError(true);
      reportError(error instanceof Error ? error : new Error(String(error)), {
        component: 'ErrorHandlingDemo',
        operation: 'async-test'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnimationTest = () => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    
    animate(element, [
      { opacity: 0, transform: 'scale(0.5)' },
      { opacity: 1, transform: 'scale(1)' }
    ], { duration: 500 })
      .then(() => {
        console.log('Animation completed successfully');
        document.body.removeChild(element);
      })
      .catch((error) => {
        console.error('Animation failed:', error);
        document.body.removeChild(element);
      });
  };

  const triggerGlobalError = () => {
    reportError('This is a manually triggered global error for testing', {
      component: 'ErrorHandlingDemo',
      operation: 'manual-trigger'
    });
  };

  const triggerNetworkError = () => {
    const networkError = MLErrorHandler.createError(
      'Simulated network failure',
      'NETWORK_TEST',
      'network',
      true,
      'Testing network error handling'
    );
    reportError(networkError);
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bug className="w-5 h-5" />
            <span>Error Handling Demo</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Network Status */}
          <div className="flex items-center space-x-2 p-3 bg-background-secondary rounded-lg">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-orange-400" />
                <span className="text-orange-400">Offline</span>
              </>
            )}
          </div>

          {/* Component Error Boundary Test */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Component Error Boundary</h3>
            <div className="flex space-x-2">
              <Button
                onClick={() => setComponentError(!componentError)}
                variant={componentError ? "destructive" : "default"}
              >
                {componentError ? 'Fix Component' : 'Break Component'}
              </Button>
            </div>
            
            <ErrorBoundary
              onError={(error) => {
                console.log('Component error caught:', error);
              }}
            >
              <ErrorThrowingComponent shouldThrow={componentError} />
            </ErrorBoundary>
          </div>

          {/* Async Operation with Retry */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Async Operation with Retry</h3>
            <div className="flex space-x-2">
              <Button
                onClick={handleAsyncOperation}
                disabled={isLoading || isRetrying}
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Retrying... (Attempt {attempt + 1})
                  </>
                ) : isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Test Async Operation'
                )}
              </Button>
            </div>
            
            <AsyncState
              isLoading={isLoading || isRetrying}
              error={asyncError ? 'Async operation failed after retries' : null}
              onRetry={canRetry ? handleAsyncOperation : undefined}
            >
              {asyncData && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400">{asyncData}</p>
                </div>
              )}
            </AsyncState>
          </div>

          {/* Animation Error Handling */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Animation Error Handling</h3>
            <div className="flex space-x-2">
              <Button onClick={handleAnimationTest}>
                <Zap className="w-4 h-4 mr-2" />
                Test Animation
              </Button>
            </div>
            
            {animationError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <p className="text-red-400">Animation error occurred</p>
                </div>
              </div>
            )}
            
            {animationHasError && (
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <p className="text-orange-400">Animation gracefully degraded</p>
              </div>
            )}
          </div>

          {/* Global Error Triggers */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Global Error Handling</h3>
            <div className="flex space-x-2 flex-wrap gap-2">
              <Button onClick={triggerGlobalError} variant="outline">
                Trigger Global Error
              </Button>
              <Button onClick={triggerNetworkError} variant="outline">
                Trigger Network Error
              </Button>
            </div>
          </div>

          {/* Loading States Demo */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Loading States</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-foreground-secondary mb-2">Spinner</p>
                <LoadingFallback type="spinner" />
              </div>
              <div>
                <p className="text-sm text-foreground-secondary mb-2">Skeleton</p>
                <LoadingFallback type="skeleton" />
              </div>
              <div>
                <p className="text-sm text-foreground-secondary mb-2">Pulse</p>
                <LoadingFallback type="pulse" />
              </div>
              <div>
                <p className="text-sm text-foreground-secondary mb-2">Dots</p>
                <LoadingFallback type="dots" />
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};