// Comprehensive error handling utilities for ML operations

export interface MLError extends Error {
  code: string;
  category: 'network' | 'model' | 'input' | 'processing' | 'timeout' | 'memory' | 'unknown';
  recoverable: boolean;
  userMessage: string;
  technicalDetails?: string;
}

export class MLErrorHandler {
  static createError(
    message: string,
    code: string,
    category: MLError['category'],
    recoverable: boolean = true,
    technicalDetails?: string
  ): MLError {
    const error = new Error(message) as MLError;
    error.code = code;
    error.category = category;
    error.recoverable = recoverable;
    error.userMessage = this.getUserFriendlyMessage(category, message);
    error.technicalDetails = technicalDetails;
    return error;
  }

  static getUserFriendlyMessage(category: MLError['category'], originalMessage: string): string {
    switch (category) {
      case 'network':
        return 'Network connection issue. Please check your internet connection and try again.';
      case 'model':
        return 'Model loading failed. This might be due to browser compatibility or network issues.';
      case 'input':
        return 'Invalid input provided. Please check your data and try again.';
      case 'processing':
        return 'Processing failed. The model encountered an error while analyzing your data.';
      case 'timeout':
        return 'Operation timed out. The analysis is taking longer than expected.';
      case 'memory':
        return 'Insufficient memory. Try using a smaller image or refresh the page.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  static categorizeError(error: Error): MLError['category'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }
    if (message.includes('timeout') || message.includes('aborted')) {
      return 'timeout';
    }
    if (message.includes('memory') || message.includes('allocation')) {
      return 'memory';
    }
    if (message.includes('model') || message.includes('onnx') || message.includes('webgl')) {
      return 'model';
    }
    if (message.includes('input') || message.includes('invalid') || message.includes('format')) {
      return 'input';
    }
    if (message.includes('processing') || message.includes('inference')) {
      return 'processing';
    }
    
    return 'unknown';
  }

  static wrapError(originalError: Error): MLError {
    if ('category' in originalError) {
      return originalError as MLError;
    }

    const category = this.categorizeError(originalError);
    const recoverable = category !== 'memory' && category !== 'model';
    
    return this.createError(
      originalError.message,
      'WRAPPED_ERROR',
      category,
      recoverable,
      originalError.stack
    );
  }

  static getRetryStrategy(error: MLError): { shouldRetry: boolean; delay: number; maxAttempts: number } {
    switch (error.category) {
      case 'network':
        return { shouldRetry: true, delay: 2000, maxAttempts: 3 };
      case 'timeout':
        return { shouldRetry: true, delay: 1000, maxAttempts: 2 };
      case 'processing':
        return { shouldRetry: true, delay: 1500, maxAttempts: 2 };
      case 'model':
        return { shouldRetry: true, delay: 3000, maxAttempts: 2 };
      case 'memory':
        return { shouldRetry: false, delay: 0, maxAttempts: 0 };
      case 'input':
        return { shouldRetry: false, delay: 0, maxAttempts: 0 };
      default:
        return { shouldRetry: true, delay: 1000, maxAttempts: 1 };
    }
  }

  static logError(error: MLError, context?: Record<string, any>) {
    const logData = {
      message: error.message,
      code: error.code,
      category: error.category,
      recoverable: error.recoverable,
      userMessage: error.userMessage,
      technicalDetails: error.technicalDetails,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error('ML Error:', logData);

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: errorTrackingService.captureException(error, { extra: logData });
    }
  }
}

// Utility function to handle async operations with comprehensive error handling
export async function handleAsyncMLOperation<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<{ data?: T; error?: MLError }> {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    const mlError = MLErrorHandler.wrapError(error instanceof Error ? error : new Error(String(error)));
    MLErrorHandler.logError(mlError, context);
    return { error: mlError };
  }
}

// Timeout wrapper for ML operations
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(MLErrorHandler.createError(
          timeoutMessage,
          'TIMEOUT',
          'timeout',
          true,
          `Timeout after ${timeoutMs}ms`
        ));
      }, timeoutMs);
    })
  ]);
}

// Memory monitoring for ML operations
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private memoryWarningThreshold = 0.8; // 80% of available memory

  static getInstance(): MemoryMonitor {
    if (!this.instance) {
      this.instance = new MemoryMonitor();
    }
    return this.instance;
  }

  checkMemoryUsage(): { available: boolean; usage?: number; warning?: string } {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      if (usage > this.memoryWarningThreshold) {
        return {
          available: false,
          usage,
          warning: `High memory usage detected (${Math.round(usage * 100)}%). Consider refreshing the page.`
        };
      }
      
      return { available: true, usage };
    }
    
    return { available: true };
  }

  async executeWithMemoryCheck<T>(operation: () => Promise<T>): Promise<T> {
    const memoryCheck = this.checkMemoryUsage();
    
    if (!memoryCheck.available) {
      throw MLErrorHandler.createError(
        'Insufficient memory for operation',
        'MEMORY_LIMIT',
        'memory',
        false,
        memoryCheck.warning
      );
    }
    
    return operation();
  }
}

// Fallback data generator for when ML operations fail
export class FallbackDataGenerator {
  static generateImageClassificationFallback(prompt: string): any {
    const objects = prompt.split('.').map(s => s.trim()).filter(Boolean);
    const detections = objects.slice(0, 3).map((obj, index) => ({
      label: obj,
      confidence: Math.floor(Math.random() * 30) + 70, // 70-99%
      box: [
        50 + index * 100,
        50 + index * 50,
        200 + index * 100,
        200 + index * 50
      ]
    }));

    return {
      detections,
      processingTime: Math.random() * 2 + 1, // 1-3 seconds
      fallback: true
    };
  }

  static generateSentimentFallback(text: string): any {
    // Simple heuristic-based sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'horrible', 'worst'];
    
    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    let sentiment: 'positive' | 'negative' | 'neutral';
    let confidence: number;
    
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      confidence = Math.min(0.6 + (positiveCount - negativeCount) * 0.1, 0.9);
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      confidence = Math.min(0.6 + (negativeCount - positiveCount) * 0.1, 0.9);
    } else {
      sentiment = 'neutral';
      confidence = 0.5 + Math.random() * 0.2;
    }
    
    return {
      sentiment,
      confidence,
      processingTime: Math.random() * 0.5 + 0.2,
      fallback: true
    };
  }

  static generateRecommendationFallback(input: any): any {
    const fallbackMovies = [
      { title: "The Matrix", genre: "Sci-Fi", rating: 8.7, year: 1999 },
      { title: "Inception", genre: "Thriller", rating: 8.8, year: 2010 },
      { title: "Interstellar", genre: "Sci-Fi", rating: 8.6, year: 2014 },
      { title: "The Dark Knight", genre: "Action", rating: 9.0, year: 2008 },
      { title: "Pulp Fiction", genre: "Crime", rating: 8.9, year: 1994 }
    ];
    
    return {
      recommendations: fallbackMovies.slice(0, 3),
      confidence: 0.7,
      processingTime: Math.random() * 1 + 0.5,
      fallback: true
    };
  }
}