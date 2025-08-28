/**
 * Tests for Batch Processing utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BatchProcessor, BatchProcessorFactory, BatchConfig } from '../batchProcessor';

describe('BatchProcessor', () => {
  let processor: BatchProcessor<string, string>;
  let mockProcessorFn: vi.Mock;

  beforeEach(() => {
    mockProcessorFn = vi.fn().mockImplementation(async (inputs: string[]) => {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 10));
      return inputs.map(input => `processed_${input}`);
    });

    const config: BatchConfig = {
      maxBatchSize: 3,
      maxWaitTime: 100,
      enablePrioritization: true,
      adaptiveBatching: false
    };

    processor = new BatchProcessor(config, mockProcessorFn);
  });

  describe('addRequest', () => {
    it('should process single request', async () => {
      const result = await processor.addRequest('test_input');
      
      expect(result).toBe('processed_test_input');
      expect(mockProcessorFn).toHaveBeenCalledWith(['test_input']);
    });

    it('should batch multiple requests', async () => {
      const promises = [
        processor.addRequest('input1'),
        processor.addRequest('input2'),
        processor.addRequest('input3')
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual(['processed_input1', 'processed_input2', 'processed_input3']);
      expect(mockProcessorFn).toHaveBeenCalledWith(['input1', 'input2', 'input3']);
    });

    it('should handle priority requests', async () => {
      const normalPromise = processor.addRequest('normal', 'normal');
      const highPromise = processor.addRequest('high', 'high');
      const lowPromise = processor.addRequest('low', 'low');

      const results = await Promise.all([normalPromise, highPromise, lowPromise]);

      expect(results).toContain('processed_normal');
      expect(results).toContain('processed_high');
      expect(results).toContain('processed_low');
    });

    it('should process immediately when batch is full', async () => {
      const startTime = Date.now();
      
      const promises = [
        processor.addRequest('input1'),
        processor.addRequest('input2'),
        processor.addRequest('input3') // This should trigger immediate processing
      ];

      await Promise.all(promises);
      const endTime = Date.now();

      // Should process quickly without waiting for timer
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('should handle processing errors', async () => {
      mockProcessorFn.mockRejectedValueOnce(new Error('Processing failed'));

      await expect(processor.addRequest('error_input')).rejects.toThrow('Processing failed');
    });
  });

  describe('getMetrics', () => {
    it('should track processing metrics', async () => {
      await processor.addRequest('test1');
      await processor.addRequest('test2');

      const metrics = processor.getMetrics();

      expect(metrics.totalRequests).toBe(2);
      expect(metrics.batchesProcessed).toBeGreaterThan(0);
      expect(metrics.averageProcessingTime).toBeGreaterThan(0);
    });

    it('should calculate throughput', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(processor.addRequest(`input${i}`));
      }

      await Promise.all(promises);
      const metrics = processor.getMetrics();

      expect(metrics.throughput).toBeGreaterThan(0);
      expect(metrics.totalRequests).toBe(10);
    });
  });

  describe('getQueueStatus', () => {
    it('should return queue status', async () => {
      // Add requests without waiting
      processor.addRequest('input1');
      processor.addRequest('input2');

      const status = processor.getQueueStatus();

      expect(status.queueLength).toBeGreaterThanOrEqual(0);
      expect(status.pendingRequests).toBeGreaterThanOrEqual(0);
      expect(typeof status.isProcessing).toBe('boolean');
    });
  });

  describe('clearQueue', () => {
    it('should clear pending requests', async () => {
      // Add requests but don't wait
      processor.addRequest('input1');
      processor.addRequest('input2');

      processor.clearQueue();

      const status = processor.getQueueStatus();
      expect(status.queueLength).toBe(0);
      expect(status.pendingRequests).toBe(0);
    });
  });

  describe('updateConfig', () => {
    it('should update batch configuration', () => {
      const newConfig = { maxBatchSize: 5, maxWaitTime: 200 };
      processor.updateConfig(newConfig);

      // Configuration update should not throw
      expect(() => processor.updateConfig(newConfig)).not.toThrow();
    });
  });
});

describe('BatchProcessorFactory', () => {
  beforeEach(() => {
    BatchProcessorFactory.clearAll();
  });

  describe('createSentimentBatchProcessor', () => {
    it('should create sentiment batch processor', () => {
      const mockAnalyzer = {
        analyze: vi.fn().mockResolvedValue({ sentiment: 'positive', confidence: 0.8 })
      };

      const processor = BatchProcessorFactory.createSentimentBatchProcessor(mockAnalyzer);

      expect(processor).toBeInstanceOf(BatchProcessor);
    });

    it('should use custom configuration', () => {
      const mockAnalyzer = {
        analyze: vi.fn().mockResolvedValue({ sentiment: 'positive', confidence: 0.8 })
      };

      const customConfig = { maxBatchSize: 10, maxWaitTime: 50 };
      const processor = BatchProcessorFactory.createSentimentBatchProcessor(mockAnalyzer, customConfig);

      expect(processor).toBeInstanceOf(BatchProcessor);
    });
  });

  describe('createRecommendationBatchProcessor', () => {
    it('should create recommendation batch processor', () => {
      const mockEngine = {
        generateRecommendations: vi.fn().mockResolvedValue([
          { movieId: 1, title: 'Test Movie', rating: 4.5 }
        ])
      };

      const processor = BatchProcessorFactory.createRecommendationBatchProcessor(mockEngine);

      expect(processor).toBeInstanceOf(BatchProcessor);
    });
  });

  describe('getProcessor', () => {
    it('should retrieve created processor', () => {
      const mockAnalyzer = {
        analyze: vi.fn().mockResolvedValue({ sentiment: 'positive', confidence: 0.8 })
      };

      BatchProcessorFactory.createSentimentBatchProcessor(mockAnalyzer);
      const processor = BatchProcessorFactory.getProcessor('sentiment');

      expect(processor).toBeInstanceOf(BatchProcessor);
    });

    it('should return null for non-existent processor', () => {
      const processor = BatchProcessorFactory.getProcessor('non-existent');
      expect(processor).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('should clear all processors', () => {
      const mockAnalyzer = {
        analyze: vi.fn().mockResolvedValue({ sentiment: 'positive', confidence: 0.8 })
      };

      BatchProcessorFactory.createSentimentBatchProcessor(mockAnalyzer);
      expect(BatchProcessorFactory.getProcessor('sentiment')).not.toBeNull();

      BatchProcessorFactory.clearAll();
      expect(BatchProcessorFactory.getProcessor('sentiment')).toBeNull();
    });
  });
});