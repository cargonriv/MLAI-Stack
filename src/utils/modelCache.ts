/**
 * Model caching system with browser storage and cache invalidation
 * Handles model storage, retrieval, and automatic cleanup
 */

export interface CacheEntry {
  modelId: string;
  data: ArrayBuffer | Blob;
  metadata: {
    size: number;
    timestamp: number;
    lastAccessed: number;
    version: string;
    checksum?: string;
  };
}

export interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxAge: number; // Maximum age in milliseconds
  compressionEnabled: boolean;
  storageType: 'indexeddb' | 'cache-api' | 'memory';
}

export interface CacheStats {
  totalSize: number;
  entryCount: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
}

class ModelCache {
  private config: CacheConfig;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats = {
    totalSize: 0,
    entryCount: 0,
    hitRate: 0,
    missRate: 0,
    evictionCount: 0
  };
  private hitCount = 0;
  private missCount = 0;
  private dbName = 'ml-model-cache';
  private dbVersion = 1;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 500 * 1024 * 1024, // 500MB default
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days default
      compressionEnabled: true,
      storageType: 'indexeddb',
      ...config
    };

    this.initializeStorage();
    this.startCleanupTimer();
  }

  /**
   * Initialize storage based on configuration
   */
  private async initializeStorage(): Promise<void> {
    if (this.config.storageType === 'indexeddb') {
      await this.initializeIndexedDB();
    } else if (this.config.storageType === 'cache-api') {
      await this.initializeCacheAPI();
    }
    
    // Load existing cache stats
    await this.loadCacheStats();
  }

  /**
   * Initialize IndexedDB for model storage
   */
  private async initializeIndexedDB(): Promise<void> {
    // Check if IndexedDB is available (not in test environment)
    if (typeof indexedDB === 'undefined') {
      console.warn('IndexedDB not available, falling back to memory storage');
      this.config.storageType = 'memory';
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('models')) {
          const store = db.createObjectStore('models', { keyPath: 'modelId' });
          store.createIndex('timestamp', 'metadata.timestamp');
          store.createIndex('lastAccessed', 'metadata.lastAccessed');
        }
      };
    });
  }

  /**
   * Initialize Cache API for model storage
   */
  private async initializeCacheAPI(): Promise<void> {
    if ('caches' in window) {
      await caches.open(this.dbName);
    } else {
      console.warn('Cache API not supported, falling back to memory cache');
      this.config.storageType = 'memory';
    }
  }

  /**
   * Store a model in cache
   */
  async store(modelId: string, data: ArrayBuffer | Blob, version: string = '1.0.0'): Promise<void> {
    const size = data instanceof ArrayBuffer ? data.byteLength : data.size;
    
    // Check if we need to make space
    await this.ensureSpace(size);
    
    const entry: CacheEntry = {
      modelId,
      data,
      metadata: {
        size,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
        version,
        checksum: await this.calculateChecksum(data)
      }
    };

    // Store based on storage type
    switch (this.config.storageType) {
      case 'indexeddb':
        await this.storeInIndexedDB(entry);
        break;
      case 'cache-api':
        await this.storeInCacheAPI(entry);
        break;
      case 'memory':
        this.memoryCache.set(modelId, entry);
        break;
    }

    // Update stats
    this.stats.totalSize += size;
    this.stats.entryCount++;
    
    await this.saveCacheStats();
  }

  /**
   * Retrieve a model from cache
   */
  async retrieve(modelId: string): Promise<ArrayBuffer | Blob | null> {
    let entry: CacheEntry | null = null;

    // Try to get from appropriate storage
    switch (this.config.storageType) {
      case 'indexeddb':
        entry = await this.retrieveFromIndexedDB(modelId);
        break;
      case 'cache-api':
        entry = await this.retrieveFromCacheAPI(modelId);
        break;
      case 'memory':
        entry = this.memoryCache.get(modelId) || null;
        break;
    }

    if (entry) {
      // Check if entry is still valid
      const now = Date.now();
      if (now - entry.metadata.timestamp > this.config.maxAge) {
        await this.remove(modelId);
        this.recordMiss();
        return null;
      }

      // Update last accessed time
      entry.metadata.lastAccessed = now;
      await this.updateLastAccessed(modelId, now);
      
      this.recordHit();
      return entry.data;
    }

    this.recordMiss();
    return null;
  }

  /**
   * Store entry in IndexedDB
   */
  private async storeInIndexedDB(entry: CacheEntry): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['models'], 'readwrite');
        const store = transaction.objectStore('models');
        
        const putRequest = store.put(entry);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieve entry from IndexedDB
   */
  private async retrieveFromIndexedDB(modelId: string): Promise<CacheEntry | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['models'], 'readonly');
        const store = transaction.objectStore('models');
        
        const getRequest = store.get(modelId);
        getRequest.onsuccess = () => resolve(getRequest.result || null);
        getRequest.onerror = () => reject(getRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store entry in Cache API
   */
  private async storeInCacheAPI(entry: CacheEntry): Promise<void> {
    const cache = await caches.open(this.dbName);
    const response = new Response(entry.data, {
      headers: {
        'X-Model-Metadata': JSON.stringify(entry.metadata)
      }
    });
    
    await cache.put(`/models/${entry.modelId}`, response);
  }

  /**
   * Retrieve entry from Cache API
   */
  private async retrieveFromCacheAPI(modelId: string): Promise<CacheEntry | null> {
    const cache = await caches.open(this.dbName);
    const response = await cache.match(`/models/${modelId}`);
    
    if (!response) return null;
    
    const data = await response.blob();
    const metadataHeader = response.headers.get('X-Model-Metadata');
    
    if (!metadataHeader) return null;
    
    const metadata = JSON.parse(metadataHeader);
    
    return {
      modelId,
      data,
      metadata
    };
  }

  /**
   * Update last accessed time for an entry
   */
  private async updateLastAccessed(modelId: string, timestamp: number): Promise<void> {
    if (this.config.storageType === 'memory') {
      const entry = this.memoryCache.get(modelId);
      if (entry) {
        entry.metadata.lastAccessed = timestamp;
      }
      return;
    }

    if (this.config.storageType === 'indexeddb') {
      const entry = await this.retrieveFromIndexedDB(modelId);
      if (entry) {
        entry.metadata.lastAccessed = timestamp;
        await this.storeInIndexedDB(entry);
      }
    }
  }

  /**
   * Remove a model from cache
   */
  async remove(modelId: string): Promise<void> {
    let removedSize = 0;

    switch (this.config.storageType) {
      case 'indexeddb':
        const entry = await this.retrieveFromIndexedDB(modelId);
        if (entry) {
          removedSize = entry.metadata.size;
          await this.removeFromIndexedDB(modelId);
        }
        break;
      case 'cache-api':
        const cache = await caches.open(this.dbName);
        await cache.delete(`/models/${modelId}`);
        break;
      case 'memory':
        const memEntry = this.memoryCache.get(modelId);
        if (memEntry) {
          removedSize = memEntry.metadata.size;
          this.memoryCache.delete(modelId);
        }
        break;
    }

    // Update stats
    if (removedSize > 0) {
      this.stats.totalSize -= removedSize;
      this.stats.entryCount--;
      this.stats.evictionCount++;
    }

    await this.saveCacheStats();
  }

  /**
   * Remove entry from IndexedDB
   */
  private async removeFromIndexedDB(modelId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['models'], 'readwrite');
        const store = transaction.objectStore('models');
        
        const deleteRequest = store.delete(modelId);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Ensure there's enough space for new entry
   */
  private async ensureSpace(requiredSize: number): Promise<void> {
    const availableSpace = this.config.maxSize - this.stats.totalSize;
    
    if (availableSpace >= requiredSize) return;
    
    // Need to evict some entries
    const spaceToFree = requiredSize - availableSpace;
    await this.evictLeastRecentlyUsed(spaceToFree);
  }

  /**
   * Evict least recently used entries
   */
  private async evictLeastRecentlyUsed(spaceToFree: number): Promise<void> {
    const entries = await this.getAllEntries();
    
    // Sort by last accessed time (oldest first)
    entries.sort((a, b) => a.metadata.lastAccessed - b.metadata.lastAccessed);
    
    let freedSpace = 0;
    for (const entry of entries) {
      if (freedSpace >= spaceToFree) break;
      
      await this.remove(entry.modelId);
      freedSpace += entry.metadata.size;
    }
  }

  /**
   * Get all cache entries
   */
  private async getAllEntries(): Promise<CacheEntry[]> {
    switch (this.config.storageType) {
      case 'indexeddb':
        return this.getAllFromIndexedDB();
      case 'cache-api':
        return this.getAllFromCacheAPI();
      case 'memory':
        return Array.from(this.memoryCache.values());
      default:
        return [];
    }
  }

  /**
   * Get all entries from IndexedDB
   */
  private async getAllFromIndexedDB(): Promise<CacheEntry[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['models'], 'readonly');
        const store = transaction.objectStore('models');
        
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all entries from Cache API
   */
  private async getAllFromCacheAPI(): Promise<CacheEntry[]> {
    const cache = await caches.open(this.dbName);
    const requests = await cache.keys();
    const entries: CacheEntry[] = [];
    
    for (const request of requests) {
      const modelId = request.url.split('/').pop();
      if (modelId) {
        const entry = await this.retrieveFromCacheAPI(modelId);
        if (entry) entries.push(entry);
      }
    }
    
    return entries;
  }

  /**
   * Calculate checksum for data integrity
   */
  private async calculateChecksum(data: ArrayBuffer | Blob): Promise<string> {
    const buffer = data instanceof ArrayBuffer ? data : await data.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Record cache hit
   */
  private recordHit(): void {
    this.hitCount++;
    this.updateHitRate();
  }

  /**
   * Record cache miss
   */
  private recordMiss(): void {
    this.missCount++;
    this.updateHitRate();
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    const total = this.hitCount + this.missCount;
    this.stats.hitRate = total > 0 ? this.hitCount / total : 0;
    this.stats.missRate = total > 0 ? this.missCount / total : 0;
  }

  /**
   * Start cleanup timer for expired entries
   */
  private startCleanupTimer(): void {
    setInterval(async () => {
      await this.cleanupExpiredEntries();
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Clean up expired entries
   */
  private async cleanupExpiredEntries(): Promise<void> {
    const entries = await this.getAllEntries();
    const now = Date.now();
    
    for (const entry of entries) {
      if (now - entry.metadata.timestamp > this.config.maxAge) {
        await this.remove(entry.modelId);
      }
    }
  }

  /**
   * Load cache statistics from storage
   */
  private async loadCacheStats(): Promise<void> {
    try {
      const statsJson = localStorage.getItem('ml-cache-stats');
      if (statsJson) {
        const savedStats = JSON.parse(statsJson);
        this.stats = { ...this.stats, ...savedStats };
        this.hitCount = savedStats.hitCount || 0;
        this.missCount = savedStats.missCount || 0;
      }
    } catch (error) {
      console.warn('Failed to load cache stats:', error);
    }
  }

  /**
   * Save cache statistics to storage
   */
  private async saveCacheStats(): Promise<void> {
    try {
      const statsToSave = {
        ...this.stats,
        hitCount: this.hitCount,
        missCount: this.missCount
      };
      localStorage.setItem('ml-cache-stats', JSON.stringify(statsToSave));
    } catch (error) {
      console.warn('Failed to save cache stats:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    switch (this.config.storageType) {
      case 'indexeddb':
        await this.clearIndexedDB();
        break;
      case 'cache-api':
        const cache = await caches.open(this.dbName);
        const requests = await cache.keys();
        await Promise.all(requests.map(req => cache.delete(req)));
        break;
      case 'memory':
        this.memoryCache.clear();
        break;
    }

    // Reset stats
    this.stats = {
      totalSize: 0,
      entryCount: 0,
      hitRate: 0,
      missRate: 0,
      evictionCount: 0
    };
    this.hitCount = 0;
    this.missCount = 0;

    await this.saveCacheStats();
  }

  /**
   * Clear IndexedDB
   */
  private async clearIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['models'], 'readwrite');
        const store = transaction.objectStore('models');
        
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if model exists in cache
   */
  async has(modelId: string): Promise<boolean> {
    const entry = await this.retrieve(modelId);
    return entry !== null;
  }

  /**
   * Get cache configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Singleton instance
export const modelCache = new ModelCache();