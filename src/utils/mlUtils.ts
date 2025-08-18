/**
 * Common ML utilities for model loading, error handling, and performance monitoring
 */

// TypeScript interfaces for ML-related data structures

// Sentiment Analysis interfaces
export interface SentimentResult {
  label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  confidence: number;
  scores: {
    positive: number;
    negative: number;
    neutral?: number;
  };
  processingTime: number;
  modelInfo: {
    name: string;
    size: string;
    architecture: string;
  };
}

export interface TextPreprocessor {
  clean(text: string): string;
  tokenize(text: string): TokenizedInput;
  validate(text: string): ValidationResult;
}

export interface TokenizedInput {
  inputIds: number[];
  attentionMask: number[];
  tokenTypeIds?: number[];
  tokens: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Collaborative Filtering interfaces
export interface MovieRating {
  movieId: number;
  title: string;
  rating: number;
  genres: string[];
}

export interface RecommendationResult {
  movieId: number;
  title: string;
  predictedRating: number;
  confidence: number;
  genres: string[];
  explanation: string;
  similarUsers?: number[];
}

export interface Movie {
  id: number;
  title: string;
  genres: string[];
  year: number;
  averageRating: number;
  ratingCount: number;
  features?: number[]; // Learned embeddings
}

export interface UserProfile {
  ratings: Map<number, number>;
  preferences: GenrePreferences;
  features?: number[]; // Learned embeddings
}

export interface GenrePreferences {
  [genre: string]: number; // Preference score
}

// Model configuration interfaces
export interface BERTConfig {
  modelName: string;
  maxLength: number;
  truncation: boolean;
  padding: boolean;
  returnTensors: 'pt' | 'tf';
}

export interface SVDModel {
  userFeatures: Float32Array[];
  itemFeatures: Float32Array[];
  userBias: Float32Array;
  itemBias: Float32Array;
  globalMean: number;
  numFactors: number;
}

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
  device?: 'cpu' | 'wasm' | 'webgl';
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
  deviceInfo: DeviceInfo;
}

export interface DeviceInfo {
  userAgent: string;
  hardwareConcurrency: number;
  memory?: number;
  webglSupported: boolean;
  wasmSupported: boolean;
  platform: string;
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

  getMetrics(operationId: string): PerformanceMetrics | undefined {
    return this.metrics.get(operationId);
  }

  getAllMetrics(): Record<string, PerformanceMetrics> {
    return Object.fromEntries(this.metrics);
  }

  clearMetrics(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }
}

// Device capability detection
export class DeviceCapabilities {
  private static instance: DeviceCapabilities;
  private deviceInfo: DeviceInfo | null = null;

  static getInstance(): DeviceCapabilities {
    if (!DeviceCapabilities.instance) {
      DeviceCapabilities.instance = new DeviceCapabilities();
    }
    return DeviceCapabilities.instance;
  }

  async detectCapabilities(): Promise<DeviceInfo> {
    if (this.deviceInfo) {
      return this.deviceInfo;
    }

    const deviceInfo: DeviceInfo = {
      userAgent: navigator.userAgent,
      hardwareConcurrency: navigator.hardwareConcurrency || 1,
      webglSupported: this.checkWebGLSupport(),
      wasmSupported: await this.checkWASMSupport(),
      platform: navigator.platform || 'unknown'
    };

    // Check for memory info (Chrome only)
    if ('memory' in performance) {
      deviceInfo.memory = (performance as any).memory?.jsHeapSizeLimit;
    }

    this.deviceInfo = deviceInfo;
    return deviceInfo;
  }

