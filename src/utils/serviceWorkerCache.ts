/**
 * Service Worker Cache Management for ML Models
 * Provides offline model availability and intelligent caching strategies
 */

export interface CacheConfig {
  cacheName: string;
  maxCacheSize: number; // bytes
  maxAge: number; // milliseconds
  enableCompression: boolean;
  enableVersioning: boolean;
  priorityModels: string[];
}

export interface CachedModel {
  modelId: string;
  version: string;
  data: ArrayBuffer | Blob;
  metadata: {
    size: number;
    timestamp: number;
    accessCount: number;
    lastAccessed: number;
    compressionRatio?: number;
    priority: 'high' | 'medium' | 'low';
  };
}

export interface CacheStats {
  totalSize: number;
  modelCount: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  compressionSavings: number;
}

export class ServiceWorkerCacheManager {
  private static instance: ServiceWorkerCacheManager;
  private config: CacheConfig;
  private cache?: Cache;
  private stats: CacheStats = {
    totalSize: 0,
    modelCount: 0,
    hitRate: 0,
    missRate: 0,
    evictionCount: 0,
    compressionSavings: 0
  };
  private accessLog: Map<string, number> = new Map();

  private constructor(config: CacheConfig) {
    this.config = config;
    this.initializeCache();
  }

  static getInstance(config?: Partial<CacheConfig>): ServiceWorkerCacheManager {
    if (!ServiceWorkerCacheManager.instance) {
      const defaultConfig: CacheConfig = {
        cacheName: 'ml-models-cache-v1',
        maxCacheSize: 500 * 1024 * 1024, // 500MB
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        enableCompression: true,
        enableVersioning: true,
        priorityModels: ['sentiment-bert', 'recommendation-svd']
      };

      ServiceWorkerCacheManager.instance = new ServiceWorkerCacheManager({
        ...defaultConfig,
        ...config
      });
    }
    return ServiceWorkerCacheManager.instance;
  }

  /**
   * Initialize cache and register service worker
   */
  private async initializeCache(): Promise<void> {
    try {
      // Register service worker if not already registered
      if ('serviceWorker' in navigator) {
        await this.registerServiceWorker();
      }

      // Open cache
      this.cache = await caches.open(this.config.cacheName);
      
      // Load existing stats
      await this.loadStats();
      
      // Clean up expired entries
      await this.cleanupExpiredEntries();
      
      console.log('Service Worker Cache initialized');
    } catch (error) {
      console.error('Failed to initialize Service Worker Cache:', error);
    }
  }

