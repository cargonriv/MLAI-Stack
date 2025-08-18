/**
 * Enhanced Error Boundary with ML-specific error handling and recovery options
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Settings, Info, Wifi, WifiOff } from 'lucide-react';
import { errorHandler } from '@/utils/errorHandler';
import { deviceCompatibility } from '@/utils/deviceCompatibility';
import { fallbackManager } from '@/utils/fallbackManager';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableFallback?: boolean;
  showTechnicalDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRecovering: boolean;
  recoveryAttempts: number;
  showTechnicalDetails: boolean;
  networkStatus: 'online' | 'offline' | 'unknown';
  deviceCompatible: boolean;
  fallbackAvailable: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRecoveryAttempts = 3;
  private networkStatusInterval?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
      recoveryAttempts: 0,
      showTechnicalDetails: props.showTechnicalDetails || false,
      networkStatus: navigator.onLine ? 'online' : 'offline',
      deviceCompatible: true,
      fallbackAvailable: false
    };
  }

  componentDidMount() {
    // Monitor network status
    this.startNetworkMonitoring();
    
    // Check device compatibility
    this.checkDeviceCompatibility();
    
    // Check fallback availability
    this.checkFallbackAvailability();
  }

  componentWillUnmount() {
    if (this.networkStatusInterval) {
      clearInterval(this.networkStatusInterval);
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      errorInfo
    });

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to error handler
    this.reportError(error, errorInfo);
  }

  private startNetworkMonitoring() {
    // Initial status
    this.setState({ networkStatus: navigator.onLine ? 'online' : 'offline' });

    // Listen for network changes
    window.addEventListener('online', this.handleNetworkOnline);
    window.addEventListener('offline', this.handleNetworkOffline);

    // Periodic connectivity check
    this.networkStatusInterval = setInterval(() => {
      this.checkNetworkConnectivity();
    }, 30000); // Check every 30 seconds
  }

  private handleNetworkOnline = () => {
    this.setState({ networkStatus: 'online' });
  };

  private handleNetworkOffline = () => {
    this.setState({ networkStatus: 'offline' });
  };

  private async checkNetworkConnectivity() {
    try {
      const response = await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      this.setState({ 
        networkStatus: response.ok ? 'online' : 'offline' 
      });
    } catch {
      this.setState({ networkStatus: 'offline' });
    }
  }

  private async checkDeviceCompatibility() {
    try {
      const compatibility = await deviceCompatibility.checkCompatibility();
      this.setState({ 
        deviceCompatible: compatibility.isSupported 
      });
    } catch (error) {
      console.warn('Failed to check device compatibility:', error);
      this.setState({ deviceCompatible: false });
    }
  }

  private async checkFallbackAvailability() {
    try {
      const available = await fallbackManager.canUseFallback();
      this.setState({ fallbackAvailable: available });
    } catch (error) {
      console.warn('Failed to check fallback availability:', error);
      this.setState({ fallbackAvailable: false });
    }
  }

  private async reportError(error: Error, errorInfo: ErrorInfo) {
    try {
      await errorHandler.handleError(error, {
        operation: 'react-component',
        timestamp: Date.now(),
        deviceInfo: await deviceCompatibility.checkCompatibility().then(c => c.browser as any),
        networkStatus: this.state.networkStatus
      });
    } catch (reportingError) {
      console.warn('Failed to report error:', reportingError);
    }
  }

  private handleRetry = async () => {
    if (this.state.recoveryAttempts >= this.maxRecoveryAttempts) {
      return;
    }

    this.setState({ 
      isRecovering: true,
      recoveryAttempts: this.state.recoveryAttempts + 1
    });

    try {
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset error state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRecovering: false
      });
    } catch (error) {
      console.error('Recovery failed:', error);
      this.setState({ isRecovering: false });
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleFallbackMode = async () => {
    if (!this.state.fallbackAvailable) {
      return;
    }

    try {
      // Enable fallback mode
      await fallbackManager.preloadOfflineContent();
      
      // Reset error state to try with fallback
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    } catch (error) {
      console.error('Failed to enable fallback mode:', error);
    }
  };

  private toggleTechnicalDetails = () => {
    this.setState({ 
      showTechnicalDetails: !this.state.showTechnicalDetails 
    });
  };

  private getErrorType(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network Error';
    } else if (message.includes('memory') || message.includes('allocation')) {
      return 'Memory Error';
    } else if (message.includes('model') || message.includes('loading')) {
      return 'Model Loading Error';
    } else if (message.includes('webgl') || message.includes('webassembly')) {
      return 'Device Compatibility Error';
    } else {
      return 'Application Error';
    }
  }

  private getErrorSuggestions(error: Error): string[] {
    const suggestions: string[] = [];
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || this.state.networkStatus === 'offline') {
      suggestions.push('Check your internet connection');
      suggestions.push('Try again when back online');
      if (this.state.fallbackAvailable) {
        suggestions.push('Use offline mode with cached results');
      }
    }
    
    if (message.includes('memory')) {
      suggestions.push('Close other browser tabs to free memory');
      suggestions.push('Try using a smaller model');
      suggestions.push('Restart your browser');
    }
    
    if (message.includes('webgl') || message.includes('webassembly')) {
      suggestions.push('Update your browser to the latest version');
      suggestions.push('Enable hardware acceleration in browser settings');
      suggestions.push('Try using CPU mode instead');
    }
    
    if (!this.state.deviceCompatible) {
      suggestions.push('Your browser may not support all features');
      suggestions.push('Try using Chrome or Firefox for best compatibility');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Try refreshing the page');
      suggestions.push('Clear browser cache and cookies');
    }
    
    return suggestions;
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      const errorType = error ? this.getErrorType(error) : 'Unknown Error';
      const suggestions = error ? this.getErrorSuggestions(error) : [];
      const canRetry = this.state.recoveryAttempts < this.maxRecoveryAttempts;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                {errorType}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Message */}
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {error?.message || 'An unexpected error occurred'}
                </AlertDescription>
              </Alert>

              {/* Network Status */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {this.state.networkStatus === 'online' ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                Network: {this.state.networkStatus}
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Suggestions:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    disabled={this.state.isRecovering}
                    variant="default"
                    size="sm"
                  >
                    {this.state.isRecovering ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again ({this.maxRecoveryAttempts - this.state.recoveryAttempts} left)
                      </>
                    )}
                  </Button>
                )}

                {this.state.fallbackAvailable && this.props.enableFallback && (
                  <Button
                    onClick={this.handleFallbackMode}
                    variant="outline"
                    size="sm"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Use Fallback Mode
                  </Button>
                )}

                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>

                <Button
                  onClick={this.toggleTechnicalDetails}
                  variant="ghost"
                  size="sm"
                >
                  <Info className="w-4 h-4 mr-2" />
                  {this.state.showTechnicalDetails ? 'Hide' : 'Show'} Details
                </Button>
              </div>

              {/* Technical Details */}
              {this.state.showTechnicalDetails && (
                <details className="bg-muted/50 rounded-lg p-3">
                  <summary className="cursor-pointer font-medium text-sm mb-2">
                    Technical Information
                  </summary>
                  <div className="space-y-2 text-xs font-mono">
                    <div>
                      <strong>Error:</strong> {error?.name || 'Unknown'}
                    </div>
                    <div>
                      <strong>Message:</strong> {error?.message || 'No message'}
                    </div>
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 p-2 bg-background rounded text-xs overflow-auto max-h-32">
                        {error?.stack || 'No stack trace available'}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 p-2 bg-background rounded text-xs overflow-auto max-h-32">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                    <div>
                      <strong>Browser:</strong> {navigator.userAgent}
                    </div>
                    <div>
                      <strong>Timestamp:</strong> {new Date().toISOString()}
                    </div>
                  </div>
                </details>
              )}

              {/* Recovery Attempts */}
              {this.state.recoveryAttempts > 0 && (
                <div className="text-xs text-muted-foreground">
                  Recovery attempts: {this.state.recoveryAttempts}/{this.maxRecoveryAttempts}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default ErrorBoundary;