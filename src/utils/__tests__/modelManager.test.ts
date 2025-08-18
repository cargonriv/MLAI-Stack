import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModelManager } from '../modelManager';

// Mock Transformers.js
vi.mock('@xenova/transformers', () => ({
  AutoTokenizer: {
    from_pretrained: vi.fn().mockResolvedValue({
      tokenize: vi.fn().mockReturnValue(['hello', 'world']),
      encode: vi.fn().mockReturnValue([101, 7592, 2088, 102])
    })
  },
  AutoModelForSequenceClassification: {
    from_pretrained: vi.fn().mockResolvedValue({
      forward: vi.fn().mockResolvedValue({
        logits: [[0.1, 0.9]]
      })
    })
  }
}));

describe('ModelManager', () => {
  let modelManager: ModelManager;

  beforeEach(() => {
    modelManager = new ModelManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    modelManager.clearCache();
  });

  describe('loadModel', () => {
    it('should load model successfully', async () => {
      const modelId = 'test-model';
      const progressCallback = vi.fn();

      // Mock the model loader function
      const mockLoader = vi.fn().mockResolvedValue({
        tokenizer: { tokenize: vi.fn() },
        model: { forward: vi.fn() }
      });

      await modelManager.loadModel(modelId, mockLoader, {
        progressCallback,
        device: 'cpu'
      });

      expect(modelManager.isModelLoaded(modelId)).toBe(true);
      expect(progressCallback).toHaveBeenCalled();
    });

    it('should handle model loading errors', async () => {
      const mockLoader = vi.fn().mockRejectedValue(new Error('Model not found'));

      await expect(
        modelManager.loadModel('invalid-model', mockLoader)
      ).rejects.toThrow('Model not found');
    });

    it('should cache loaded models', async () => {
      const modelId = 'test-model';
      const mockLoader = vi.fn().mockResolvedValue({
        tokenizer: { tokenize: vi.fn() },
        model: { forward: vi.fn() }
      });
      
      await modelManager.loadModel(modelId, mockLoader);
      const firstLoadTime = modelManager.getModelInfo(modelId)?.loadTime;
      
      await modelManager.loadModel(modelId, mockLoader);
      const secondLoadTime = modelManager.getModelInfo(modelId)?.loadTime;
      
      expect(secondLoadTime).toBeLessThan(firstLoadTime || 0);
    });

    it('should respect memory limits', async () => {
      // Mock memory usage
      const originalEstimateSize = modelManager['estimateModelSize'];
      modelManager['estimateModelSize'] = vi.fn().mockReturnValue(600 * 1024 * 1024); // 600MB
      
      const mockLoader = vi.fn().mockResolvedValue({
        tokenizer: { tokenize: vi.fn() },
        model: { forward: vi.fn() }
      });

      await expect(
        modelManager.loadModel('large-model', mockLoader)
      ).rejects.toThrow('Model too large for available memory');

      modelManager['estimateModelSize'] = originalEstimateSize;
    });
  });

  describe('unloadModel', () => {
    it('should unload model and free memory', async () => {
      const modelId = 'test-model';
      const mockLoader = vi.fn().mockResolvedValue({
        tokenizer: { tokenize: vi.fn() },
        model: { forward: vi.fn() }
      });
      
      await modelManager.loadModel(modelId, mockLoader);
      
      expect(modelManager.isModelLoaded(modelId)).toBe(true);
      
      modelManager.unloadModel(modelId);
      
      expect(modelManager.isModelLoaded(modelId)).toBe(false);
      expect(modelManager.getModelInfo(modelId)).toBeNull();
    });
  });

  describe('getMemoryUsage', () => {
    it('should return current memory usage', async () => {
      const initialUsage = modelManager.getMemoryUsage();
      expect(initialUsage.total).toBe(0);
      
      const mockLoader = vi.fn().mockResolvedValue({
        tokenizer: { tokenize: vi.fn() },
        model: { forward: vi.fn() }
      });
      
      await modelManager.loadModel('test-model', mockLoader);
      
      const afterLoadUsage = modelManager.getMemoryUsage();
      expect(afterLoadUsage.total).toBeGreaterThan(0);
      expect(afterLoadUsage.models).toHaveProperty('test-model');
    });
  });

  describe('clearCache', () => {
    it('should clear all cached models', async () => {
      const mockLoader = vi.fn().mockResolvedValue({
        tokenizer: { tokenize: vi.fn() },
        model: { forward: vi.fn() }
      });
      
      await modelManager.loadModel('model1', mockLoader);
      await modelManager.loadModel('model2', mockLoader);
      
      expect(modelManager.isModelLoaded('model1')).toBe(true);
      expect(modelManager.isModelLoaded('model2')).toBe(true);
      
      modelManager.clearCache();
      
      expect(modelManager.isModelLoaded('model1')).toBe(false);
      expect(modelManager.isModelLoaded('model2')).toBe(false);
    });
  });

  describe('device selection', () => {
    it('should select appropriate device based on capabilities', async () => {
      // Mock WebGL support
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue({})
      };
      global.document = {
        createElement: vi.fn().mockReturnValue(mockCanvas)
      } as any;

      const mockLoader = vi.fn().mockResolvedValue({
        tokenizer: { tokenize: vi.fn() },
        model: { forward: vi.fn() }
      });

      await modelManager.loadModel('test-model', mockLoader, { device: 'auto' });
      
      const modelInfo = modelManager.getModelInfo('test-model');
      expect(modelInfo?.device).toBe('webgl');
    });

    it('should fallback to CPU when WebGL unavailable', async () => {
      // Mock no WebGL support
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(null)
      };
      global.document = {
        createElement: vi.fn().mockReturnValue(mockCanvas)
      } as any;

      const mockLoader = vi.fn().mockResolvedValue({
        tokenizer: { tokenize: vi.fn() },
        model: { forward: vi.fn() }
      });

      await modelManager.loadModel('test-model', mockLoader, { device: 'auto' });
      
      const modelInfo = modelManager.getModelInfo('test-model');
      expect(modelInfo?.device).toBe('cpu');
    });
  });

  describe('model eviction', () => {
    it('should evict least recently used models when memory is full', async () => {
      // Mock memory limit
      const originalMaxMemory = modelManager['maxMemoryUsage'];
      modelManager['maxMemoryUsage'] = 100 * 1024 * 1024; // 100MB
      
      // Mock model sizes
      modelManager['estimateModelSize'] = vi.fn().mockReturnValue(60 * 1024 * 1024); // 60MB each

      const mockLoader = vi.fn().mockResolvedValue({
        tokenizer: { tokenize: vi.fn() },
        model: { forward: vi.fn() }
      });

      await modelManager.loadModel('model1', mockLoader);
      await modelManager.loadModel('model2', mockLoader); // Should trigger eviction of model1
      
      expect(modelManager.isModelLoaded('model1')).toBe(false);
      expect(modelManager.isModelLoaded('model2')).toBe(true);

      modelManager['maxMemoryUsage'] = originalMaxMemory;
    });
  });
});