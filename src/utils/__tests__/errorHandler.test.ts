/**
 * Tests for comprehensive error handling and fallback strategies
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { errorHandler } from '../errorHandler';
import { deviceCompatibility } from '../deviceCompatibility';
import { fallbackManager } from '../fallbackManager';

// Mock dependencies
vi.mock('../deviceCompatibility');
vi.mock('../fallbackManager');

describe('MLErrorHandler', () => {
  beforeEach(() => {
    // Reset error handler state
    errorHandler.resetErrorCounts();
    errorHandler.clearCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Type Detection', () => {
    it('should detect network errors', async () => {
      const networkError = new Error('Failed to fetch model');
      const context = {
        operation: 'model-loading',
        timestamp: Date.now()
      };

      const result = await errorHandler.handleError(networkError, context);
      
      expect(result.recoveryActions.some(action => action.type === 'retry')).toBe(true);
    });

    it('should detect memory errors', async () => {
      const memoryError = new Error('Out of memory allocation failed');
      const context = {
        operation: 'model-loading',
        timestamp: Date.now()
      };

      const result = await errorHandler.handleError(memoryError, context);
      
      expect(result.recoveryActions.some(action => action.type === 'smaller_model')).toBe(true);
    });

    it('should detect device compatibility errors', async () => {
      const deviceError = new Error('WebGL not supported');
      const context = {
        operation: 'model-loading',
        timestamp: Date.now()
      };

      const result = await errorHandler.handleError(deviceError, context);
      
      expect(result.recoveryActions.some(action => action.type === 'fallback')).toBe(true);
    });
  });

  describe('Recovery Actions', () => {
    it('should generate appropriate recovery actions for network errors', async () => {
      const networkError = new Error('Network timeout');
      const context = {
        operation: 'sentiment-analysis',
        timestamp: Date.now(),
        networkStatus: 'offline' as const
      };

      const result = await errorHandler.handleError(networkError, context);
      
      expect(result.recoveryActions).toContainEqual(
        expect.objectContaining({
          type: 'offline',
          description: expect.stringContaining('offline mode')
        })
      );
    });

    it('should prioritize recovery actions correctly', async () => {
      const memoryError = new Error('Memory allocation failed');
      const context = {
        operation: 'model-loading',
        timestamp: Date.now()
      };

      const result = await errorHandler.handleError(memoryError, context);
      
      // Memory-related actions should have higher priority
      const sortedActions = result.recoveryActions.sort((a, b) => b.priority - a.priority);
      expect(sortedActions[0].type).toBe('smaller_model');
    });
  });

  describe('Error Statistics', () => {
    it('should track error counts', async () => {
      const error = new Error('Test error');
      const context = {
        operation: 'test-operation',
        timestamp: Date.now()
      };

      await errorHandler.handleError(error, context);
      await errorHandler.handleError(error, context);

      const stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBeGreaterThan(0);
    });

    it('should reset error counts', () => {
      errorHandler.resetErrorCounts();
      const stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBe(0);
    });
  });

  describe('Fallback Strategies', () => {
    it('should set and get fallback strategies', () => {
      const strategy = {
        primaryModel: 'test-model',
        fallbackModels: ['fallback-1', 'fallback-2'],
        offlineMode: true,
        cachedResults: true,
        smallerModelFallback: true,
        gracefulDegradation: true
      };

      errorHandler.setFallbackStrategy('test-operation', strategy);
      const retrieved = errorHandler.getFallbackStrategy('test-operation');
      
      expect(retrieved).toEqual(strategy);
    });
  });
});

describe('DeviceCompatibilityChecker', () => {
  beforeEach(() => {
    // Mock browser APIs
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124',
      configurable: true
    });

    Object.defineProperty(navigator, 'hardwareConcurrency', {
      value: 4,
      configurable: true
    });
  });

  it('should check device compatibility', async () => {
    const compatibility = await deviceCompatibility.checkCompatibility();
    
    expect(compatibility).toHaveProperty('isSupported');
    expect(compatibility).toHaveProperty('supportLevel');
    expect(compatibility).toHaveProperty('features');
    expect(compatibility).toHaveProperty('performance');
    expect(compatibility).toHaveProperty('browser');
    expect(compatibility).toHaveProperty('recommendations');
  });

  it('should detect browser features', async () => {
    const compatibility = await deviceCompatibility.checkCompatibility();
    
    expect(compatibility.features).toHaveProperty('webgl');
    expect(compatibility.features).toHaveProperty('webassembly');
    expect(compatibility.features).toHaveProperty('webworkers');
    expect(compatibility.features).toHaveProperty('indexeddb');
    expect(compatibility.features).toHaveProperty('serviceworker');
  });

  it('should assess performance characteristics', async () => {
    const compatibility = await deviceCompatibility.checkCompatibility();
    
    expect(compatibility.performance).toHaveProperty('isLowEnd');
    expect(compatibility.performance).toHaveProperty('memoryEstimate');
    expect(compatibility.performance).toHaveProperty('cpuCores');
    expect(compatibility.performance).toHaveProperty('estimatedSpeed');
  });

  it('should provide recommendations', async () => {
    const compatibility = await deviceCompatibility.checkCompatibility();
    
    expect(compatibility.recommendations).toHaveProperty('device');
    expect(compatibility.recommendations).toHaveProperty('modelSize');
    expect(compatibility.recommendations).toHaveProperty('batchSize');
    expect(compatibility.recommendations).toHaveProperty('warnings');
  });
});

describe('FallbackModelManager', () => {
  it('should analyze sentiment using fallback', async () => {
    const result = await fallbackManager.analyzeSentimentFallback(
      'This is a great product!',
      'Test fallback'
    );

    expect(result).toHaveProperty('label');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('scores');
    expect(result).toHaveProperty('fallbackUsed', true);
    expect(result).toHaveProperty('fallbackReason', 'Test fallback');
  });

  it('should generate recommendations using fallback', async () => {
    const userRatings = [
      { movieId: 1, title: 'Test Movie', rating: 5, genres: ['Action'] }
    ];

    const result = await fallbackManager.generateRecommendationsFallback(
      userRatings,
      5,
      'Test fallback'
    );

    expect(result).toHaveProperty('recommendations');
    expect(result).toHaveProperty('fallbackUsed', true);
    expect(result).toHaveProperty('fallbackReason', 'Test fallback');
    expect(result.recommendations).toBeInstanceOf(Array);
  });

  it('should handle cold start recommendations', async () => {
    const result = await fallbackManager.generateRecommendationsFallback(
      [], // No user ratings
      5,
      'Cold start test'
    );

    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.fallbackUsed).toBe(true);
  });

  it('should cache results', async () => {
    const text = 'Test sentiment';
    
    // First call
    const result1 = await fallbackManager.analyzeSentimentFallback(text, 'Test');
    
    // Second call should use cache
    const result2 = await fallbackManager.analyzeSentimentFallback(text, 'Test');
    
    expect(result1.processingTime).toBeGreaterThan(0);
    expect(result2.processingTime).toBeGreaterThan(0);
  });

  it('should check fallback capabilities', async () => {
    const canUseFallback = await fallbackManager.canUseFallback();
    expect(typeof canUseFallback).toBe('boolean');

    const capabilities = fallbackManager.getFallbackCapabilities();
    expect(capabilities).toHaveProperty('sentiment');
    expect(capabilities).toHaveProperty('recommendation');
    expect(capabilities).toHaveProperty('offline');
    expect(capabilities).toHaveProperty('caching');
  });
});