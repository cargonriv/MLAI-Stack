/**
 * Performance monitoring utilities for ML models
 * Tracks loading times, inference performance, memory usage, and device capabilities
 */

export interface PerformanceMetrics {
  modelLoadTime: number;
  inferenceTime: number;
  memoryUsage: number;
  throughput: number; // items per second
  accuracy?: number;
  deviceInfo: DeviceInfo;
  timestamp: number;
}

export interface DeviceInfo {
  userAgent: string;
  hardwareConcurrency: number;
  memory?: number;
  webglSupported: boolean;
  wasmSupported: boolean;
  deviceMemory?: number;
  connection?: {
    effectiveType: string;
    downlink: number;
  };
}

export interface ModelPerformanceData {
  modelId: string;
  metrics: PerformanceMetrics[];
  averageLoadTime: number;
  averageInferenceTime: number;
  memoryFootprint: number;
  lastUsed: number;
}

export interface PerformanceWarning {
  type: 'memory' | 'performance' | 'compatibility' | 'network';
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion: string;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: Map<string, ModelPerformanceData> = new Map();
  private warnings: PerformanceWarning[] = [];
  private deviceInfo: DeviceInfo;
  private memoryThreshold = 0.8; // 80% of available memory
  private performanceThreshold = 5000; // 5 seconds for slow operations

  constructor() {
    this.deviceInfo = this.detectDeviceCapabilities();
    this.startMemoryMonitoring();
  }

  /**
   * Detect device capabilities for optimal model selection
   */
  private detectDeviceCapabilities(): DeviceInfo {
    const nav = navigator as any;
    
    return {
      userAgent: navigator.userAgent,
      hardwareConcurrency: navigator.hardwareConcurrency || 1,
      memory: nav.deviceMemory ? nav.deviceMemory * 1024 * 1024 * 1024 : undefined,
      webglSupported: this.isWebGLSupported(),
      wasmSupported: this.isWasmSupported(),
      deviceMemory: nav.deviceMemory,
      connection: nav.connection ? {
        effectiveType: nav.connection.effectiveType,
        downlink: nav.connection.downlink
      } : undefined
    };
  }

