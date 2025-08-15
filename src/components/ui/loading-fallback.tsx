import React from 'react';
import { Loader2, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Card, CardContent } from './card';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface LoadingFallbackProps {
  type?: 'spinner' | 'skeleton' | 'pulse' | 'dots';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  type = 'spinner',
  size = 'md',
  message = 'Loading...',
  className
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const containerClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  if (type === 'spinner') {
    return (
      <div className={cn('flex flex-col items-center justify-center', containerClasses[size], className)}>
        <Loader2 className={cn('animate-spin text-accent-primary', sizeClasses[size])} />
        {message && (
          <p className="mt-2 text-sm text-foreground-secondary animate-pulse">
            {message}
          </p>
        )}
      </div>
    );
  }

  if (type === 'skeleton') {
    return (
      <div className={cn('space-y-3', containerClasses[size], className)}>
        <div className="h-4 bg-background-tertiary rounded animate-pulse" />
        <div className="h-4 bg-background-tertiary rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-background-tertiary rounded w-1/2 animate-pulse" />
      </div>
    );
  }

  if (type === 'pulse') {
    return (
      <div className={cn('bg-background-tertiary rounded animate-pulse', containerClasses[size], className)}>
        <div className="h-full w-full bg-gradient-to-r from-transparent via-background-secondary to-transparent animate-pulse" />
      </div>
    );
  }

  if (type === 'dots') {
    return (
      <div className={cn('flex items-center justify-center space-x-1', containerClasses[size], className)}>
        <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-accent-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-accent-tertiary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    );
  }

  return null;
};

interface AsyncStateProps {
  isLoading?: boolean;
  error?: Error | string | null;
  isEmpty?: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}

export const AsyncState: React.FC<AsyncStateProps> = ({
  isLoading,
  error,
  isEmpty,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  onRetry,
  className
}) => {
  if (isLoading) {
    return (
      <div className={className}>
        {loadingComponent || <LoadingFallback />}
      </div>
    );
  }

  if (error) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    return (
      <div className={className}>
        {errorComponent || (
          <Card className="bg-background-secondary/50 backdrop-blur-sm border-red-500/20">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground-primary mb-2">
                Something went wrong
              </h3>
              <p className="text-sm text-foreground-secondary mb-4">
                {errorMessage}
              </p>
              {onRetry && (
                <Button
                  onClick={onRetry}
                  variant="outline"
                  className="border-red-500/20 hover:bg-red-500/10"
                >
                  Try Again
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={className}>
        {emptyComponent || (
          <Card className="bg-background-secondary/50 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-background-tertiary rounded-full mx-auto mb-3 flex items-center justify-center">
                <div className="w-6 h-6 bg-foreground-tertiary/20 rounded" />
              </div>
              <h3 className="text-lg font-semibold text-foreground-primary mb-2">
                No data available
              </h3>
              <p className="text-sm text-foreground-secondary">
                There's nothing to show here yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
};

// Network status component
export const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white p-2 text-center text-sm">
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="w-4 h-4" />
        <span>You're offline. Some features may not work properly.</span>
      </div>
    </div>
  );
};

// Progressive loading component
interface ProgressiveLoadProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export const ProgressiveLoad: React.FC<ProgressiveLoadProps> = ({
  src,
  alt,
  className,
  fallback
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background-tertiary">
          {fallback || <LoadingFallback type="pulse" />}
        </div>
      )}
      
      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background-tertiary">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-foreground-tertiary mx-auto mb-2" />
            <p className="text-sm text-foreground-secondary">Failed to load image</p>
          </div>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={cn('transition-opacity duration-300', isLoaded ? 'opacity-100' : 'opacity-0')}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
};