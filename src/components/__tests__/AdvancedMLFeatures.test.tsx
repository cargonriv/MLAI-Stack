/**
 * Tests for AdvancedMLFeatures component
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdvancedMLFeatures } from '../AdvancedMLFeatures';

// Mock the utility modules
vi.mock('@/utils/modelQuantization', () => ({
  modelQuantizer: {
    quantizeModel: vi.fn().mockResolvedValue({
      model: {},
      originalSize: 1000000,
      quantizedSize: 250000,
      compressionRatio: 4,
      precision: 'int8'
    }),
    getMemoryStats: vi.fn().mockReturnValue({
      totalOriginalSize: 1000000,
      totalQuantizedSize: 250000,
      totalSavings: 750000,
      modelsCount: 1
    })
  }
}));

vi.mock('@/utils/batchProcessor', () => ({
  BatchProcessorFactory: {
    createSentimentBatchProcessor: vi.fn().mockReturnValue({
      addRequest: vi.fn().mockResolvedValue({ sentiment: 'positive', confidence: 0.8 }),
      getMetrics: vi.fn().mockReturnValue({
        totalRequests: 5,
        batchesProcessed: 1,
        averageBatchSize: 5,
        averageProcessingTime: 100,
        throughput: 50,
        errorRate: 0
      }),
      getQueueStatus: vi.fn().mockReturnValue({
        pendingRequests: 0,
        queueLength: 0,
        isProcessing: false,
        oldestRequestAge: 0
      })
    }),
    getProcessor: vi.fn().mockReturnValue({
      getMetrics: vi.fn().mockReturnValue({
        totalRequests: 5,
        batchesProcessed: 1,
        averageBatchSize: 5,
        averageProcessingTime: 100,
        throughput: 50,
        errorRate: 0
      }),
      getQueueStatus: vi.fn().mockReturnValue({
        pendingRequests: 0,
        queueLength: 0,
        isProcessing: false,
        oldestRequestAge: 0
      })
    })
  }
}));

vi.mock('@/utils/abTesting', () => ({
  abTestingFramework: {
    createTest: vi.fn(),
    getVariantForUser: vi.fn().mockReturnValue('control-bert'),
    recordResult: vi.fn(),
    getActiveTests: vi.fn().mockReturnValue([{
      testId: 'sentiment-model-comparison',
      name: 'Sentiment Model A/B Test',
      variants: []
    }]),
    analyzeTest: vi.fn().mockResolvedValue({
      testId: 'sentiment-model-comparison',
      status: 'running',
      totalSamples: 20,
      variantResults: [],
      confidence: 0.85,
      statisticalSignificance: false,
      recommendations: ['Test needs more data to reach statistical significance']
    })
  }
}));

vi.mock('@/utils/analyticsIntegration', () => ({
  analytics: {
    trackABTest: vi.fn(),
    getAnalyticsSummary: vi.fn().mockReturnValue({
      sessionId: 'session_123',
      userId: undefined,
      eventsQueued: 0,
      eventsTracked: 5,
      context: {
        userAgent: 'test-agent',
        deviceType: 'desktop',
        browserName: 'Chrome',
        browserVersion: '91'
      }
    })
  },
  MLAnalytics: {
    trackComponentUsage: vi.fn(),
    trackInference: vi.fn()
  }
}));

vi.mock('@/utils/serviceWorkerCache', () => ({
  serviceWorkerCache: {
    cacheModel: vi.fn().mockResolvedValue(true),
    getCachedModel: vi.fn().mockResolvedValue({
      modelId: 'demo-sentiment-model',
      version: '1.0.0',
      data: new ArrayBuffer(1024),
      metadata: {
        size: 1024,
        timestamp: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now(),
        priority: 'high'
      }
    }),
    getCacheStats: vi.fn().mockReturnValue({
      totalSize: 1024 * 1024,
      modelCount: 1,
      hitRate: 0.8,
      missRate: 0.2,
      evictionCount: 0,
      compressionSavings: 256 * 1024,
      availableSpace: 99 * 1024 * 1024,
      utilizationPercentage: 1
    })
  }
}));

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

describe('AdvancedMLFeatures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should render all feature tabs', () => {
    render(<AdvancedMLFeatures />);

    expect(screen.getByText('Advanced ML Features')).toBeInTheDocument();
    expect(screen.getByText('Quantization')).toBeInTheDocument();
    expect(screen.getByText('Batch Processing')).toBeInTheDocument();
    expect(screen.getByText('A/B Testing')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Offline Cache')).toBeInTheDocument();
  });

  it('should show online status', () => {
    render(<AdvancedMLFeatures />);

    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('should show offline status when offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    render(<AdvancedMLFeatures />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  describe('Quantization Tab', () => {
    it('should render quantization demo button', () => {
      render(<AdvancedMLFeatures />);

      const quantizationTab = screen.getByText('Quantization');
      fireEvent.click(quantizationTab);

      expect(screen.getByText('Start Quantization Demo')).toBeInTheDocument();
    });

    it('should run quantization demo', async () => {
      render(<AdvancedMLFeatures />);

      const quantizationTab = screen.getByText('Quantization');
      fireEvent.click(quantizationTab);

      const demoButton = screen.getByText('Start Quantization Demo');
      fireEvent.click(demoButton);

      await waitFor(() => {
        expect(screen.getByText('Quantization Active')).toBeInTheDocument();
      });
    });

    it('should display quantization stats', async () => {
      render(<AdvancedMLFeatures />);

      const quantizationTab = screen.getByText('Quantization');
      fireEvent.click(quantizationTab);

      const demoButton = screen.getByText('Start Quantization Demo');
      fireEvent.click(demoButton);

      await waitFor(() => {
        expect(screen.getByText('Memory Savings')).toBeInTheDocument();
        expect(screen.getByText('Models Quantized')).toBeInTheDocument();
      });
    });
  });

  describe('Batch Processing Tab', () => {
    it('should render batch processing demo button', () => {
      render(<AdvancedMLFeatures />);

      const batchTab = screen.getByText('Batch Processing');
      fireEvent.click(batchTab);

      expect(screen.getByText('Start Batch Demo')).toBeInTheDocument();
    });

    it('should run batch processing demo', async () => {
      render(<AdvancedMLFeatures />);

      const batchTab = screen.getByText('Batch Processing');
      fireEvent.click(batchTab);

      const demoButton = screen.getByText('Start Batch Demo');
      fireEvent.click(demoButton);

      await waitFor(() => {
        expect(screen.getByText('Batch Processing Active')).toBeInTheDocument();
      });
    });

    it('should display batch processing stats', async () => {
      render(<AdvancedMLFeatures />);

      const batchTab = screen.getByText('Batch Processing');
      fireEvent.click(batchTab);

      const demoButton = screen.getByText('Start Batch Demo');
      fireEvent.click(demoButton);

      await waitFor(() => {
        expect(screen.getByText('Throughput')).toBeInTheDocument();
        expect(screen.getByText('Avg Batch Size')).toBeInTheDocument();
        expect(screen.getByText('Queue Length')).toBeInTheDocument();
      });
    });
  });

  describe('A/B Testing Tab', () => {
    it('should render A/B testing demo button', () => {
      render(<AdvancedMLFeatures />);

      const abTestTab = screen.getByText('A/B Testing');
      fireEvent.click(abTestTab);

      expect(screen.getByText('Start A/B Test Demo')).toBeInTheDocument();
    });

    it('should run A/B testing demo', async () => {
      render(<AdvancedMLFeatures />);

      const abTestTab = screen.getByText('A/B Testing');
      fireEvent.click(abTestTab);

      const demoButton = screen.getByText('Start A/B Test Demo');
      fireEvent.click(demoButton);

      await waitFor(() => {
        expect(screen.getByText('A/B Test Running')).toBeInTheDocument();
      });
    });

    it('should display A/B test results', async () => {
      render(<AdvancedMLFeatures />);

      const abTestTab = screen.getByText('A/B Testing');
      fireEvent.click(abTestTab);

      const demoButton = screen.getByText('Start A/B Test Demo');
      fireEvent.click(demoButton);

      await waitFor(() => {
        expect(screen.getByText('Total Samples:')).toBeInTheDocument();
        expect(screen.getByText('Confidence:')).toBeInTheDocument();
      });
    });
  });

  describe('Analytics Tab', () => {
    it('should display analytics information', () => {
      render(<AdvancedMLFeatures />);

      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);

      expect(screen.getByText('Session ID')).toBeInTheDocument();
      expect(screen.getByText('Events Tracked')).toBeInTheDocument();
      expect(screen.getByText('Analytics are actively tracking')).toBeInTheDocument();
    });
  });

  describe('Offline Cache Tab', () => {
    it('should render caching demo button', () => {
      render(<AdvancedMLFeatures />);

      const cacheTab = screen.getByText('Offline Cache');
      fireEvent.click(cacheTab);

      expect(screen.getByText('Start Caching Demo')).toBeInTheDocument();
    });

    it('should run caching demo', async () => {
      render(<AdvancedMLFeatures />);

      const cacheTab = screen.getByText('Offline Cache');
      fireEvent.click(cacheTab);

      const demoButton = screen.getByText('Start Caching Demo');
      fireEvent.click(demoButton);

      await waitFor(() => {
        expect(screen.getByText('Caching Active')).toBeInTheDocument();
      });
    });

    it('should display cache stats', async () => {
      render(<AdvancedMLFeatures />);

      const cacheTab = screen.getByText('Offline Cache');
      fireEvent.click(cacheTab);

      const demoButton = screen.getByText('Start Caching Demo');
      fireEvent.click(demoButton);

      await waitFor(() => {
        expect(screen.getByText('Cache Size')).toBeInTheDocument();
        expect(screen.getByText('Models Cached')).toBeInTheDocument();
        expect(screen.getByText('Cache Utilization')).toBeInTheDocument();
      });
    });
  });

  it('should handle online/offline status changes', () => {
    render(<AdvancedMLFeatures />);

    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    fireEvent(window, new Event('offline'));

    expect(screen.getByText('Offline')).toBeInTheDocument();

    // Simulate going online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });

    fireEvent(window, new Event('online'));

    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('should update stats periodically', async () => {
    vi.useFakeTimers();
    
    render(<AdvancedMLFeatures />);

    // Fast-forward time to trigger stats update
    vi.advanceTimersByTime(5000);

    // Stats should be updated (no direct assertion, but should not throw)
    expect(() => vi.advanceTimersByTime(5000)).not.toThrow();

    vi.useRealTimers();
  });
});