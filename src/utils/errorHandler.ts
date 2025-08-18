/**
 * Comprehensive error handling and fallback strategies for ML models
 */

import { mlUtils, MLError, DeviceInfo } from './mlUtils';

export interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  fallbackModels?: string[];
  enableOfflineMode?: boolean;
  enableFallbackToSmallerModel?: boolean;
  enableGracefulDegradation?: boolean;
}

export interface FallbackStrategy {
  primaryModel: string;
  fallbackModels: string[];
  offlineMode: boolean;
  cachedResults: boolean;
  smallerModelFallback: boolean;
  gracefulDegradation: boolean;
}

export interface RecoveryAction {
  type: 'retry' | 'fallback' | 'offline' | 'smaller_model' | 'graceful_degradation';
  description: string;
  action: () => Promise<void>;
  priority: number;
}

export interface ErrorContext {
  operation: string;
  modelId?: string;
  deviceInfo?: DeviceInfo;
  memoryUsage?: number;
  networkStatus?: 'online' | 'offline' | 'slow';
  timestamp: number;
}

export class MLErrorHandler {
  private static instance: MLErrorHandler;
  private errorCounts: Map<string, number> = new Map();
  private fallbackStrategies: Map<string, FallbackStrategy> = new Map();
  private cachedResults: Map<string, any> = new Map();
  private networkStatus: 'online' | 'offline' | 'slow' = 'online';
  private deviceCapabilities: DeviceInfo | null = null;

  private constructor() {
    this.initializeNetworkMonitoring();
    this.initializeDefaultFallbackStrategies();
  }