  /**
   * Cache a model for offline use
   */
  async cacheModel(
    modelId: string,
    modelData: ArrayBuffer | Blob,
    version: string = '1.0.0',
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<boolean> {
    if (!this.cache) {
      console.warn('Cache not initialized');
      return false;
    }

    try {
      // Check if we need to make space
      const modelSize = modelData instanceof ArrayBuffer ? modelData.byteLength : modelData.size;
      await this.ensureSpace(modelSize);

      // Compress if enabled
      let finalData = modelData;
      let compressionRatio = 1;
      
      if (this.config.enableCompression) {
        const compressed = await this.compressData(modelData);
        if (compressed.size < modelSize) {
          finalData = compressed.data;
          compressionRatio = modelSize / compressed.size;
          this.stats.compressionSavings += modelSize - compressed.size;
        }
      }

      // Create cache entry
      const cachedModel: CachedModel = {
        modelId,
        version,
        data: finalData,
        metadata: {
          size: modelSize,
          timestamp: Date.now(),
          accessCount: 0,
          lastAccessed: Date.now(),
          compressionRatio,
          priority
        }
      };

      // Store in cache
      const cacheKey = this.getCacheKey(modelId, version);
      const response = new Response(finalData, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Model-Metadata': JSON.stringify(cachedModel.metadata)
        }
      });

      await this.cache.put(cacheKey, response);

      // Update stats
      this.stats.totalSize += modelSize;
      this.stats.modelCount++;
      await this.saveStats();

      console.log(`Model ${modelId} cached successfully (${this.formatBytes(modelSize)})`);
      return true;
    } catch (error) {
      console.error(`Failed to cache model ${modelId}:`, error);
      return false;
    }
  }

  /**
   * Retrieve a cached model
   */
  async getCachedModel(modelId: string, version?: string): Promise<CachedModel | null> {
    if (!this.cache) return null;

    try {
      const cacheKey = this.getCacheKey(modelId, version);
      const response = await this.cache.match(cacheKey);

      if (!response) {
        this.stats.missRate++;
        return null;
      }

      // Parse metadata
      const metadataHeader = response.headers.get('X-Model-Metadata');
      const metadata = metadataHeader ? JSON.parse(metadataHeader) : {};

      // Check if expired
      if (this.isExpired(metadata.timestamp)) {
        await this.cache.delete(cacheKey);
        this.stats.evictionCount++;
        return null;
      }

      // Update access stats
      metadata.accessCount++;
      metadata.lastAccessed = Date.now();
      this.accessLog.set(modelId, Date.now());
      this.stats.hitRate++;

      const data = await response.arrayBuffer();
      
      // Decompress if needed
      let finalData = data;
      if (metadata.compressionRatio && metadata.compressionRatio > 1) {
        finalData = await this.decompressData(data);
      }

      return {
        modelId,
        version: version || '1.0.0',
        data: finalData,
        metadata
      };
    } catch (error) {
      console.error(`Failed to retrieve cached model ${modelId}:`, error);
      return null;
    }
  }

  /**
   * Check if a model is cached
   */
  async isModelCached(modelId: string, version?: string): Promise<boolean> {
    if (!this.cache) return false;

    const cacheKey = this.getCacheKey(modelId, version);
    const response = await this.cache.match(cacheKey);
    
    if (!response) return false;

    // Check if expired
    const metadataHeader = response.headers.get('X-Model-Metadata');
    const metadata = metadataHeader ? JSON.parse(metadataHeader) : {};
    
    if (this.isExpired(metadata.timestamp)) {
      await this.cache.delete(cacheKey);
      return false;
    }

    return true;
  }

  /**
   * Preload priority models
   */
  async preloadPriorityModels(): Promise<void> {
    for (const modelId of this.config.priorityModels) {
      if (!(await this.isModelCached(modelId))) {
        // In a real implementation, this would fetch from the model repository
        console.log(`Preloading priority model: ${modelId}`);
        // await this.fetchAndCacheModel(modelId);
      }
    }
  }

  /**
   * Clear specific model from cache
   */
  async clearModel(modelId: string, version?: string): Promise<boolean> {
    if (!this.cache) return false;

    try {
      const cacheKey = this.getCacheKey(modelId, version);
      const deleted = await this.cache.delete(cacheKey);
      
      if (deleted) {
        this.stats.modelCount--;
        await this.saveStats();
      }
      
      return deleted;
    } catch (error) {
      console.error(`Failed to clear model ${modelId}:`, error);
      return false;
    }
  }

  /**
   * Clear all cached models
   */
  async clearAll(): Promise<void> {
    if (!this.cache) return;

    try {
      await caches.delete(this.config.cacheName);
      this.cache = await caches.open(this.config.cacheName);
      
      this.stats = {
        totalSize: 0,
        modelCount: 0,
        hitRate: 0,
        missRate: 0,
        evictionCount: 0,
        compressionSavings: 0
      };
      
      await this.saveStats();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats & { 
    availableSpace: number;
    utilizationPercentage: number;
  } {
    const availableSpace = this.config.maxCacheSize - this.stats.totalSize;
    const utilizationPercentage = (this.stats.totalSize / this.config.maxCacheSize) * 100;

    return {
      ...this.stats,
      availableSpace,
      utilizationPercentage
    };
  }

  /**
   * List all cached models
   */
  async listCachedModels(): Promise<Array<{
    modelId: string;
    version: string;
    size: number;
    lastAccessed: number;
    priority: string;
  }>> {
    if (!this.cache) return [];

    const models: Array<any> = [];
    const keys = await this.cache.keys();

    for (const request of keys) {
      const response = await this.cache.match(request);
      if (response) {
        const metadataHeader = response.headers.get('X-Model-Metadata');
        const metadata = metadataHeader ? JSON.parse(metadataHeader) : {};
        const { modelId, version } = this.parseCacheKey(request.url);

        models.push({
          modelId,
          version,
          size: metadata.size || 0,
          lastAccessed: metadata.lastAccessed || 0,
          priority: metadata.priority || 'medium'
        });
      }
    }

    return models.sort((a, b) => b.lastAccessed - a.lastAccessed);
  }

  private async registerServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  private getCacheKey(modelId: string, version?: string): string {
    const finalVersion = version || '1.0.0';
    return `${this.config.cacheName}/${modelId}@${finalVersion}`;
  }

  private parseCacheKey(cacheKey: string): { modelId: string; version: string } {
    const parts = cacheKey.split('/').pop()?.split('@') || [];
    return {
      modelId: parts[0] || '',
      version: parts[1] || '1.0.0'
    };
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.config.maxAge;
  }

  private async ensureSpace(requiredSize: number): Promise<void> {
    if (this.stats.totalSize + requiredSize <= this.config.maxCacheSize) {
      return;
    }

    // Evict least recently used models
    const models = await this.listCachedModels();
    const sortedModels = models.sort((a, b) => {
      // Priority models are less likely to be evicted
      if (a.priority === 'high' && b.priority !== 'high') return 1;
      if (b.priority === 'high' && a.priority !== 'high') return -1;
      
      // Then sort by last accessed
      return a.lastAccessed - b.lastAccessed;
    });

    let freedSpace = 0;
    for (const model of sortedModels) {
      if (freedSpace >= requiredSize) break;
      
      await this.clearModel(model.modelId, model.version);
      freedSpace += model.size;
      this.stats.evictionCount++;
    }
  }

  private async compressData(data: ArrayBuffer | Blob): Promise<{ data: Blob; size: number }> {
    // Simple compression using gzip (in a real implementation, use a proper compression library)
    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Convert to Uint8Array if needed
    const uint8Array = data instanceof ArrayBuffer 
      ? new Uint8Array(data)
      : new Uint8Array(await data.arrayBuffer());

    writer.write(uint8Array);
    writer.close();

    const chunks: Uint8Array[] = [];
    let result;
    while (!(result = await reader.read()).done) {
      chunks.push(result.value);
    }

    const compressedData = new Blob(chunks);
    return {
      data: compressedData,
      size: compressedData.size
    };
  }

  private async decompressData(data: ArrayBuffer): Promise<ArrayBuffer> {
    // Simple decompression using gzip
    const stream = new DecompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    writer.write(new Uint8Array(data));
    writer.close();

    const chunks: Uint8Array[] = [];
    let result;
    while (!(result = await reader.read()).done) {
      chunks.push(result.value);
    }

    // Combine chunks into single ArrayBuffer
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    return combined.buffer;
  }

  private async loadStats(): Promise<void> {
    try {
      const statsData = localStorage.getItem(`${this.config.cacheName}-stats`);
      if (statsData) {
        this.stats = { ...this.stats, ...JSON.parse(statsData) };
      }
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  }

  private async saveStats(): Promise<void> {
    try {
      localStorage.setItem(`${this.config.cacheName}-stats`, JSON.stringify(this.stats));
    } catch (error) {
      console.error('Failed to save cache stats:', error);
    }
  }

  private async cleanupExpiredEntries(): Promise<void> {
    if (!this.cache) return;

    const keys = await this.cache.keys();
    let cleanedCount = 0;

    for (const request of keys) {
      const response = await this.cache.match(request);
      if (response) {
        const metadataHeader = response.headers.get('X-Model-Metadata');
        const metadata = metadataHeader ? JSON.parse(metadataHeader) : {};
        
        if (this.isExpired(metadata.timestamp)) {
          await this.cache.delete(request);
          cleanedCount++;
          this.stats.evictionCount++;
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired cache entries`);
      await this.saveStats();
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const serviceWorkerCache = ServiceWorkerCacheManager.getInstance();