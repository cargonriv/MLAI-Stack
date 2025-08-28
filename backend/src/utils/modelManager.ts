/**
 * Unified model manager for caching, memory management
 */

import { 
  ModelInfo, 
  ModelLoadOptions, 
  MemoryUsage, 
  MLError,
  mlUtils 
} from './mlUtils';

export interface ModelCacheEntry {
  model: any;
  info: ModelInfo;
  lastAccessed: number;
  loadTime: number;
  memoryUsage: number;
  priority: 'high' | 'normal' | 'low';
}

export interface ModelManagerConfig {
  maxMemoryUsage: number; // in bytes
  maxCacheSize: number; // number of models
  defaultTimeout: number; // in milliseconds
  enablePerformanceMonitoring: boolean;
  autoCleanup: boolean;
  cleanupInterval: number; // in milliseconds
}

export class ModelManager {
  private static instance: ModelManager;
  private modelCache: Map<string, ModelCacheEntry> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();
  private config: ModelManagerConfig;
  private cleanupInterval?: NodeJS.Timeout;

  private constructor(config?: Partial<ModelManagerConfig>) {
    this.config = {
      maxMemoryUsage: 500 * 1024 * 1024, // 500MB default
      maxCacheSize: 5, // 5 models max
      defaultTimeout: 30000, // 30 seconds
      enablePerformanceMonitoring: true,
      autoCleanup: true,
      cleanupInterval: 60000, // 1 minute
      ...config
    };

    if (this.config.autoCleanup) {
      this.startAutoCleanup();
    }
  }

  static getInstance(config?: Partial<ModelManagerConfig>): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager(config);
    }
    return ModelManager.instance;
  }

  async loadModel(
    modelId: string, 
    loader: () => Promise<any>,
    options: ModelLoadOptions = {}
  ): Promise<any> {
    const cached = this.modelCache.get(modelId);
    if (cached) {
      cached.lastAccessed = Date.now();
      return cached.model;
    }

    const existingPromise = this.loadingPromises.get(modelId);
    if (existingPromise) {
      return existingPromise;
    }

    const loadingPromise = this.performModelLoad(modelId, loader, options);
    this.loadingPromises.set(modelId, loadingPromise);

    try {
      const result = await loadingPromise;
      return result;
    } finally {
      this.loadingPromises.delete(modelId);
    }
  }

  private async performModelLoad(
    modelId: string,
    loader: () => Promise<any>,
    options: ModelLoadOptions
  ): Promise<any> {
    const startTime = Date.now();
    
    if (this.config.enablePerformanceMonitoring) {
      mlUtils.performance.startTimer(`model_load_${modelId}`);
    }

    try {
      await this.ensureMemoryAvailable();

      const timeout = options.timeout || this.config.defaultTimeout;
      const model = await mlUtils.withTimeout(loader(), timeout);

      const modelSize = mlUtils.memory.estimateModelSize(model);
      const loadTime = Date.now() - startTime;

      const modelInfo: ModelInfo = {
        name: modelId,
        size: modelSize,
        architecture: 'unknown',
        loadTime,
        memoryUsage: modelSize,
        device: options.device || 'cpu'
      };

      const cacheEntry: ModelCacheEntry = {
        model,
        info: modelInfo,
        lastAccessed: Date.now(),
        loadTime,
        memoryUsage: modelSize,
        priority: options.priority || 'normal'
      };

      this.modelCache.set(modelId, cacheEntry);

      if (this.config.enablePerformanceMonitoring) {
        const totalLoadTime = mlUtils.performance.endTimer(`model_load_${modelId}`);
        mlUtils.performance.recordMetrics(`model_load_${modelId}`, {
          modelLoadTime: totalLoadTime,
          memoryUsage: modelSize,
          inferenceTime: 0,
          throughput: 0
        });
      }

      if (options.progressCallback) {
        options.progressCallback(100);
      }

      return model;

    } catch (error) {
      if (this.config.enablePerformanceMonitoring) {
        mlUtils.performance.endTimer(`model_load_${modelId}`);
      }

      throw mlUtils.error.createError(
        `Failed to load model ${modelId}: ${(error as Error).message}`,
        'MODEL_LOAD_FAILED',
        modelId,
        'ModelManager.loadModel'
      );
    }
  }

  unloadModel(modelId: string): boolean {
    const cached = this.modelCache.get(modelId);
    if (!cached) {
      return false;
    }

    if (cached.model && typeof cached.model.dispose === 'function') {
      try {
        cached.model.dispose();
      } catch (error) {
        console.warn(`Failed to dispose model ${modelId}:`, error);
      }
    }

    this.modelCache.delete(modelId);
    return true;
  }

  private async ensureMemoryAvailable(): Promise<void> {
    const memoryUsage = mlUtils.memory.getCurrentMemoryUsage();
    
    if (memoryUsage.used > this.config.maxMemoryUsage * 0.8) {
      await this.evictLeastRecentlyUsed();
    }

    if (this.modelCache.size >= this.config.maxCacheSize) {
      await this.evictLeastRecentlyUsed();
    }
  }

  private async evictLeastRecentlyUsed(): Promise<void> {
    if (this.modelCache.size === 0) {
      return;
    }

    const entries = Array.from(this.modelCache.entries()).sort((a, b) => {
      if (a[1].priority === 'high' && b[1].priority !== 'high') {
        return 1;
      }
      if (b[1].priority === 'high' && a[1].priority !== 'high') {
        return -1;
      }
      
      return a[1].lastAccessed - b[1].lastAccessed;
    });

    const [modelIdToEvict] = entries[0];
    this.unloadModel(modelIdToEvict);

    console.log(`Evicted model ${modelIdToEvict} to free memory`);
  }

  private startAutoCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.performAutoCleanup();
    }, this.config.cleanupInterval);
  }

  private performAutoCleanup(): void {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [modelId, entry] of this.modelCache) {
      if (entry.priority === 'high') {
        continue;
      }

      if (now - entry.lastAccessed > maxAge) {
        this.unloadModel(modelId);
        console.log(`Auto-cleanup: Removed unused model ${modelId}`);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.modelCache.clear();
    ModelManager.instance = null as any;
  }
}

export const modelManager = ModelManager.getInstance();

export default ModelManager;