  static getInstance(): MLErrorHandler {
    if (!MLErrorHandler.instance) {
      MLErrorHandler.instance = new MLErrorHandler();
    }
    return MLErrorHandler.instance;
  }

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring(): void {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.networkStatus = 'online';
      console.log('Network status: online');
    });

    window.addEventListener('offline', () => {
      this.networkStatus = 'offline';
      console.log('Network status: offline');
    });

    // Monitor connection speed (basic implementation)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const updateConnectionStatus = () => {
          if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            this.networkStatus = 'slow';
          } else if (this.networkStatus !== 'offline') {
            this.networkStatus = 'online';
          }
        };

        connection.addEventListener('change', updateConnectionStatus);
        updateConnectionStatus();
      }
    }
  }

  /**
   * Initialize default fallback strategies for common models
   */
  private initializeDefaultFallbackStrategies(): void {
    // BERT Sentiment Analysis fallback strategy
    this.fallbackStrategies.set('sentiment-analysis', {
      primaryModel: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
      fallbackModels: [
        'Xenova/bert-base-multilingual-uncased-sentiment',
        'Xenova/roberta-base-sentiment'
      ],
      offlineMode: true,
      cachedResults: true,
      smallerModelFallback: true,
      gracefulDegradation: true
    });

    // Collaborative Filtering fallback strategy
    this.fallbackStrategies.set('collaborative-filtering', {
      primaryModel: 'svd-matrix-factorization',
      fallbackModels: ['popularity-based', 'genre-based'],
      offlineMode: true,
      cachedResults: true,
      smallerModelFallback: true,
      gracefulDegradation: true
    });
  }

  /**
   * Handle errors with comprehensive recovery strategies
   */
  async handleError(
    error: Error,
    context: ErrorContext,
    options: ErrorRecoveryOptions = {}
  ): Promise<{
    recovered: boolean;
    result?: any;
    recoveryActions: RecoveryAction[];
    finalError?: MLError;
  }> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      enableOfflineMode = true,
      enableFallbackToSmallerModel = true,
      enableGracefulDegradation = true
    } = options;

    console.warn(`ML Error in ${context.operation}:`, error);

    // Update device capabilities
    if (!this.deviceCapabilities) {
      this.deviceCapabilities = await mlUtils.device.detectCapabilities();
    }

    // Generate recovery actions
    const recoveryActions = await this.generateRecoveryActions(error, context, options);

    // Try recovery actions in priority order
    for (const action of recoveryActions.sort((a, b) => b.priority - a.priority)) {
      try {
        console.log(`Attempting recovery: ${action.description}`);
        await action.action();
        
        return {
          recovered: true,
          recoveryActions,
          result: null // Action should handle the recovery
        };
      } catch (recoveryError) {
        console.warn(`Recovery action failed: ${action.description}`, recoveryError);
        continue;
      }
    }

    // If all recovery actions failed, create final error
    const finalError = this.createMLError(
      `All recovery attempts failed for ${context.operation}: ${error.message}`,
      'RECOVERY_FAILED',
      context.modelId,
      context.operation,
      false
    );

    return {
      recovered: false,
      recoveryActions,
      finalError
    };
  }

  /**
   * Generate recovery actions based on error type and context
   */
  private async generateRecoveryActions(
    error: Error,
    context: ErrorContext,
    options: ErrorRecoveryOptions
  ): Promise<RecoveryAction[]> {
    const actions: RecoveryAction[] = [];
    const errorMessage = error.message.toLowerCase();

    // Network-related errors
    if (this.isNetworkError(error)) {
      if (this.networkStatus === 'offline' && options.enableOfflineMode) {
        actions.push({
          type: 'offline',
          description: 'Switch to offline mode with cached results',
          action: async () => this.enableOfflineMode(context),
          priority: 8
        });
      }

      if (this.networkStatus === 'slow') {
        actions.push({
          type: 'smaller_model',
          description: 'Switch to smaller model for slow connection',
          action: async () => this.switchToSmallerModel(context),
          priority: 7
        });
      }

      // Retry with exponential backoff for network errors
      actions.push({
        type: 'retry',
        description: 'Retry with exponential backoff',
        action: async () => this.retryWithBackoff(context, options.maxRetries || 3),
        priority: 6
      });
    }

    // Memory-related errors
    if (this.isMemoryError(error)) {
      actions.push({
        type: 'smaller_model',
        description: 'Switch to smaller model due to memory constraints',
        action: async () => this.switchToSmallerModel(context),
        priority: 9
      });

      actions.push({
        type: 'graceful_degradation',
        description: 'Enable memory-efficient processing',
        action: async () => this.enableMemoryEfficientMode(context),
        priority: 8
      });
    }

    // Device compatibility errors
    if (this.isDeviceCompatibilityError(error)) {
      actions.push({
        type: 'fallback',
        description: 'Switch to CPU-compatible model',
        action: async () => this.switchToCompatibleDevice(context),
        priority: 9
      });
    }

    // Model loading errors
    if (this.isModelLoadingError(error)) {
      const strategy = this.fallbackStrategies.get(context.operation);
      if (strategy && strategy.fallbackModels.length > 0) {
        actions.push({
          type: 'fallback',
          description: 'Switch to fallback model',
          action: async () => this.switchToFallbackModel(context),
          priority: 8
        });
      }

      actions.push({
        type: 'retry',
        description: 'Retry model loading with different configuration',
        action: async () => this.retryWithDifferentConfig(context),
        priority: 7
      });
    }

    // Timeout errors
    if (this.isTimeoutError(error)) {
      actions.push({
        type: 'retry',
        description: 'Retry with increased timeout',
        action: async () => this.retryWithIncreasedTimeout(context),
        priority: 6
      });
    }

    // Generic graceful degradation
    if (options.enableGracefulDegradation) {
      actions.push({
        type: 'graceful_degradation',
        description: 'Enable graceful degradation mode',
        action: async () => this.enableGracefulDegradation(context),
        priority: 5
      });
    }

    return actions;
  }

  /**
   * Error type detection methods
   */
  private isNetworkError(error: Error): boolean {
    const networkPatterns = [
      /network/i,
      /fetch/i,
      /connection/i,
      /timeout/i,
      /cors/i,
      /net::/i,
      /failed to fetch/i
    ];
    return networkPatterns.some(pattern => pattern.test(error.message));
  }

  private isMemoryError(error: Error): boolean {
    const memoryPatterns = [
      /memory/i,
      /out of memory/i,
      /allocation/i,
      /heap/i,
      /oom/i,
      /maximum call stack/i
    ];
    return memoryPatterns.some(pattern => pattern.test(error.message));
  }

  private isDeviceCompatibilityError(error: Error): boolean {
    const devicePatterns = [
      /webgl/i,
      /webassembly/i,
      /wasm/i,
      /gpu/i,
      /device/i,
      /unsupported/i,
      /not supported/i
    ];
    return devicePatterns.some(pattern => pattern.test(error.message));
  }

  private isModelLoadingError(error: Error): boolean {
    const modelPatterns = [
      /model/i,
      /loading/i,
      /download/i,
      /404/i,
      /not found/i,
      /invalid model/i
    ];
    return modelPatterns.some(pattern => pattern.test(error.message));
  }

  private isTimeoutError(error: Error): boolean {
    const timeoutPatterns = [
      /timeout/i,
      /timed out/i,
      /time limit/i,
      /deadline/i
    ];
    return timeoutPatterns.some(pattern => pattern.test(error.message));
  }

  /**
   * Recovery action implementations
   */
  private async enableOfflineMode(context: ErrorContext): Promise<void> {
    console.log('Enabling offline mode for', context.operation);
    
    // Try to use cached results
    const cacheKey = this.generateCacheKey(context);
    const cachedResult = this.cachedResults.get(cacheKey);
    
    if (cachedResult) {
      console.log('Using cached result for offline mode');
      return cachedResult;
    }

    // If no cached results, provide basic fallback
    throw new Error('No cached results available for offline mode');
  }

  private async switchToSmallerModel(context: ErrorContext): Promise<void> {
    console.log('Switching to smaller model for', context.operation);
    
    const strategy = this.fallbackStrategies.get(context.operation);
    if (!strategy || !strategy.smallerModelFallback) {
      throw new Error('No smaller model available');
    }

    // Implementation would depend on the specific model type
    // This is a placeholder for the actual model switching logic
    throw new Error('Smaller model switching not implemented for this operation');
  }

  private async retryWithBackoff(context: ErrorContext, maxRetries: number): Promise<void> {
    const operationId = `${context.operation}_${context.modelId || 'unknown'}`;
    const currentRetries = this.errorCounts.get(operationId) || 0;
    
    if (currentRetries >= maxRetries) {
      throw new Error(`Maximum retries (${maxRetries}) exceeded`);
    }

    this.errorCounts.set(operationId, currentRetries + 1);
    
    // Exponential backoff delay
    const delay = Math.min(1000 * Math.pow(2, currentRetries), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    console.log(`Retrying ${context.operation} (attempt ${currentRetries + 1}/${maxRetries})`);
  }

  private async enableMemoryEfficientMode(context: ErrorContext): Promise<void> {
    console.log('Enabling memory-efficient mode for', context.operation);
    
    // Clear unused models from cache
    const { modelManager } = await import('./modelManager');
    const memoryUsage = modelManager.getMemoryUsage();
    
    if (memoryUsage.used > 400 * 1024 * 1024) { // 400MB threshold
      await modelManager.clearCache();
      console.log('Cleared model cache to free memory');
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  private async switchToCompatibleDevice(context: ErrorContext): Promise<void> {
    console.log('Switching to compatible device for', context.operation);
    
    if (!this.deviceCapabilities) {
      this.deviceCapabilities = await mlUtils.device.detectCapabilities();
    }

    // Force CPU mode for compatibility
    context.deviceInfo = {
      ...this.deviceCapabilities,
      webglSupported: false,
      wasmSupported: true
    };
  }

  private async switchToFallbackModel(context: ErrorContext): Promise<void> {
    console.log('Switching to fallback model for', context.operation);
    
    const strategy = this.fallbackStrategies.get(context.operation);
    if (!strategy || strategy.fallbackModels.length === 0) {
      throw new Error('No fallback models available');
    }

    // This would be implemented by the specific model handlers
    throw new Error('Fallback model switching not implemented for this operation');
  }

  private async retryWithDifferentConfig(context: ErrorContext): Promise<void> {
    console.log('Retrying with different configuration for', context.operation);
    
    // Try with different device settings
    if (context.deviceInfo?.webglSupported) {
      context.deviceInfo.webglSupported = false;
      console.log('Disabled WebGL for retry');
    }
  }

  private async retryWithIncreasedTimeout(context: ErrorContext): Promise<void> {
    console.log('Retrying with increased timeout for', context.operation);
    
    // This would be handled by the calling code
    // Just log the intention here
  }

  private async enableGracefulDegradation(context: ErrorContext): Promise<void> {
    console.log('Enabling graceful degradation for', context.operation);
    
    // Provide basic functionality without ML models
    // This would be implemented by the specific components
  }

  /**
   * Utility methods
   */
  private generateCacheKey(context: ErrorContext): string {
    return `${context.operation}_${context.modelId || 'default'}_${Date.now()}`;
  }

  private createMLError(
    message: string,
    code: string,
    modelId?: string,
    context?: string,
    recoverable = true
  ): MLError {
    const error = new Error(message) as MLError;
    error.code = code;
    error.modelId = modelId;
    error.context = context;
    error.recoverable = recoverable;
    return error;
  }

  /**
   * Cache management
   */
  setCachedResult(key: string, result: any): void {
    this.cachedResults.set(key, result);
    
    // Limit cache size
    if (this.cachedResults.size > 100) {
      const firstKey = this.cachedResults.keys().next().value;
      this.cachedResults.delete(firstKey);
    }
  }

  getCachedResult(key: string): any {
    return this.cachedResults.get(key);
  }

  clearCache(): void {
    this.cachedResults.clear();
  }

  /**
   * Error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByOperation: Record<string, number>;
    networkStatus: string;
    deviceCapabilities: DeviceInfo | null;
  } {
    const errorsByOperation: Record<string, number> = {};
    for (const [key, count] of this.errorCounts) {
      errorsByOperation[key] = count;
    }

    return {
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
      errorsByOperation,
      networkStatus: this.networkStatus,
      deviceCapabilities: this.deviceCapabilities
    };
  }

  /**
   * Reset error counts
   */
  resetErrorCounts(): void {
    this.errorCounts.clear();
  }

  /**
   * Set fallback strategy for an operation
   */
  setFallbackStrategy(operation: string, strategy: FallbackStrategy): void {
    this.fallbackStrategies.set(operation, strategy);
  }

  /**
   * Get fallback strategy for an operation
   */
  getFallbackStrategy(operation: string): FallbackStrategy | undefined {
    return this.fallbackStrategies.get(operation);
  }
}

// Export singleton instance
export const errorHandler = MLErrorHandler.getInstance();

export default MLErrorHandler;