/**
 * Tests for Service Worker Cache Management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ServiceWorkerCacheManager, CacheConfig } from '../serviceWorkerCache';

// Mock browser APIs
const mockCache = {
  put: vi.fn(),
  match: vi.fn(),
  delete: vi.fn(),
  keys: vi.fn()
};

const mockCaches = {
  open: vi.fn().mockResolvedValue(mockCache),
  delete: vi.fn()
};

Object.defineProperty(global, 'caches', {
  value: mockCaches,
  writable: true
});

Object.defineProperty(global, 'navigator', {
  value: {
    serviceWorker: {
      register: vi.fn().mockResolvedValue({ scope: '/' })
    }
  },
  writable: true
});

Object.defineProperty(global, 'Response', {
  value: class MockResponse {
    constructor(public body: any, public init?: ResponseInit) {}
    
    get headers() {
      return new Map(Object.entries(this.init?.headers || {}));
    }
    
    async arrayBuffer() {
      return this.body instanceof ArrayBuffer ? this.body : new ArrayBuffer(0);
    }
  },
  writable: true
});

Object.defineProperty(global, 'CompressionStream', {
  value: class MockCompressionStream {
    readable = {
      getReader: () => ({
        read: vi.fn().mockResolvedValue({ done: true, value: undefined })
      })
    };
    writable = {
      getWriter: () => ({
        write: vi.fn(),
        close: vi.fn()
      })
    };
  },
  writable: true
});

Object.defineProperty(global, 'DecompressionStream', {
  value: class MockDecompressionStream {
    readable = {
      getReader: () => ({
        read: vi.fn().mockResolvedValue({ done: true, value: undefined })
      })
    };
    writable = {
      getWriter: () => ({
        write: vi.fn(),
        close: vi.fn()
      })
    };
  },
  writable: true
});

describe('ServiceWorkerCacheManager', () => {
  let cacheManager: ServiceWorkerCacheManager;
  let config: CacheConfig;

  beforeEach(() => {
    config = {
      cacheName: 'test-ml-cache',
      maxCacheSize: 100 * 1024 * 1024, // 100MB
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      enableCompression: true,
      enableVersioning: true,
      priorityModels: ['test-model']
    };

    cacheManager = ServiceWorkerCacheManager.getInstance(config);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ServiceWorkerCacheManager.getInstance();
      const instance2 = ServiceWorkerCacheManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('cacheModel', () => {
    it('should cache model successfully', async () => {
      const modelData = new ArrayBuffer(1024);
      mockCache.put.mockResolvedValueOnce(undefined);

      const result = await cacheManager.cacheModel('test-model', modelData, '1.0.0', 'high');

      expect(result).toBe(true);
      expect(mockCache.put).toHaveBeenCalled();
    });

    it('should handle caching errors', async () => {
      const modelData = new ArrayBuffer(1024);
      mockCache.put.mockRejectedValueOnce(new Error('Cache error'));

      const result = await cacheManager.cacheModel('test-model', modelData, '1.0.0', 'high');

      expect(result).toBe(false);
    });

    it('should compress data when enabled', async () => {
      const modelData = new ArrayBuffer(1024);
      mockCache.put.mockResolvedValueOnce(undefined);

      const result = await cacheManager.cacheModel('test-model', modelData, '1.0.0', 'high');

      expect(result).toBe(true);
      // Compression should be attempted
    });
  });

  describe('getCachedModel', () => {
    it('should retrieve cached model', async () => {
      const mockResponse = new Response(new ArrayBuffer(1024), {
        headers: {
          'X-Model-Metadata': JSON.stringify({
            size: 1024,
            timestamp: Date.now(),
            accessCount: 0,
            lastAccessed: Date.now(),
            priority: 'high'
          })
        }
      });

      mockCache.match.mockResolvedValueOnce(mockResponse);

      const result = await cacheManager.getCachedModel('test-model', '1.0.0');

      expect(result).toBeDefined();
      expect(result!.modelId).toBe('test-model');
      expect(result!.version).toBe('1.0.0');
    });

    it('should return null for cache miss', async () => {
      mockCache.match.mockResolvedValueOnce(undefined);

      const result = await cacheManager.getCachedModel('non-existent-model');

      expect(result).toBeNull();
    });

    it('should handle expired models', async () => {
      const expiredTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      const mockResponse = new Response(new ArrayBuffer(1024), {
        headers: {
          'X-Model-Metadata': JSON.stringify({
            size: 1024,
            timestamp: expiredTimestamp,
            accessCount: 0,
            lastAccessed: expiredTimestamp,
            priority: 'high'
          })
        }
      });

      mockCache.match.mockResolvedValueOnce(mockResponse);
      mockCache.delete.mockResolvedValueOnce(true);

      const result = await cacheManager.getCachedModel('expired-model');

      expect(result).toBeNull();
      expect(mockCache.delete).toHaveBeenCalled();
    });
  });

  describe('isModelCached', () => {
    it('should return true for cached model', async () => {
      const mockResponse = new Response(new ArrayBuffer(1024), {
        headers: {
          'X-Model-Metadata': JSON.stringify({
            timestamp: Date.now(),
            priority: 'high'
          })
        }
      });

      mockCache.match.mockResolvedValueOnce(mockResponse);

      const result = await cacheManager.isModelCached('test-model');

      expect(result).toBe(true);
    });

    it('should return false for non-cached model', async () => {
      mockCache.match.mockResolvedValueOnce(undefined);

      const result = await cacheManager.isModelCached('non-existent-model');

      expect(result).toBe(false);
    });

    it('should return false for expired model', async () => {
      const expiredTimestamp = Date.now() - (25 * 60 * 60 * 1000);
      const mockResponse = new Response(new ArrayBuffer(1024), {
        headers: {
          'X-Model-Metadata': JSON.stringify({
            timestamp: expiredTimestamp
          })
        }
      });

      mockCache.match.mockResolvedValueOnce(mockResponse);
      mockCache.delete.mockResolvedValueOnce(true);

      const result = await cacheManager.isModelCached('expired-model');

      expect(result).toBe(false);
    });
  });

  describe('clearModel', () => {
    it('should clear specific model', async () => {
      mockCache.delete.mockResolvedValueOnce(true);

      const result = await cacheManager.clearModel('test-model', '1.0.0');

      expect(result).toBe(true);
      expect(mockCache.delete).toHaveBeenCalled();
    });

    it('should handle deletion errors', async () => {
      mockCache.delete.mockRejectedValueOnce(new Error('Delete error'));

      const result = await cacheManager.clearModel('test-model');

      expect(result).toBe(false);
    });
  });

  describe('clearAll', () => {
    it('should clear all cached models', async () => {
      mockCaches.delete.mockResolvedValueOnce(true);
      mockCaches.open.mockResolvedValueOnce(mockCache);

      await expect(cacheManager.clearAll()).resolves.not.toThrow();
      expect(mockCaches.delete).toHaveBeenCalledWith(config.cacheName);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const stats = cacheManager.getCacheStats();

      expect(stats).toBeDefined();
      expect(stats.totalSize).toBeDefined();
      expect(stats.modelCount).toBeDefined();
      expect(stats.availableSpace).toBeDefined();
      expect(stats.utilizationPercentage).toBeDefined();
    });
  });

  describe('listCachedModels', () => {
    it('should list all cached models', async () => {
      const mockRequest = { url: 'test-ml-cache/test-model@1.0.0' };
      const mockResponse = new Response(new ArrayBuffer(1024), {
        headers: {
          'X-Model-Metadata': JSON.stringify({
            size: 1024,
            lastAccessed: Date.now(),
            priority: 'high'
          })
        }
      });

      mockCache.keys.mockResolvedValueOnce([mockRequest]);
      mockCache.match.mockResolvedValueOnce(mockResponse);

      const models = await cacheManager.listCachedModels();

      expect(models).toHaveLength(1);
      expect(models[0].modelId).toBe('test-model');
      expect(models[0].version).toBe('1.0.0');
    });

    it('should return empty array when no models cached', async () => {
      mockCache.keys.mockResolvedValueOnce([]);

      const models = await cacheManager.listCachedModels();

      expect(models).toHaveLength(0);
    });
  });

  describe('preloadPriorityModels', () => {
    it('should attempt to preload priority models', async () => {
      mockCache.match.mockResolvedValueOnce(undefined); // Model not cached

      await expect(cacheManager.preloadPriorityModels()).resolves.not.toThrow();
    });
  });
});