  private checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch {
      return false;
    }
  }

  private async checkWASMSupport(): Promise<boolean> {
    try {
      if (typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function') {
        const module = new WebAssembly.Module(new Uint8Array([
          0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00
        ]));
        return WebAssembly.validate(module);
      }
      return false;
    } catch {
      return false;
    }
  }

  getOptimalDevice(): 'webgl' | 'wasm' | 'cpu' {
    if (!this.deviceInfo) {
      throw new Error('Device capabilities not detected. Call detectCapabilities() first.');
    }

    if (this.deviceInfo.webglSupported) {
      return 'webgl';
    } else if (this.deviceInfo.wasmSupported) {
      return 'wasm';
    } else {
      return 'cpu';
    }
  }

  isLowEndDevice(): boolean {
    if (!this.deviceInfo) {
      return false;
    }

    const lowEndIndicators = [
      this.deviceInfo.hardwareConcurrency <= 2,
      this.deviceInfo.memory && this.deviceInfo.memory < 2 * 1024 * 1024 * 1024, // Less than 2GB
      !this.deviceInfo.webglSupported
    ];

    return lowEndIndicators.filter(Boolean).length >= 2;
  }
}

// Error handling utilities
export class MLErrorHandler {
  private static errorCounts: Map<string, number> = new Map();
  private static maxRetries = 3;

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

  static async withRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    maxRetries = MLErrorHandler.maxRetries
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        // Reset error count on success
        MLErrorHandler.errorCounts.delete(operationId);
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Track error count
    const currentCount = MLErrorHandler.errorCounts.get(operationId) || 0;
    MLErrorHandler.errorCounts.set(operationId, currentCount + 1);

    throw MLErrorHandler.createError(
      `Operation failed after ${maxRetries + 1} attempts: ${lastError.message}`,
      'RETRY_EXHAUSTED',
      undefined,
      operationId,
      false
    );
  }

  static getErrorCount(operationId: string): number {
    return MLErrorHandler.errorCounts.get(operationId) || 0;
  }

  static clearErrorCount(operationId: string): void {
    MLErrorHandler.errorCounts.delete(operationId);
  }

  static isRecoverableError(error: Error): boolean {
    if ('recoverable' in error) {
      return (error as MLError).recoverable;
    }

    // Common recoverable error patterns
    const recoverablePatterns = [
      /network/i,
      /timeout/i,
      /temporary/i,
      /rate limit/i,
      /503/,
      /502/,
      /504/
    ];

    return recoverablePatterns.some(pattern => pattern.test(error.message));
  }
}

// Memory estimation utilities
export class MemoryEstimator {
  private static readonly BYTES_PER_FLOAT32 = 4;
  private static readonly BYTES_PER_INT32 = 4;
  private static readonly OVERHEAD_FACTOR = 1.2; // 20% overhead for metadata

  static estimateModelSize(modelConfig: {
    parameters?: number;
    vocabulary?: number;
    hiddenSize?: number;
    numLayers?: number;
    sequenceLength?: number;
  }): number {
    const {
      parameters = 0,
      vocabulary = 0,
      hiddenSize = 0,
      numLayers = 0,
      sequenceLength = 0
    } = modelConfig;

    let estimatedBytes = 0;

    // Parameter weights (typically float32)
    estimatedBytes += parameters * MemoryEstimator.BYTES_PER_FLOAT32;

    // Vocabulary embeddings
    if (vocabulary && hiddenSize) {
      estimatedBytes += vocabulary * hiddenSize * MemoryEstimator.BYTES_PER_FLOAT32;
    }

    // Layer-specific memory (rough estimate)
    if (numLayers && hiddenSize) {
      // Attention weights, feed-forward weights, etc.
      const layerMemory = hiddenSize * hiddenSize * 4; // Rough estimate
      estimatedBytes += numLayers * layerMemory * MemoryEstimator.BYTES_PER_FLOAT32;
    }

    // Sequence processing memory
    if (sequenceLength && hiddenSize) {
      estimatedBytes += sequenceLength * hiddenSize * MemoryEstimator.BYTES_PER_FLOAT32;
    }

    // Apply overhead factor
    return Math.ceil(estimatedBytes * MemoryEstimator.OVERHEAD_FACTOR);
  }

