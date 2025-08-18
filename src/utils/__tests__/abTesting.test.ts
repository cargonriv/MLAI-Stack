/**
 * Tests for A/B Testing Framework
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ABTestingFramework, ABTestConfig, ABTestVariant } from '../abTesting';

describe('ABTestingFramework', () => {
  let framework: ABTestingFramework;
  let testConfig: ABTestConfig;

  beforeEach(() => {
    framework = ABTestingFramework.getInstance();
    
    testConfig = {
      testId: 'test-sentiment-models',
      name: 'Sentiment Model Comparison',
      description: 'Compare BERT vs DistilBERT',
      variants: [
        {
          id: 'control-bert',
          name: 'BERT Base',
          description: 'Full BERT model',
          modelConfig: { model: 'bert-base' },
          isControl: true
        },
        {
          id: 'variant-distilbert',
          name: 'DistilBERT',
          description: 'Lightweight DistilBERT',
          modelConfig: { model: 'distilbert' },
          isControl: false
        }
      ],
      trafficSplit: [50, 50],
      startDate: new Date(),
      targetMetrics: ['accuracy', 'latency'],
      minimumSampleSize: 100,
      confidenceLevel: 0.95
    };
  });

  describe('createTest', () => {
    it('should create a valid A/B test', () => {
      expect(() => framework.createTest(testConfig)).not.toThrow();
    });

    it('should validate test configuration', () => {
      const invalidConfig = {
        ...testConfig,
        variants: [testConfig.variants[0]] // Only one variant
      };

      expect(() => framework.createTest(invalidConfig)).toThrow('A/B test must have at least 2 variants');
    });

    it('should validate traffic split', () => {
      const invalidConfig = {
        ...testConfig,
        trafficSplit: [60, 60] // Sums to 120%
      };

      expect(() => framework.createTest(invalidConfig)).toThrow('Traffic split must sum to 100%');
    });

    it('should validate control variant', () => {
      const invalidConfig = {
        ...testConfig,
        variants: testConfig.variants.map(v => ({ ...v, isControl: false })) // No control
      };

      expect(() => framework.createTest(invalidConfig)).toThrow('Exactly one variant must be marked as control');
    });
  });

  describe('getVariantForUser', () => {
    beforeEach(() => {
      framework.createTest(testConfig);
    });

    it('should assign user to variant', () => {
      const variant = framework.getVariantForUser(testConfig.testId, 'user123');
      
      expect(variant).toBeDefined();
      expect(['control-bert', 'variant-distilbert']).toContain(variant);
    });

    it('should return consistent assignment for same user', () => {
      const variant1 = framework.getVariantForUser(testConfig.testId, 'user123');
      const variant2 = framework.getVariantForUser(testConfig.testId, 'user123');
      
      expect(variant1).toBe(variant2);
    });

    it('should return null for non-existent test', () => {
      const variant = framework.getVariantForUser('non-existent-test', 'user123');
      expect(variant).toBeNull();
    });

    it('should return null for expired test', () => {
      const expiredConfig = {
        ...testConfig,
        testId: 'expired-test',
        startDate: new Date(Date.now() - 1000),
        endDate: new Date(Date.now() - 500)
      };

      framework.createTest(expiredConfig);
      const variant = framework.getVariantForUser('expired-test', 'user123');
      
      expect(variant).toBeNull();
    });
  });

  describe('recordResult', () => {
    beforeEach(() => {
      framework.createTest(testConfig);
    });

    it('should record test result', () => {
      const userId = 'user123';
      const variant = framework.getVariantForUser(testConfig.testId, userId);
      
      expect(() => {
        framework.recordResult(testConfig.testId, userId, {
          accuracy: 0.85,
          latency: 120
        });
      }).not.toThrow();
    });

    it('should ignore results for non-existent test', () => {
      expect(() => {
        framework.recordResult('non-existent', 'user123', { accuracy: 0.85 });
      }).not.toThrow();
    });
  });

  describe('analyzeTest', () => {
    beforeEach(() => {
      framework.createTest(testConfig);
      
      // Generate sample data
      for (let i = 0; i < 50; i++) {
        const userId = `user${i}`;
        const variant = framework.getVariantForUser(testConfig.testId, userId);
        
        if (variant) {
          // Simulate different performance for variants
          const baseAccuracy = variant === 'control-bert' ? 0.85 : 0.82;
          const baseLatency = variant === 'control-bert' ? 150 : 100;
          
          framework.recordResult(testConfig.testId, userId, {
            accuracy: baseAccuracy + (Math.random() - 0.5) * 0.1,
            latency: baseLatency + (Math.random() - 0.5) * 50
          });
        }
      }
    });

    it('should analyze test results', () => {
      const analysis = framework.analyzeTest(testConfig.testId);
      
      expect(analysis).toBeDefined();
      expect(analysis!.testId).toBe(testConfig.testId);
      expect(analysis!.variantResults).toHaveLength(2);
      expect(analysis!.totalSamples).toBeGreaterThan(0);
    });

    it('should calculate variant statistics', () => {
      const analysis = framework.analyzeTest(testConfig.testId);
      
      for (const variantResult of analysis!.variantResults) {
        expect(variantResult.sampleSize).toBeGreaterThan(0);
        expect(variantResult.metrics.accuracy).toBeDefined();
        expect(variantResult.metrics.latency).toBeDefined();
        expect(variantResult.confidenceInterval.accuracy).toBeDefined();
      }
    });

    it('should determine winner', () => {
      const analysis = framework.analyzeTest(testConfig.testId);
      
      if (analysis!.statisticalSignificance) {
        expect(analysis!.winner).toBeDefined();
        expect(['control-bert', 'variant-distilbert']).toContain(analysis!.winner);
      }
    });

    it('should provide recommendations', () => {
      const analysis = framework.analyzeTest(testConfig.testId);
      
      expect(analysis!.recommendations).toBeDefined();
      expect(Array.isArray(analysis!.recommendations)).toBe(true);
    });

    it('should return null for non-existent test', () => {
      const analysis = framework.analyzeTest('non-existent');
      expect(analysis).toBeNull();
    });
  });

  describe('stopTest', () => {
    beforeEach(() => {
      framework.createTest(testConfig);
    });

    it('should stop running test', () => {
      framework.stopTest(testConfig.testId);
      
      const config = framework.getTestConfig(testConfig.testId);
      expect(config!.endDate).toBeDefined();
    });
  });

  describe('getActiveTests', () => {
    it('should return active tests only', () => {
      framework.createTest(testConfig);
      
      const expiredConfig = {
        ...testConfig,
        testId: 'expired-test',
        startDate: new Date(Date.now() - 1000),
        endDate: new Date(Date.now() - 500)
      };
      framework.createTest(expiredConfig);

      const activeTests = framework.getActiveTests();
      
      expect(activeTests).toHaveLength(1);
      expect(activeTests[0].testId).toBe(testConfig.testId);
    });
  });

  describe('getTestConfig', () => {
    beforeEach(() => {
      framework.createTest(testConfig);
    });

    it('should return test configuration', () => {
      const config = framework.getTestConfig(testConfig.testId);
      
      expect(config).toBeDefined();
      expect(config!.testId).toBe(testConfig.testId);
      expect(config!.name).toBe(testConfig.name);
    });

    it('should return null for non-existent test', () => {
      const config = framework.getTestConfig('non-existent');
      expect(config).toBeNull();
    });
  });
});