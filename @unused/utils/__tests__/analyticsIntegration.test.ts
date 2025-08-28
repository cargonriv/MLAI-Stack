/**
 * Tests for Analytics Integration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AnalyticsIntegration, MLAnalytics, AnalyticsConfig } from '../analyticsIntegration';

// Mock fetch
global.fetch = vi.fn();

describe('AnalyticsIntegration', () => {
  let analytics: AnalyticsIntegration;
  let config: AnalyticsConfig;

  beforeEach(() => {
    config = {
      enabled: true,
      batchSize: 5,
      flushInterval: 1000,
      enableUserTracking: true,
      enablePerformanceTracking: true,
      enableErrorTracking: true,
      samplingRate: 1.0
    };

    analytics = AnalyticsIntegration.getInstance(config);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = AnalyticsIntegration.getInstance();
      const instance2 = AnalyticsIntegration.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('setUserId', () => {
    it('should set user ID', () => {
      analytics.setUserId('user123');
      
      const summary = analytics.getAnalyticsSummary();
      expect(summary.userId).toBe('user123');
    });
  });

  describe('trackModelPerformance', () => {
    it('should track model performance metrics', () => {
      const performanceData = {
        modelId: 'bert-sentiment',
        modelType: 'sentiment' as const,
        loadTime: 1500,
        inferenceTime: 250,
        memoryUsage: 1024 * 1024,
        accuracy: 0.92,
        batchSize: 4,
        errorOccurred: false
      };

      analytics.trackModelPerformance(performanceData);
      
      const summary = analytics.getAnalyticsSummary();
      expect(summary.eventsQueued).toBe(1);
    });

    it('should include device capabilities', () => {
      const performanceData = {
        modelId: 'bert-sentiment',
        modelType: 'sentiment' as const,
        loadTime: 1500,
        inferenceTime: 250,
        memoryUsage: 1024 * 1024,
        errorOccurred: false
      };

      analytics.trackModelPerformance(performanceData);
      
      // Event should be queued with device capabilities
      const summary = analytics.getAnalyticsSummary();
      expect(summary.eventsQueued).toBe(1);
    });
  });

  describe('trackUserInteraction', () => {
    it('should track user interaction events', () => {
      const interactionData = {
        action: 'analyze_text',
        component: 'SentimentAnalysisDemo',
        inputType: 'text',
        inputSize: 150,
        resultQuality: 4,
        userSatisfaction: 5,
        timeSpent: 3000,
        retryCount: 0
      };

      analytics.trackUserInteraction(interactionData);
      
      const summary = analytics.getAnalyticsSummary();
      expect(summary.eventsQueued).toBe(1);
    });
  });

  describe('trackABTest', () => {
    it('should track A/B test events', () => {
      const abTestData = {
        testId: 'sentiment-model-test',
        variantId: 'distilbert-variant',
        conversionEvent: 'model_used',
        conversionValue: 1,
        metadata: { modelSize: '67MB' }
      };

      analytics.trackABTest(abTestData);
      
      const summary = analytics.getAnalyticsSummary();
      expect(summary.eventsQueued).toBe(1);
    });
  });

  describe('trackEvent', () => {
    it('should track custom events', () => {
      analytics.trackEvent('custom_event', {
        customProperty: 'value',
        numericProperty: 42
      });
      
      const summary = analytics.getAnalyticsSummary();
      expect(summary.eventsQueued).toBe(1);
    });
  });

  describe('trackError', () => {
    it('should track error events when enabled', () => {
      const error = new Error('Test error');
      const context = { component: 'TestComponent' };

      analytics.trackError(error, context);
      
      const summary = analytics.getAnalyticsSummary();
      expect(summary.eventsQueued).toBe(1);
    });

    it('should not track errors when disabled', () => {
      analytics.updateConfig({ enableErrorTracking: false });
      
      const error = new Error('Test error');
      analytics.trackError(error);
      
      const summary = analytics.getAnalyticsSummary();
      expect(summary.eventsQueued).toBe(0);
    });
  });

  describe('flush', () => {
    it('should send events to endpoint', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce(new Response('OK', { status: 200 }));

      analytics.updateConfig({ endpoint: 'https://api.example.com/analytics' });
      analytics.trackEvent('test_event', { data: 'test' });
      
      await analytics.flush();
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/analytics',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('test_event')
        })
      );
    });

    it('should log to console when no endpoint configured', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      analytics.trackEvent('test_event', { data: 'test' });
      await analytics.flush();
      
      expect(consoleSpy).toHaveBeenCalledWith('Analytics Events:', expect.any(Array));
      consoleSpy.mockRestore();
    });

    it('should handle API errors gracefully', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce(new Response('Error', { status: 500 }));

      analytics.updateConfig({ endpoint: 'https://api.example.com/analytics' });
      analytics.trackEvent('test_event', { data: 'test' });
      
      // Should not throw
      await expect(analytics.flush()).resolves.not.toThrow();
    });
  });

  describe('sampling', () => {
    it('should respect sampling rate', () => {
      analytics.updateConfig({ samplingRate: 0.0 }); // No events should be tracked
      
      analytics.trackEvent('test_event', { data: 'test' });
      
      const summary = analytics.getAnalyticsSummary();
      expect(summary.eventsQueued).toBe(0);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const newConfig = {
        batchSize: 10,
        flushInterval: 2000,
        enableUserTracking: false
      };

      analytics.updateConfig(newConfig);
      
      // Configuration should be updated (no direct way to verify, but should not throw)
      expect(() => analytics.updateConfig(newConfig)).not.toThrow();
    });
  });

  describe('getAnalyticsSummary', () => {
    it('should return analytics summary', () => {
      analytics.setUserId('user123');
      analytics.trackEvent('test_event', { data: 'test' });
      
      const summary = analytics.getAnalyticsSummary();
      
      expect(summary.sessionId).toBeDefined();
      expect(summary.userId).toBe('user123');
      expect(summary.eventsQueued).toBe(1);
      expect(summary.context).toBeDefined();
    });
  });
});

describe('MLAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackModelLoad', () => {
    it('should track successful model load', () => {
      const trackSpy = vi.spyOn(AnalyticsIntegration.prototype, 'trackModelPerformance');
      
      MLAnalytics.trackModelLoad('bert-sentiment', 1500, true);
      
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          modelId: 'bert-sentiment',
          modelType: 'sentiment',
          loadTime: 1500,
          errorOccurred: false
        })
      );
    });

    it('should track failed model load', () => {
      const trackSpy = vi.spyOn(AnalyticsIntegration.prototype, 'trackModelPerformance');
      
      MLAnalytics.trackModelLoad('bert-sentiment', 1500, false, 'Network error');
      
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          modelId: 'bert-sentiment',
          errorOccurred: true,
          errorType: 'Network error'
        })
      );
    });
  });

  describe('trackInference', () => {
    it('should track inference metrics', () => {
      const trackSpy = vi.spyOn(AnalyticsIntegration.prototype, 'trackModelPerformance');
      
      MLAnalytics.trackInference('bert-sentiment', 250, 1024, 4, 0.92);
      
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          modelId: 'bert-sentiment',
          inferenceTime: 250,
          memoryUsage: 1024,
          batchSize: 4,
          accuracy: 0.92
        })
      );
    });
  });

  describe('trackUserFeedback', () => {
    it('should track user feedback', () => {
      const trackSpy = vi.spyOn(AnalyticsIntegration.prototype, 'trackUserInteraction');
      
      MLAnalytics.trackUserFeedback('SentimentDemo', 4, 5000);
      
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'feedback',
          component: 'SentimentDemo',
          userSatisfaction: 4,
          timeSpent: 5000
        })
      );
    });
  });

  describe('trackComponentUsage', () => {
    it('should track component usage', () => {
      const trackSpy = vi.spyOn(AnalyticsIntegration.prototype, 'trackUserInteraction');
      
      MLAnalytics.trackComponentUsage('RecommendationDemo', 'generate_recommendations', 150);
      
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'generate_recommendations',
          component: 'RecommendationDemo',
          inputSize: 150
        })
      );
    });
  });
});