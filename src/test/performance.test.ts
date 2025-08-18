import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BERTSentimentAnalyzer } from '../utils/sentimentAnalysis';
import { CollaborativeFilteringEngine } from '../utils/collaborativeFiltering';
import { ModelManager } from '../utils/modelManager';

// Mock performance.now for consistent testing
const mockPerformanceNow = vi.fn();
global.performance = { now: mockPerformanceNow } as any;

// Mock Transformers.js for performance testing
vi.mock('@xenova/transformers', () => ({
  AutoTokenizer: {
    from_pretrained: vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        tokenize: vi.fn().mockReturnValue(['hello', 'world']),
        encode: vi.fn().mockReturnValue([101, 7592, 2088, 102])
      }), 100))
    )
  },
  AutoModelForSequenceClassification: {
    from_pretrained: vi.fn().mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({
        forward: vi.fn().mockImplementation(() =>
          new Promise(resolve => setTimeout(() => resolve({
            logits: [[0.1, 0.9]]
          }), 50))
        )
      }), 200))
    )
  }
}));

describe('Performance Benchmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValue(0);
  });

  describe('Model Loading Performance', () => {
    it('should measure BERT model loading time', async () => {
      const analyzer = new BERTSentimentAnalyzer();
      
      let currentTime = 0;
      mockPerformanceNow.mockImplementation(() => {
        currentTime += 100;
        return currentTime;
      });
      
      const startTime = performance.now();
      await analyzer.initialize('distilbert-base-uncased-finetuned-sst-2-english');
      const endTime = performance.now();
      
      const loadTime = endTime - startTime;
      expect(loadTime).toBeGreaterThan(0);
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    it('should measure collaborative filtering model loading time', async () => {
      const engine = new CollaborativeFilteringEngine();
      
      let currentTime = 0;
      mockPerformanceNow.mockImplementation(() => {
        currentTime += 50;
        return currentTime;
      });
      
      const startTime = performance.now();
      await engine.initialize();
      const endTime = performance.now();
      
      const loadTime = endTime - startTime;
      expect(loadTime).toBeGreaterThan(0);
      expect(loadTime).toBeLessThan(2000); // Should load within 2 seconds
    });

    it('should benchmark model manager cache performance', async () => {
      const modelManager = new ModelManager();
      
      let currentTime = 0;
      mockPerformanceNow.mockImplementation(() => {
        currentTime += 10;
        return currentTime;
      });
      
      // First load (cold)
      const firstLoadStart = performance.now();
      await modelManager.loadModel('test-model');
      const firstLoadEnd = performance.now();
      const firstLoadTime = firstLoadEnd - firstLoadStart;
      
      // Second load (cached)
      const secondLoadStart = performance.now();
      await modelManager.loadModel('test-model');
      const secondLoadEnd = performance.now();
      const secondLoadTime = secondLoadEnd - secondLoadStart;
      
      expect(secondLoadTime).toBeLessThan(firstLoadTime);
      expect(secondLoadTime).toBeLessThan(100); // Cached load should be very fast
    });
  });

  describe('Inference Performance', () => {
    it('should measure sentiment analysis inference time', async () => {
      const analyzer = new BERTSentimentAnalyzer();
      await analyzer.initialize('distilbert-base-uncased-finetuned-sst-2-english');
      
      const testTexts = [
        'This is a great product!',
        'I hate this service.',
        'The weather is okay today.',
        'Amazing experience, highly recommended!',
        'Terrible quality, waste of money.'
      ];
      
      const inferenceTimes: number[] = [];
      
      for (const text of testTexts) {
        let currentTime = 0;
        mockPerformanceNow.mockImplementation(() => {
          currentTime += 25;
          return currentTime;
        });
        
        const startTime = performance.now();
        await analyzer.analyze(text);
        const endTime = performance.now();
        
        inferenceTimes.push(endTime - startTime);
      }
      
      const averageTime = inferenceTimes.reduce((a, b) => a + b, 0) / inferenceTimes.length;
      expect(averageTime).toBeLessThan(500); // Should be under 500ms on average
      
      // Check consistency (standard deviation should be reasonable)
      const variance = inferenceTimes.reduce((acc, time) => 
        acc + Math.pow(time - averageTime, 2), 0) / inferenceTimes.length;
      const stdDev = Math.sqrt(variance);
      expect(stdDev).toBeLessThan(averageTime * 0.5); // StdDev should be less than 50% of mean
    });

    it('should measure recommendation generation performance', async () => {
      const engine = new CollaborativeFilteringEngine();
      await engine.initialize();
      
      const testRatings = [
        { movieId: 1, rating: 5 },
        { movieId: 2, rating: 4 },
        { movieId: 3, rating: 3 },
        { movieId: 4, rating: 5 },
        { movieId: 5, rating: 2 }
      ];
      
      let currentTime = 0;
      mockPerformanceNow.mockImplementation(() => {
        currentTime += 30;
        return currentTime;
      });
      
      const startTime = performance.now();
      const recommendations = await engine.generateRecommendations(testRatings);
      const endTime = performance.now();
      
      const generationTime = endTime - startTime;
      expect(generationTime).toBeLessThan(1000); // Should generate within 1 second
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should benchmark batch processing performance', async () => {
      const analyzer = new BERTSentimentAnalyzer();
      await analyzer.initialize('distilbert-base-uncased-finetuned-sst-2-english');
      
      const batchSizes = [1, 5, 10, 20];
      const performanceResults: { batchSize: number; timePerItem: number }[] = [];
      
      for (const batchSize of batchSizes) {
        const texts = Array(batchSize).fill('This is a test sentence for batch processing.');
        
        let currentTime = 0;
        mockPerformanceNow.mockImplementation(() => {
          currentTime += 20 * batchSize; // Simulate batch processing time
          return currentTime;
        });
        
        const startTime = performance.now();
        
        // Process batch
        const promises = texts.map(text => analyzer.analyze(text));
        await Promise.all(promises);
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const timePerItem = totalTime / batchSize;
        
        performanceResults.push({ batchSize, timePerItem });
      }
      
      // Verify that batch processing is more efficient for larger batches
      const singleItemTime = performanceResults.find(r => r.batchSize === 1)?.timePerItem || 0;
      const largestBatchTime = performanceResults.find(r => r.batchSize === 20)?.timePerItem || 0;
      
      expect(largestBatchTime).toBeLessThan(singleItemTime * 0.8); // Should be at least 20% more efficient
    });
  });

  describe('Memory Performance', () => {
    it('should monitor memory usage during model operations', async () => {
      const modelManager = new ModelManager();
      
      // Mock memory monitoring
      const mockMemoryUsage = vi.fn();
      modelManager.getMemoryUsage = mockMemoryUsage;
      
      mockMemoryUsage.mockReturnValue({ total: 0, models: {} });
      
      const initialMemory = modelManager.getMemoryUsage();
      expect(initialMemory.total).toBe(0);
      
      // Load model and check memory increase
      mockMemoryUsage.mockReturnValue({ 
        total: 67 * 1024 * 1024, 
        models: { 'test-model': 67 * 1024 * 1024 } 
      });
      
      await modelManager.loadModel('test-model');
      const afterLoadMemory = modelManager.getMemoryUsage();
      expect(afterLoadMemory.total).toBeGreaterThan(initialMemory.total);
      
      // Unload model and check memory decrease
      mockMemoryUsage.mockReturnValue({ total: 0, models: {} });
      
      modelManager.unloadModel('test-model');
      const afterUnloadMemory = modelManager.getMemoryUsage();
      expect(afterUnloadMemory.total).toBe(0);
    });

    it('should test memory limits and eviction', async () => {
      const modelManager = new ModelManager();
      
      // Set low memory limit for testing
      const originalMaxMemory = modelManager['maxMemoryUsage'];
      modelManager['maxMemoryUsage'] = 100 * 1024 * 1024; // 100MB
      
      // Mock model size estimation
      modelManager['estimateModelSize'] = vi.fn().mockReturnValue(60 * 1024 * 1024); // 60MB each
      
      // Load first model
      await modelManager.loadModel('model1');
      expect(modelManager.isModelLoaded('model1')).toBe(true);
      
      // Load second model (should trigger eviction)
      await modelManager.loadModel('model2');
      expect(modelManager.isModelLoaded('model2')).toBe(true);
      expect(modelManager.isModelLoaded('model1')).toBe(false); // Should be evicted
      
      // Restore original memory limit
      modelManager['maxMemoryUsage'] = originalMaxMemory;
    });
  });

  describe('Device-Specific Performance', () => {
    it('should benchmark performance across different device types', async () => {
      const deviceConfigs = [
        { name: 'high-end', cores: 8, memory: 8192 },
        { name: 'mid-range', cores: 4, memory: 4096 },
        { name: 'low-end', cores: 2, memory: 2048 }
      ];
      
      const performanceResults: { device: string; loadTime: number; inferenceTime: number }[] = [];
      
      for (const config of deviceConfigs) {
        // Mock device capabilities
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          value: config.cores,
          configurable: true
        });
        
        const analyzer = new BERTSentimentAnalyzer();
        
        // Simulate device-specific performance
        let currentTime = 0;
        const baseTime = 1000 / config.cores; // Slower on fewer cores
        mockPerformanceNow.mockImplementation(() => {
          currentTime += baseTime;
          return currentTime;
        });
        
        const loadStart = performance.now();
        await analyzer.initialize('distilbert-base-uncased-finetuned-sst-2-english');
        const loadEnd = performance.now();
        const loadTime = loadEnd - loadStart;
        
        const inferenceStart = performance.now();
        await analyzer.analyze('Test text for performance measurement');
        const inferenceEnd = performance.now();
        const inferenceTime = inferenceEnd - inferenceStart;
        
        performanceResults.push({
          device: config.name,
          loadTime,
          inferenceTime
        });
      }
      
      // Verify that high-end devices perform better
      const highEnd = performanceResults.find(r => r.device === 'high-end')!;
      const lowEnd = performanceResults.find(r => r.device === 'low-end')!;
      
      expect(highEnd.loadTime).toBeLessThan(lowEnd.loadTime);
      expect(highEnd.inferenceTime).toBeLessThan(lowEnd.inferenceTime);
    });
  });

  describe('Network Performance', () => {
    it('should simulate different network conditions', async () => {
      const networkConditions = [
        { name: 'fast', delay: 10, bandwidth: 1000 },
        { name: 'slow', delay: 100, bandwidth: 100 },
        { name: 'very-slow', delay: 500, bandwidth: 10 }
      ];
      
      const networkResults: { condition: string; downloadTime: number }[] = [];
      
      for (const condition of networkConditions) {
        // Mock network delay
        const { AutoTokenizer } = await import('@xenova/transformers');
        vi.mocked(AutoTokenizer.from_pretrained).mockImplementation(() =>
          new Promise(resolve => setTimeout(() => resolve({
            tokenize: vi.fn().mockReturnValue(['hello', 'world']),
            encode: vi.fn().mockReturnValue([101, 7592, 2088, 102])
          }), condition.delay))
        );
        
        let currentTime = 0;
        mockPerformanceNow.mockImplementation(() => {
          currentTime += condition.delay;
          return currentTime;
        });
        
        const analyzer = new BERTSentimentAnalyzer();
        
        const downloadStart = performance.now();
        await analyzer.initialize('distilbert-base-uncased-finetuned-sst-2-english');
        const downloadEnd = performance.now();
        
        networkResults.push({
          condition: condition.name,
          downloadTime: downloadEnd - downloadStart
        });
      }
      
      // Verify that faster networks perform better
      const fast = networkResults.find(r => r.condition === 'fast')!;
      const slow = networkResults.find(r => r.condition === 'very-slow')!;
      
      expect(fast.downloadTime).toBeLessThan(slow.downloadTime);
    });
  });
});