  static formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  static getCurrentMemoryUsage(): MemoryUsage {
    const usage: MemoryUsage = {
      used: 0,
      total: 0,
      available: 0,
      models: {}
    };

    // Chrome-specific memory info
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      usage.used = memInfo.usedJSHeapSize || 0;
      usage.total = memInfo.totalJSHeapSize || 0;
      usage.available = memInfo.jsHeapSizeLimit || 0;
    }

    return usage;
  }
}

// Individual utility functions for testing
export function validateInput(input: any, type: string): boolean {
  switch (type) {
    case 'text':
      return typeof input === 'string' && input.length > 0 && input.length < 5000;
    case 'array':
      return Array.isArray(input) && input.length > 0;
    case 'object':
      return typeof input === 'object' && input !== null && Object.keys(input).length > 0;
    default:
      return false;
  }
}

export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags and content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim()
    .replace(/\s+/g, ' '); // Normalize whitespace
}

export function formatConfidence(confidence: number): string {
  const clampedConfidence = Math.max(0, Math.min(1, confidence));
  return `${(clampedConfidence * 100).toFixed(2)}%`;
}

export function calculateProcessingTime(startTime: number): number {
  return Date.now() - startTime;
}

export function estimateModelSize(model: any): number {
  if (model && model.parameters) {
    return model.parameters.length * 4; // Assume float32
  }
  return 0;
}

export function checkBrowserSupport(): {
  webgl: boolean;
  webgl2?: boolean;
  wasm: boolean;
  supported: boolean;
  webglPerformance?: string;
  mobile?: boolean;
  cores?: number;
  touch?: boolean;
  screenReader?: boolean;
  reducedMotion?: boolean;
  highContrast?: boolean;
  fetch?: boolean;
} {
  const support = {
    webgl: false,
    webgl2: false,
    wasm: false,
    supported: false,
    webglPerformance: 'unknown' as string,
    mobile: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent),
    cores: navigator.hardwareConcurrency || 1,
    touch: 'ontouchstart' in window,
    screenReader: false,
    reducedMotion: false,
    highContrast: false,
    fetch: typeof fetch !== 'undefined'
  };

  // Check WebGL
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    const gl2 = canvas.getContext('webgl2');
    support.webgl = !!gl;
    support.webgl2 = !!gl2;
    
    if (support.webgl) {
      support.webglPerformance = /Chrome|Firefox/.test(navigator.userAgent) ? 'high' : 'medium';
    }
  } catch {
    support.webgl = false;
  }

  // Check WebAssembly
  support.wasm = typeof WebAssembly !== 'undefined';

  // Check accessibility preferences
  if (typeof window !== 'undefined' && window.matchMedia) {
    support.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    support.highContrast = window.matchMedia('(prefers-contrast: high)').matches;
  }

  support.supported = support.webgl || support.wasm;
  
  return support;
}

export function createProgressCallback(callback: (progress: number) => void, throttleMs: number = 100): (progress: number) => void {
  let lastCall = 0;
  return (progress: number) => {
    const now = Date.now();
    if (now - lastCall >= throttleMs) {
      callback(progress);
      lastCall = now;
    }
  };
}

export async function handleAsyncError<T>(fn: () => Promise<T>, defaultValue: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return defaultValue;
  }
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  }) as T;
}

export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
  let inThrottle: boolean;
  return ((...args: any[]) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}

// Utility functions object
export const mlUtils = {
  performance: new PerformanceMonitor(),
  device: DeviceCapabilities.getInstance(),
  error: MLErrorHandler,
  memory: MemoryEstimator,

  // Helper function to create a timeout promise
  withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  },

  validateInput,
  sanitizeText,
  formatConfidence,
  calculateProcessingTime,
  estimateModelSize,
  checkBrowserSupport,
  createProgressCallback,
  handleAsyncError,
  debounce,
  throttle
};

export default mlUtils;