import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateInput,
  sanitizeText,
  formatConfidence,
  calculateProcessingTime,
  estimateModelSize,
  checkBrowserSupport,
  createProgressCallback,
  handleAsyncError,
  debounce,
  throttle
} from '../mlUtils';

describe('mlUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateInput', () => {
    it('should validate text input correctly', () => {
      expect(validateInput('Hello world', 'text')).toBe(true);
      expect(validateInput('', 'text')).toBe(false);
      expect(validateInput('a'.repeat(10000), 'text')).toBe(false);
    });

    it('should validate array input correctly', () => {
      expect(validateInput([1, 2, 3], 'array')).toBe(true);
      expect(validateInput([], 'array')).toBe(false);
      expect(validateInput('not array', 'array')).toBe(false);
    });

    it('should validate object input correctly', () => {
      expect(validateInput({ key: 'value' }, 'object')).toBe(true);
      expect(validateInput({}, 'object')).toBe(false);
      expect(validateInput(null, 'object')).toBe(false);
    });
  });

  describe('sanitizeText', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeText('<script>alert("xss")</script>Hello')).toBe('Hello');
      expect(sanitizeText('<p>Hello <b>world</b></p>')).toBe('Hello world');
    });

    it('should trim whitespace', () => {
      expect(sanitizeText('  Hello world  ')).toBe('Hello world');
    });

    it('should handle empty input', () => {
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText('   ')).toBe('');
    });

    it('should preserve valid text', () => {
      expect(sanitizeText('Hello world!')).toBe('Hello world!');
    });
  });

  describe('formatConfidence', () => {
    it('should format confidence as percentage', () => {
      expect(formatConfidence(0.8567)).toBe('85.67%');
      expect(formatConfidence(0.1)).toBe('10.00%');
      expect(formatConfidence(1)).toBe('100.00%');
    });

    it('should handle edge cases', () => {
      expect(formatConfidence(0)).toBe('0.00%');
      expect(formatConfidence(-0.1)).toBe('0.00%');
      expect(formatConfidence(1.1)).toBe('100.00%');
    });
  });

  describe('calculateProcessingTime', () => {
    it('should calculate processing time correctly', () => {
      const startTime = Date.now() - 1000;
      const result = calculateProcessingTime(startTime);
      expect(result).toBeGreaterThan(900);
      expect(result).toBeLessThan(1100);
    });
  });

  describe('estimateModelSize', () => {
    it('should estimate model size from parameters', () => {
      const mockModel = {
        parameters: new Float32Array(1000000) // 1M parameters
      };
      const size = estimateModelSize(mockModel);
      expect(size).toBeGreaterThan(0);
    });

    it('should handle models without parameters', () => {
      const mockModel = {};
      const size = estimateModelSize(mockModel);
      expect(size).toBe(0);
    });
  });

  describe('checkBrowserSupport', () => {
    it('should check WebGL support', () => {
      // Mock canvas and WebGL context
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue({})
      };
      global.document = {
        createElement: vi.fn().mockReturnValue(mockCanvas)
      } as any;

      const support = checkBrowserSupport();
      expect(support.webgl).toBe(true);
    });

    it('should check WASM support', () => {
      global.WebAssembly = { instantiate: vi.fn() } as any;
      const support = checkBrowserSupport();
      expect(support.wasm).toBe(true);
    });
  });

  describe('createProgressCallback', () => {
    it('should create progress callback with throttling', () => {
      const mockCallback = vi.fn();
      const progressCallback = createProgressCallback(mockCallback, 100);
      
      progressCallback(0.5);
      progressCallback(0.6);
      progressCallback(0.7);
      
      expect(mockCallback).toHaveBeenCalledWith(0.5);
    });
  });

  describe('handleAsyncError', () => {
    it('should handle async errors gracefully', async () => {
      const errorFn = async () => {
        throw new Error('Test error');
      };

      const result = await handleAsyncError(errorFn, 'default');
      expect(result).toBe('default');
    });

    it('should return result on success', async () => {
      const successFn = async () => 'success';
      const result = await handleAsyncError(successFn, 'default');
      expect(result).toBe('success');
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      await new Promise(resolve => setTimeout(resolve, 150));
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
});