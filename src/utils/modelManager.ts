/**
 * Unified model manager for caching, memory management, and device detection
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
    // Check if model is already cached
    const cached = this.modelCache.get(modelId);
    if (cached) {
      cached.lastAccessed = Date.now();
      return cached.model;
    }

    // Check if model is currently being loaded
    const existingPromise = this.loadingPromises.get(modelId);
    if (existingPromise) {
      return existingPromise;
    }

    // Start loading the model
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
      // Ensure memory is available
      await this.ensureMemoryAvailable();

      // Detect optimal device if not specified
      if (!options.device) {
        await mlUtils.device.detectCapabilities();
        options.device = mlUtils.device.getOptimalDevice();
      }

      // Load the model with timeout
      const timeout = options.timeout || this.config.defaultTimeout;
      const model = await mlUtils.withTimeout(loader(), timeout);

      // Estimate model size
      const modelSize = this.estimateModelSize(model);
      const loadTime = Date.now() - startTime;

      // Create model info
      const modelInfo: ModelInfo = {
        name: modelId,
        size: modelSize,
        architecture: this.detectArchitecture(model),
        loadTime,
        memoryUsage: modelSize,
        device: options.device || 'cpu'
      };

      // Cache the model
      const cacheEntry: ModelCacheEntry = {
        model,
        info: modelInfo,
        lastAccessed: Date.now(),
        loadTime,
        memoryUsage: modelSize,
        priority: options.priority || 'normal'
      };

      this.modelCache.set(modelId, cacheEntry);

      // Record performance metrics
      if (this.config.enablePerformanceMonitoring) {
        const totalLoadTime = mlUtils.performance.endTimer(`model_load_${modelId}`);
        mlUtils.performance.recordMetrics(`model_load_${modelId}`, {
          modelLoadTime: totalLoadTime,
          memoryUsage: modelSize,
          deviceInfo: await mlUtils.device.detectCapabilities(),
          inferenceTime: 0,
          throughput: 0
        });
      }

      // Progress callback
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

    // Cleanup model resources if possible
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

  isModelLoaded(modelId: string): boolean {
    return this.modelCache.has(modelId);
  }

  getModelInfo(modelId: string): ModelInfo | null {
    const cached = this.modelCache.get(modelId);
    return cached ? cached.info : null;
  }

  getLoadedModels(): string[] {
    return Array.from(this.modelCache.keys());
  }

  getAllModelsInfo(): ModelInfo[] {
    return Array.from(this.modelCache.values()).map(entry => entry.info);
  }

  getMemoryUsage(): MemoryUsage {
    const baseUsage = mlUtils.memory.getCurrentMemoryUsage();
    
    // Add model-specific memory usage
    const modelMemory: Record<string, number> = {};
    let totalModelMemory = 0;

    for (const [modelId, entry] of this.modelCache) {
      modelMemory[modelId] = entry.memoryUsage;
      totalModelMemory += entry.memoryUsage;
    }

    return {
      ...baseUsage,
      models: modelMemory,
      used: baseUsage.used + totalModelMemory
    };
  }

  async clearCache(): Promise<void> {
    const modelIds = Array.from(this.modelCache.keys());
    
    for (const modelId of modelIds) {
      this.unloadModel(modelId);
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  private async ensureMemoryAvailable(): Promise<void> {
    const memoryUsage = this.getMemoryUsage();
    
    // Check if we're approaching memory limits
    if (memoryUsage.used > this.config.maxMemoryUsage * 0.8) {
      await this.evictLeastRecentlyUsed();
    }

    // Check cache size limit
    if (this.modelCache.size >= this.config.maxCacheSize) {
      await this.evictLeastRecentlyUsed();
    }
  }

  private async evictLeastRecentlyUsed(): Promise<void> {
    if (this.modelCache.size === 0) {
      return;
    }

    // Sort by last accessed time and priority
    const entries = Array.from(this.modelCache.entries()).sort((a, b) => {
      // High priority models are less likely to be evicted
      if (a[1].priority === 'high' && b[1].priority !== 'high') {
        return 1;
      }
      if (b[1].priority === 'high' && a[1].priority !== 'high') {
        return -1;
      }
      
      // Then sort by last accessed time
      return a[1].lastAccessed - b[1].lastAccessed;
    });

    // Evict the least recently used model
    const [modelIdToEvict] = entries[0];
    this.unloadModel(modelIdToEvict);

    console.log(`Evicted model ${modelIdToEvict} to free memory`);
  }

  private estimateModelSize(model: any): number {
    // Try to get actual size if available
    if (model && typeof model.getSize === 'function') {
      return model.getSize();
    }

    // Estimate based on model structure
    if (model && model.config) {
      return mlUtils.memory.estimateModelSize({
        parameters: model.config.num_parameters,
        vocabulary: model.config.vocab_size,
        hiddenSize: model.config.hidden_size,
        numLayers: model.config.num_hidden_layers,
        sequenceLength: model.config.max_position_embeddings
      });
    }

    // Default fallback estimate
    return 50 * 1024 * 1024; // 50MB
  }

  private detectArchitecture(model: any): string {
    if (model && model.config) {
      return model.config.model_type || model.config.architectures?.[0] || 'unknown';
    }
    
    if (model && model.constructor) {
      return model.constructor.name;
    }

    return 'unknown';
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
      // Don't cleanup high priority models
      if (entry.priority === 'high') {
        continue;
      }

      // Cleanup models that haven't been accessed recently
      if (now - entry.lastAccessed > maxAge) {
        this.unloadModel(modelId);
        console.log(`Auto-cleanup: Removed unused model ${modelId}`);
      }
    }
  }

  updateConfig(newConfig: Partial<ModelManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart auto-cleanup if interval changed
    if (newConfig.autoCleanup !== undefined || newConfig.cleanupInterval !== undefined) {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }
      
      if (this.config.autoCleanup) {
        this.startAutoCleanup();
      }
    }
  }

  getConfig(): ModelManagerConfig {
    return { ...this.config };
  }

  getCacheStats(): {
    totalModels: number;
    totalMemory: number;
    averageLoadTime: number;
    hitRate: number;
  } {
    const entries = Array.from(this.modelCache.values());
    
    return {
      totalModels: entries.length,
      totalMemory: entries.reduce((sum, entry) => sum + entry.memoryUsage, 0),
      averageLoadTime: entries.length > 0 
        ? entries.reduce((sum, entry) => sum + entry.loadTime, 0) / entries.length 
        : 0,
      hitRate: 0 // Would need to track cache hits/misses to calculate this
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.clearCache();
    ModelManager.instance = null as any;
  }
}

// Export singleton instance
export const modelManager = ModelManager.getInstance();

export default ModelManager;