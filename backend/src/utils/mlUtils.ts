import { performance } from 'perf_hooks';

// Core ML interfaces
export interface ModelInfo {
  name: string;
  size: number;
  architecture: string;
  loadTime: number;
  memoryUsage: number;
  device: string;
  version?: string;
}

export interface ModelLoadOptions {
  device?: 'cpu';
  quantized?: boolean;
  progressCallback?: (progress: number) => void;
  priority?: 'high' | 'normal' | 'low';
  timeout?: number;
}

export interface PerformanceMetrics {
  modelLoadTime: number;
  inferenceTime: number;
  memoryUsage: number;
  throughput: number; // items per second
  accuracy?: number;
}

export interface MemoryUsage {
  used: number;
  total: number;
  available: number;
  models: Record<string, number>;
}

export interface MLError extends Error {
  code: string;
  modelId?: string;
  context?: string;
  recoverable: boolean;
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private startTimes: Map<string, number> = new Map();

  startTimer(operationId: string): void {
    this.startTimes.set(operationId, performance.now());
  }

  endTimer(operationId: string): number {
    const startTime = this.startTimes.get(operationId);
    if (!startTime) {
      throw new Error(`No start time found for operation: ${operationId}`);
    }
    
    const duration = performance.now() - startTime;
    this.startTimes.delete(operationId);
    return duration;
  }

  recordMetrics(operationId: string, metrics: Partial<PerformanceMetrics>): void {
    const existing = this.metrics.get(operationId) || {} as PerformanceMetrics;
    this.metrics.set(operationId, { ...existing, ...metrics });
  }
}

// Error handling utilities
export class MLErrorHandler {
  static createError(
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
}

// Memory estimation utilities
export class MemoryEstimator {
    static estimateModelSize(modelConfig: any): number {
        return 50 * 1024 * 1024; // 50MB default
    }
    static getCurrentMemoryUsage(): MemoryUsage {
        const memUsage = process.memoryUsage();
        return {
            used: memUsage.heapUsed,
            total: memUsage.heapTotal,
            available: memUsage.heapTotal - memUsage.heapUsed,
            models: {}
        }
    }
}

// Utility functions object
export const mlUtils = {
  performance: new PerformanceMonitor(),
  error: MLErrorHandler,
  memory: MemoryEstimator,

  withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  },
};

export default mlUtils;