  /**
   * Check WebGL support
   */
  private isWebGLSupported(): boolean {
    try {
      // Check if we're in a test environment
      if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
        return false; // Default to false in tests
      }
      
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check WebAssembly support
   */
  private isWasmSupported(): boolean {
    try {
      return typeof WebAssembly === 'object' && 
             typeof WebAssembly.instantiate === 'function';
    } catch (e) {
      return false;
    }
  }

  /**
   * Start monitoring memory usage
   */
  private startMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        this.checkMemoryUsage();
      }, 10000); // Check every 10 seconds
    }
  }

  /**
   * Check current memory usage and generate warnings
   */
  private checkMemoryUsage(): void {
    const memory = (performance as any).memory;
    if (!memory) return;

    const usedMemory = memory.usedJSHeapSize;
    const totalMemory = memory.totalJSHeapSize;
    const memoryLimit = memory.jsHeapSizeLimit;

    const memoryUsageRatio = usedMemory / memoryLimit;

    if (memoryUsageRatio > this.memoryThreshold) {
      this.addWarning({
        type: 'memory',
        severity: memoryUsageRatio > 0.9 ? 'high' : 'medium',
        message: `High memory usage detected: ${Math.round(memoryUsageRatio * 100)}%`,
        suggestion: 'Consider clearing model cache or using smaller models',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Record model loading performance
   */
  recordModelLoad(modelId: string, loadTime: number, memoryUsage: number): void {
    const metrics: PerformanceMetrics = {
      modelLoadTime: loadTime,
      inferenceTime: 0,
      memoryUsage,
      throughput: 0,
      deviceInfo: this.deviceInfo,
      timestamp: Date.now()
    };

    this.updateModelMetrics(modelId, metrics);

    // Check for slow loading
    if (loadTime > this.performanceThreshold) {
      this.addWarning({
        type: 'performance',
        severity: 'medium',
        message: `Slow model loading detected: ${Math.round(loadTime)}ms`,
        suggestion: 'Consider using a smaller model or enabling caching',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Record inference performance
   */
  recordInference(modelId: string, inferenceTime: number, batchSize: number = 1): void {
    const throughput = batchSize / (inferenceTime / 1000); // items per second
    
    const existingData = this.metrics.get(modelId);
    if (existingData && existingData.metrics.length > 0) {
      const lastMetrics = existingData.metrics[existingData.metrics.length - 1];
      lastMetrics.inferenceTime = inferenceTime;
      lastMetrics.throughput = throughput;
    }

    // Check for slow inference
    if (inferenceTime > this.performanceThreshold) {
      this.addWarning({
        type: 'performance',
        severity: 'medium',
        message: `Slow inference detected: ${Math.round(inferenceTime)}ms`,
        suggestion: 'Consider using WebGL acceleration or a smaller model',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Update model metrics
   */
  private updateModelMetrics(modelId: string, metrics: PerformanceMetrics): void {
    const existingData = this.metrics.get(modelId);
    
    if (existingData) {
      existingData.metrics.push(metrics);
      existingData.lastUsed = Date.now();
      
      // Keep only last 10 metrics to prevent memory bloat
      if (existingData.metrics.length > 10) {
        existingData.metrics = existingData.metrics.slice(-10);
      }
      
      // Update averages
      existingData.averageLoadTime = this.calculateAverage(
        existingData.metrics.map(m => m.modelLoadTime).filter(t => t > 0)
      );
      existingData.averageInferenceTime = this.calculateAverage(
        existingData.metrics.map(m => m.inferenceTime).filter(t => t > 0)
      );
      existingData.memoryFootprint = Math.max(...existingData.metrics.map(m => m.memoryUsage));
    } else {
      this.metrics.set(modelId, {
        modelId,
        metrics: [metrics],
        averageLoadTime: metrics.modelLoadTime,
        averageInferenceTime: metrics.inferenceTime,
        memoryFootprint: metrics.memoryUsage,
        lastUsed: Date.now()
      });
    }
  }

  /**
   * Calculate average of an array of numbers
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  /**
   * Add a performance warning
   */
  private addWarning(warning: PerformanceWarning): void {
    this.warnings.push(warning);
    
    // Keep only last 20 warnings
    if (this.warnings.length > 20) {
      this.warnings = this.warnings.slice(-20);
    }

    // Emit warning event for UI components
    window.dispatchEvent(new CustomEvent('performanceWarning', { 
      detail: warning 
    }));
  }

  /**
   * Get device capabilities for model selection
   */
  getDeviceCapabilities(): DeviceInfo {
    return this.deviceInfo;
  }

  /**
   * Get performance recommendations based on device
   */
  getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];
    const device = this.deviceInfo;

    // Memory recommendations
    if (device.memory && device.memory < 4) {
      recommendations.push('Use quantized models to reduce memory usage');
      recommendations.push('Enable aggressive model caching cleanup');
    }

    // CPU recommendations
    if (device.hardwareConcurrency <= 2) {
      recommendations.push('Consider using smaller models for better performance');
      recommendations.push('Enable batch processing for multiple inputs');
    }

    // WebGL recommendations
    if (!device.webglSupported) {
      recommendations.push('WebGL not supported - inference will be slower');
      recommendations.push('Consider using CPU-optimized models');
    }

    // Network recommendations
    if (device.connection && device.connection.effectiveType === 'slow-2g') {
      recommendations.push('Slow network detected - enable aggressive model caching');
      recommendations.push('Consider using smaller models to reduce download time');
    }

    return recommendations;
  }

  /**
   * Get model performance data
   */
  getModelPerformance(modelId: string): ModelPerformanceData | undefined {
    return this.metrics.get(modelId);
  }

  /**
   * Get all performance warnings
   */
  getWarnings(): PerformanceWarning[] {
    return [...this.warnings];
  }

  /**
   * Clear old warnings
   */
  clearWarnings(): void {
    this.warnings = [];
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): { used: number; total: number; limit: number } | null {
    const memory = (performance as any).memory;
    if (!memory) return null;

    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    };
  }

  /**
   * Suggest optimal model based on device capabilities
   */
  suggestOptimalModel(availableModels: string[]): string {
    const device = this.deviceInfo;
    
    // For low-end devices, prefer smaller models
    if (device.hardwareConcurrency <= 2 || (device.memory && device.memory < 4)) {
      // Return the smallest model (assuming naming convention includes size)
      return availableModels.find(model => 
        model.includes('small') || model.includes('mini') || model.includes('distil')
      ) || availableModels[0];
    }

    // For high-end devices, prefer larger, more accurate models
    if (device.hardwareConcurrency >= 8 && device.webglSupported) {
      return availableModels.find(model => 
        model.includes('large') || model.includes('base')
      ) || availableModels[0];
    }

    // Default to medium-sized models
    return availableModels.find(model => 
      model.includes('base') || !model.includes('large')
    ) || availableModels[0];
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData(): string {
    const data = {
      deviceInfo: this.deviceInfo,
      modelMetrics: Array.from(this.metrics.entries()),
      warnings: this.warnings,
      timestamp: Date.now()
    };
    
    return JSON.stringify(data, null, 2);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();