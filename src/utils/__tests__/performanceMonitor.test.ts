/**
 * Tests for performance monitoring system
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { performanceMonitor, PerformanceWarning } from '../performanceMonitor';

// Mock performance.memory
const mockMemory = {
  usedJSHeapSize: 50 * 1024 * 1024, // 50MB
  totalJSHeapSize: 100 * 1024 * 1024, // 100MB
  jsHeapSizeLimit: 200 * 1024 * 1024 // 200MB
};

Object.defineProperty(window.performance, 'memory', {
  value: mockMemory,
  writable: true
});

// Mock navigator properties
Object.defineProperty(navigator, 'hardwareConcurrency', {
  value: 4,
  writable: true
});

Object.defineProperty(navigator, 'deviceMemory', {
  value: 8,
  writable: true
});

// Mock WebGL context
const mockWebGLContext = {
  getParameter: vi.fn(),
  getExtension: vi.fn()
};

HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextType) => {
  if (contextType === 'webgl' || contextType === 'experimental-webgl') {
    return mockWebGLContext;
  }
  return null;
});

// Mock WebAssembly
Object.defineProperty(global, 'WebAssembly', {
  value: {
    instantiate: vi.fn()
  },
  writable: true
});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Reset memory values
    mockMemory.usedJSHeapSize = 50 * 1024 * 1024;
    mockMemory.totalJSHeapSize = 100 * 1024 * 1024;
    mockMemory.jsHeapSizeLimit = 200 * 1024 * 1024;
    
    // Clear any existing warnings
    performanceMonitor.clearWarnings();
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('Device Capabilities Detection', () => {
    test('should detect device capabilities correctly', () => {
      const capabilities = performanceMonitor.getDeviceCapabilities();
      
      expect(capabilities).toMatchObject({
        hardwareConcurrency: 4,
        webglSupported: true,
        wasmSupported: true,
        deviceMemory: 8
      });
      expect(capabilities.userAgent).toBeDefined();
    });

    test('should handle missing device memory gracefully', () => {
      Object.defineProperty(navigator, 'deviceMemory', {
        value: undefined,
        writable: true
      });

      const capabilities = performanceMonitor.getDeviceCapabilities();
      expect(capabilities.deviceMemory).toBeUndefined();
    });
  });

  describe('Performance Metrics Recording', () => {
    test('should record model loading performance', () => {
      const modelId = 'test-model';
      const loadTime = 2000;
      const memoryUsage = 50 * 1024 * 1024;

      performanceMonitor.recordModelLoad(modelId, loadTime, memoryUsage);
      
      const modelData = performanceMonitor.getModelPerformance(modelId);
      expect(modelData).toBeDefined();
      expect(modelData?.averageLoadTime).toBe(loadTime);
      expect(modelData?.memoryFootprint).toBe(memoryUsage);
    });

    test('should record inference performance', () => {
      const modelId = 'test-model';
      const loadTime = 1000;
      const memoryUsage = 30 * 1024 * 1024;
      const inferenceTime = 500;

      // First record model load
      performanceMonitor.recordModelLoad(modelId, loadTime, memoryUsage);
      
      // Then record inference
      performanceMonitor.recordInference(modelId, inferenceTime, 1);
      
      const modelData = performanceMonitor.getModelPerformance(modelId);
      expect(modelData?.averageInferenceTime).toBe(inferenceTime);
      expect(modelData?.metrics[0].throughput).toBe(2); // 1 item / 0.5 seconds
    });

    test('should calculate average metrics correctly', () => {
      const modelId = 'test-model';
      
      // Record multiple loads
      performanceMonitor.recordModelLoad(modelId, 1000, 50 * 1024 * 1024);
      performanceMonitor.recordModelLoad(modelId, 2000, 50 * 1024 * 1024);
      performanceMonitor.recordModelLoad(modelId, 3000, 50 * 1024 * 1024);
      
      const modelData = performanceMonitor.getModelPerformance(modelId);
      expect(modelData?.averageLoadTime).toBe(2000); // (1000 + 2000 + 3000) / 3
    });
  });

  describe('Performance Warnings', () => {
    test('should generate warning for slow model loading', () => {
      const modelId = 'slow-model';
      const slowLoadTime = 10000; // 10 seconds
      
      performanceMonitor.recordModelLoad(modelId, slowLoadTime, 50 * 1024 * 1024);
      
      const warnings = performanceMonitor.getWarnings();
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].type).toBe('performance');
      expect(warnings[0].message).toContain('Slow model loading');
    });

    test('should generate warning for slow inference', () => {
      const modelId = 'test-model';
      
      // First record model load
      performanceMonitor.recordModelLoad(modelId, 1000, 30 * 1024 * 1024);
      
      // Then record slow inference
      performanceMonitor.recordInference(modelId, 8000, 1); // 8 seconds
      
      const warnings = performanceMonitor.getWarnings();
      const performanceWarnings = warnings.filter(w => w.type === 'performance');
      expect(performanceWarnings.length).toBeGreaterThan(0);
    });

    test('should generate memory warning for high usage', () => {
      // Simulate high memory usage
      mockMemory.usedJSHeapSize = 180 * 1024 * 1024; // 90% of limit
      
      // Trigger memory check (normally done by interval)
      performanceMonitor['checkMemoryUsage']();
      
      const warnings = performanceMonitor.getWarnings();
      const memoryWarnings = warnings.filter(w => w.type === 'memory');
      expect(memoryWarnings.length).toBeGreaterThan(0);
    });

    test('should clear warnings', () => {
      // Generate a warning
      performanceMonitor.recordModelLoad('test', 10000, 50 * 1024 * 1024);
      
      expect(performanceMonitor.getWarnings().length).toBeGreaterThan(0);
      
      performanceMonitor.clearWarnings();
      expect(performanceMonitor.getWarnings().length).toBe(0);
    });
  });

  describe('Model Optimization Suggestions', () => {
    test('should suggest optimal model for low-end device', () => {
      // Mock low-end device
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 2,
        writable: true
      });
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 2,
        writable: true
      });

      const availableModels = ['bert-large', 'bert-base', 'distilbert-small'];
      const suggestion = performanceMonitor.suggestOptimalModel(availableModels);
      
      expect(suggestion).toBe('distilbert-small');
    });

    test('should suggest optimal model for high-end device', () => {
      // Mock high-end device
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 8,
        writable: true
      });
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 16,
        writable: true
      });

      const availableModels = ['bert-large', 'bert-base', 'distilbert-small'];
      const suggestion = performanceMonitor.suggestOptimalModel(availableModels);
      
      expect(suggestion).toBe('bert-large');
    });

    test('should provide performance recommendations', () => {
      // Mock low-memory device
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 2,
        writable: true
      });

      const recommendations = performanceMonitor.getPerformanceRecommendations();
      
      expect(recommendations).toContain('Use quantized models to reduce memory usage');
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Memory Statistics', () => {
    test('should return memory statistics', () => {
      const stats = performanceMonitor.getMemoryStats();
      
      expect(stats).toEqual({
        used: mockMemory.usedJSHeapSize,
        total: mockMemory.totalJSHeapSize,
        limit: mockMemory.jsHeapSizeLimit
      });
    });

    test('should return null when memory API unavailable', () => {
      // Temporarily remove memory API
      const originalMemory = (performance as any).memory;
      delete (performance as any).memory;
      
      const stats = performanceMonitor.getMemoryStats();
      expect(stats).toBeNull();
      
      // Restore memory API
      (performance as any).memory = originalMemory;
    });
  });

  describe('Data Export', () => {
    test('should export performance data', () => {
      // Record some data
      performanceMonitor.recordModelLoad('test-model', 1000, 50 * 1024 * 1024);
      performanceMonitor.recordInference('test-model', 500, 1);
      
      const exportedData = performanceMonitor.exportPerformanceData();
      const parsedData = JSON.parse(exportedData);
      
      expect(parsedData).toHaveProperty('deviceInfo');
      expect(parsedData).toHaveProperty('modelMetrics');
      expect(parsedData).toHaveProperty('warnings');
      expect(parsedData).toHaveProperty('timestamp');
      
      expect(parsedData.modelMetrics.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing WebGL gracefully', () => {
      HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);
      
      const capabilities = performanceMonitor.getDeviceCapabilities();
      expect(capabilities.webglSupported).toBe(false);
    });

    test('should handle missing WebAssembly gracefully', () => {
      delete (global as any).WebAssembly;
      
      const capabilities = performanceMonitor.getDeviceCapabilities();
      expect(capabilities.wasmSupported).toBe(false);
    });

    test('should handle model performance queries for non-existent models', () => {
      const modelData = performanceMonitor.getModelPerformance('non-existent-model');
      expect(modelData).toBeUndefined();
    });
  });
});