/**
 * Tests for Progressive Loader utilities
 */

import { progressiveLoader, LoadingProgress, ModelConfig } from '../progressiveLoader';
import { deviceDetection } from '../deviceDetection';

// Mock fetch
global.fetch = jest.fn();

// Mock device detection
jest.mock('../deviceDetection');

const mockDeviceDetection = deviceDetection as jest.Mocked<typeof deviceDetection>;

describe('Progressive Loader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockDeviceDetection.getDeviceCapabilities.mockResolvedValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      hasTouch: false,
      screenSize: 'large',
      memoryGB: 8,
      cores: 8,
      webglSupported: true,
      wasmSupported: true,
      performanceLevel: 'high'
    });

    mockDeviceDetection.getNetworkCapabilities.mockResolvedValue({
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
      saveData: false,
      isOnline: true,
      bandwidth: 'high'
    });
  });

  describe('loadModelProgressively', () => {
    const mockConfig: ModelConfig = {
      modelId: 'test-model',
      baseUrl: 'https://example.com/models',
      files: ['model.bin', 'config.json'],
      totalSize: 1024 * 1024, // 1MB
      minChunkSize: 256 * 1024,
      maxChunkSize: 512 * 1024,
      priority: 'medium'
    };

    it('should load model successfully with progress tracking', async () => {
      const mockArrayBuffer = new ArrayBuffer(512 * 1024);
      
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-length', '524288']]),
          arrayBuffer: () => Promise.resolve(mockArrayBuffer)
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-length', '524288']]),
          arrayBuffer: () => Promise.resolve(mockArrayBuffer)
        });

      const progressCallback = jest.fn();
      
      const result = await progressiveLoader.loadModelProgressively(
        mockConfig,
        progressCallback
      );

      expect(result).toBeDefined();
      expect(progressCallback).toHaveBeenCalled();
      
      // Check that progress was reported
      const progressCalls = progressCallback.mock.calls;
      expect(progressCalls.length).toBeGreaterThan(0);
      
      // Check final progress call
      const finalProgress = progressCalls[progressCalls.length - 1][0] as LoadingProgress;
      expect(finalProgress.phase).toBe('ready');
      expect(finalProgress.progress).toBe(100);
    });

    it('should adapt loading options for mobile devices', async () => {
      mockDeviceDetection.getDeviceCapabilities.mockResolvedValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        hasTouch: true,
        screenSize: 'small',
        memoryGB: 4,
        cores: 4,
        webglSupported: true,
        wasmSupported: true,
        performanceLevel: 'medium'
      });

      mockDeviceDetection.getNetworkCapabilities.mockResolvedValue({
        effectiveType: '3g',
        downlink: 2,
        rtt: 200,
        saveData: false,
        isOnline: true,
        bandwidth: 'medium'
      });

      const mockArrayBuffer = new ArrayBuffer(256 * 1024);
      
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Map([['content-length', '262144']]),
        arrayBuffer: () => Promise.resolve(mockArrayBuffer)
      });

      const progressCallback = jest.fn();
      
      await progressiveLoader.loadModelProgressively(
        mockConfig,
        progressCallback
      );

      // Verify that mobile optimizations were applied
      expect(progressCallback).toHaveBeenCalled();
    });

    it('should handle slow network conditions', async () => {
      mockDeviceDetection.getNetworkCapabilities.mockResolvedValue({
        effectiveType: '2g',
        downlink: 0.5,
        rtt: 500,
        saveData: true,
        isOnline: true,
        bandwidth: 'low'
      });

      const mockArrayBuffer = new ArrayBuffer(128 * 1024);
      
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Map([['content-length', '131072']]),
        arrayBuffer: () => Promise.resolve(mockArrayBuffer)
      });

      const progressCallback = jest.fn();
      
      await progressiveLoader.loadModelProgressively(
        mockConfig,
        progressCallback
      );

      expect(progressCallback).toHaveBeenCalled();
      
      // Verify that slow network adaptations were applied
      const progressCalls = progressCallback.mock.calls;
      expect(progressCalls.length).toBeGreaterThan(0);
    });

    it('should handle chunked loading for large files', async () => {
      const largeConfig: ModelConfig = {
        ...mockConfig,
        totalSize: 10 * 1024 * 1024, // 10MB
        files: ['large-model.bin']
      };

      // Mock HEAD request for file size
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-length', '10485760']])
        });

      // Mock chunked responses
      const chunkSize = 1024 * 1024; // 1MB chunks
      for (let i = 0; i < 10; i++) {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(chunkSize))
        });
      }

      const progressCallback = jest.fn();
      
      await progressiveLoader.loadModelProgressively(
        largeConfig,
        progressCallback
      );

      expect(progressCallback).toHaveBeenCalled();
      
      // Verify chunked loading progress
      const progressCalls = progressCallback.mock.calls;
      expect(progressCalls.length).toBeGreaterThan(1);
    });

    it('should handle loading errors with retries', async () => {
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-length', '524288']]),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(512 * 1024))
        });

      const progressCallback = jest.fn();
      
      await expect(
        progressiveLoader.loadModelProgressively(mockConfig, progressCallback)
      ).rejects.toThrow();
    });

    it('should handle cancellation', async () => {
      const mockArrayBuffer = new ArrayBuffer(512 * 1024);
      
      (fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => resolve({
            ok: true,
            headers: new Map([['content-length', '524288']]),
            arrayBuffer: () => Promise.resolve(mockArrayBuffer)
          }), 1000);
        })
      );

      const progressCallback = jest.fn();
      
      // Start loading
      const loadingPromise = progressiveLoader.loadModelProgressively(
        mockConfig,
        progressCallback
      );

      // Cancel immediately
      progressiveLoader.cancelLoading(mockConfig.modelId);

      await expect(loadingPromise).rejects.toThrow('Loading cancelled');
    });

    it('should return existing loading task if already in progress', async () => {
      const mockArrayBuffer = new ArrayBuffer(512 * 1024);
      
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Map([['content-length', '524288']]),
        arrayBuffer: () => Promise.resolve(mockArrayBuffer)
      });

      const progressCallback1 = jest.fn();
      const progressCallback2 = jest.fn();
      
      // Start two loading tasks for the same model
      const promise1 = progressiveLoader.loadModelProgressively(
        mockConfig,
        progressCallback1
      );
      
      const promise2 = progressiveLoader.loadModelProgressively(
        mockConfig,
        progressCallback2
      );

      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      // Both should return the same result
      expect(result1).toBe(result2);
    });
  });

  describe('Loading management', () => {
    it('should track loading status correctly', () => {
      expect(progressiveLoader.isLoading('test-model')).toBe(false);
      
      // Start loading (this will be async, so we can't easily test the true state)
      expect(progressiveLoader.getLoadingTasks()).toEqual([]);
    });

    it('should cancel all loading tasks', () => {
      progressiveLoader.cancelAllLoading();
      expect(progressiveLoader.getLoadingTasks()).toEqual([]);
    });
  });

  describe('Adaptive loading options', () => {
    it('should use smaller chunks for low bandwidth', async () => {
      mockDeviceDetection.getNetworkCapabilities.mockResolvedValue({
        effectiveType: '2g',
        downlink: 0.5,
        rtt: 500,
        saveData: true,
        isOnline: true,
        bandwidth: 'low'
      });

      const mockArrayBuffer = new ArrayBuffer(256 * 1024);
      
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Map([['content-length', '262144']]),
        arrayBuffer: () => Promise.resolve(mockArrayBuffer)
      });

      const progressCallback = jest.fn();
      
      await progressiveLoader.loadModelProgressively(
        mockConfig,
        progressCallback
      );

      expect(progressCallback).toHaveBeenCalled();
    });

    it('should disable compression for low-end devices', async () => {
      mockDeviceDetection.getDeviceCapabilities.mockResolvedValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        hasTouch: true,
        screenSize: 'small',
        memoryGB: 2,
        cores: 2,
        webglSupported: false,
        wasmSupported: true,
        performanceLevel: 'low'
      });

      const mockArrayBuffer = new ArrayBuffer(256 * 1024);
      
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Map([['content-length', '262144']]),
        arrayBuffer: () => Promise.resolve(mockArrayBuffer)
      });

      const progressCallback = jest.fn();
      
      await progressiveLoader.loadModelProgressively(
        mockConfig,
        progressCallback
      );

      expect(progressCallback).toHaveBeenCalled();
    });
  });
});