/**
 * Tests for Model Quantization utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModelQuantizer, QuantizationConfig } from '../modelQuantization';

describe('ModelQuantizer', () => {
  let quantizer: ModelQuantizer;
  let mockModel: any;

  beforeEach(() => {
    quantizer = ModelQuantizer.getInstance();
    quantizer.clearCache();
    
    mockModel = {
      weights: new Map([
        ['layer1', new Float32Array([1.5, -2.3, 0.8, 3.2, -1.1])],
        ['layer2', new Float32Array([0.5, 1.8, -0.9, 2.1])]
      ])
    };
  });

  describe('quantizeModel', () => {
    it('should quantize model to INT8 precision', async () => {
      const config: QuantizationConfig = {
        precision: 'int8',
        enableDynamicQuantization: true,
        targetMemoryReduction: 75
      };

      const result = await quantizer.quantizeModel('test-model', mockModel, config);

      expect(result.precision).toBe('int8');
      expect(result.compressionRatio).toBeGreaterThan(1);
      expect(result.quantizedSize).toBeLessThan(result.originalSize);
    });

    it('should quantize model to INT16 precision', async () => {
      const config: QuantizationConfig = {
        precision: 'int16',
        enableDynamicQuantization: false,
        targetMemoryReduction: 50
      };

      const result = await quantizer.quantizeModel('test-model', mockModel, config);

      expect(result.precision).toBe('int16');
      expect(result.model.quantized).toBe(true);
    });

    it('should handle float16 quantization', async () => {
      const config: QuantizationConfig = {
        precision: 'float16',
        enableDynamicQuantization: false,
        targetMemoryReduction: 25
      };

      const result = await quantizer.quantizeModel('test-model', mockModel, config);

      expect(result.precision).toBe('float16');
      expect(result.model.quantized).toBe(true);
    });

    it('should track performance metrics', async () => {
      const config: QuantizationConfig = {
        precision: 'int8',
        enableDynamicQuantization: true,
        targetMemoryReduction: 75
      };

      const result = await quantizer.quantizeModel('test-model', mockModel, config);

      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics!.loadTime).toBeGreaterThan(0);
    });
  });

  describe('getQuantizedModel', () => {
    it('should retrieve quantized model', async () => {
      const config: QuantizationConfig = {
        precision: 'int8',
        enableDynamicQuantization: true,
        targetMemoryReduction: 75
      };

      await quantizer.quantizeModel('test-model', mockModel, config);
      const retrieved = quantizer.getQuantizedModel('test-model');

      expect(retrieved).toBeDefined();
      expect(retrieved!.modelId).toBe('test-model');
      expect(retrieved!.precision).toBe('int8');
    });

    it('should return null for non-existent model', () => {
      const retrieved = quantizer.getQuantizedModel('non-existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('isQuantizationSupported', () => {
    it('should check quantization support', () => {
      // Mock WebGL and WebAssembly support
      Object.defineProperty(window, 'WebAssembly', {
        value: { compile: vi.fn() },
        writable: true
      });

      const supported = quantizer.isQuantizationSupported();
      expect(typeof supported).toBe('boolean');
    });
  });

  describe('getRecommendedQuantization', () => {
    it('should recommend INT8 for mobile devices', () => {
      const deviceInfo = { memory: 1024 }; // 1GB
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true
      });

      const recommendation = quantizer.getRecommendedQuantization(deviceInfo);

      expect(recommendation.precision).toBe('int8');
      expect(recommendation.targetMemoryReduction).toBe(75);
    });

    it('should recommend INT16 for low-memory desktop', () => {
      const deviceInfo = { memory: 3072 }; // 3GB
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true
      });

      const recommendation = quantizer.getRecommendedQuantization(deviceInfo);

      expect(recommendation.precision).toBe('int16');
      expect(recommendation.targetMemoryReduction).toBe(50);
    });

    it('should recommend FLOAT16 for high-memory desktop', () => {
      const deviceInfo = { memory: 8192 }; // 8GB
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true
      });

      const recommendation = quantizer.getRecommendedQuantization(deviceInfo);

      expect(recommendation.precision).toBe('float16');
      expect(recommendation.targetMemoryReduction).toBe(25);
    });
  });

  describe('getMemoryStats', () => {
    it('should return memory statistics', async () => {
      const config: QuantizationConfig = {
        precision: 'int8',
        enableDynamicQuantization: true,
        targetMemoryReduction: 75
      };

      await quantizer.quantizeModel('test-model-1', mockModel, config);
      await quantizer.quantizeModel('test-model-2', mockModel, config);

      const stats = quantizer.getMemoryStats();

      expect(stats.modelsCount).toBe(2);
      expect(stats.totalOriginalSize).toBeGreaterThan(0);
      expect(stats.totalQuantizedSize).toBeGreaterThan(0);
      expect(stats.totalSavings).toBeGreaterThan(0);
    });
  });

  describe('clearCache', () => {
    it('should clear all quantized models', async () => {
      const config: QuantizationConfig = {
        precision: 'int8',
        enableDynamicQuantization: true,
        targetMemoryReduction: 75
      };

      await quantizer.quantizeModel('test-model', mockModel, config);
      expect(quantizer.getQuantizedModel('test-model')).toBeDefined();

      quantizer.clearCache();
      expect(quantizer.getQuantizedModel('test-model')).toBeNull();
    });
  });
});