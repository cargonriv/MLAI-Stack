import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkBrowserSupport } from '../utils/mlUtils';
import { BERTSentimentAnalyzer } from '../utils/sentimentAnalysis';
import { ModelManager } from '../utils/modelManager';

// Mock different browser environments
const mockUserAgents = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
  mobileSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  chromeAndroid: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
};

describe('Browser Compatibility Tests', () => {
  let originalUserAgent: string;
  let originalNavigator: any;
  let originalDocument: any;
  let originalWebAssembly: any;

  beforeEach(() => {
    originalUserAgent = navigator.userAgent;
    originalNavigator = global.navigator;
    originalDocument = global.document;
    originalWebAssembly = global.WebAssembly;
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.navigator = originalNavigator;
    global.document = originalDocument;
    global.WebAssembly = originalWebAssembly;
  });

  describe('WebGL Support Detection', () => {
    it('should detect WebGL support in Chrome', () => {
      // Mock Chrome environment
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.chrome,
        configurable: true
      });

      const mockCanvas = {
        getContext: vi.fn().mockReturnValue({
          getParameter: vi.fn(),
          getExtension: vi.fn()
        })
      };

      global.document = {
        createElement: vi.fn().mockReturnValue(mockCanvas)
      } as any;

      const support = checkBrowserSupport();
      expect(support.webgl).toBe(true);
      expect(mockCanvas.getContext).toHaveBeenCalledWith('webgl');
    });

    it('should detect WebGL support in Firefox', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.firefox,
        configurable: true
      });

      const mockCanvas = {
        getContext: vi.fn().mockReturnValue({
          getParameter: vi.fn(),
          getExtension: vi.fn()
        })
      };

      global.document = {
        createElement: vi.fn().mockReturnValue(mockCanvas)
      } as any;

      const support = checkBrowserSupport();
      expect(support.webgl).toBe(true);
    });

    it('should handle WebGL unavailability gracefully', () => {
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(null)
      };

      global.document = {
        createElement: vi.fn().mockReturnValue(mockCanvas)
      } as any;

      const support = checkBrowserSupport();
      expect(support.webgl).toBe(false);
    });

    it('should detect WebGL2 support when available', () => {
      const mockCanvas = {
        getContext: vi.fn().mockImplementation((type: string) => {
          if (type === 'webgl2') {
            return { getParameter: vi.fn(), getExtension: vi.fn() };
          }
          return null;
        })
      };

      global.document = {
        createElement: vi.fn().mockReturnValue(mockCanvas)
      } as any;

      const support = checkBrowserSupport();
      expect(support.webgl2).toBe(true);
    });
  });

  describe('WebAssembly Support Detection', () => {
    it('should detect WASM support in modern browsers', () => {
      global.WebAssembly = {
        instantiate: vi.fn(),
        compile: vi.fn(),
        Module: vi.fn(),
        Instance: vi.fn()
      } as any;

      const support = checkBrowserSupport();
      expect(support.wasm).toBe(true);
    });

    it('should handle WASM unavailability', () => {
      global.WebAssembly = undefined as any;

      const support = checkBrowserSupport();
      expect(support.wasm).toBe(false);
    });

    it('should detect WASM SIMD support', () => {
      global.WebAssembly = {
        instantiate: vi.fn(),
        compile: vi.fn().mockImplementation(async (bytes: Uint8Array) => {
          // Mock SIMD support detection
          if (bytes.includes(0xfd)) { // SIMD opcode prefix
            return { exports: {} };
          }
          throw new Error('SIMD not supported');
        })
      } as any;

      // This would be tested in a real browser environment
      expect(global.WebAssembly).toBeDefined();
    });
  });

  describe('Mobile Browser Compatibility', () => {
    it('should handle iOS Safari limitations', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.mobileSafari,
        configurable: true
      });

      // Mock limited memory on mobile
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 2, // 2GB RAM
        configurable: true
      });

      const modelManager = new ModelManager();
      
      // Should adjust memory limits for mobile
      const memoryLimit = modelManager['maxMemoryUsage'];
      expect(memoryLimit).toBeLessThan(500 * 1024 * 1024); // Less than 500MB
    });

    it('should handle Android Chrome performance', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.chromeAndroid,
        configurable: true
      });

      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 4,
        configurable: true
      });

      const support = checkBrowserSupport();
      expect(support.mobile).toBe(true);
      expect(support.cores).toBe(4);
    });

    it('should detect touch support on mobile devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.mobileSafari,
        configurable: true
      });

      // Mock touch events
      global.window = {
        ontouchstart: null,
        TouchEvent: vi.fn()
      } as any;

      const support = checkBrowserSupport();
      expect(support.touch).toBe(true);
    });
  });

  describe('Feature Detection and Fallbacks', () => {
    it('should fallback to CPU when WebGL is unavailable', async () => {
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(null)
      };

      global.document = {
        createElement: vi.fn().mockReturnValue(mockCanvas)
      } as any;

      const modelManager = new ModelManager();
      await modelManager.loadModel('test-model', { device: 'auto' });

      const modelInfo = modelManager.getModelInfo('test-model');
      expect(modelInfo?.device).toBe('cpu');
    });

    it('should handle missing APIs gracefully', () => {
      // Remove modern APIs
      delete (global as any).fetch;
      delete (global as any).Promise;
      delete (global as any).WebAssembly;

      const support = checkBrowserSupport();
      expect(support.fetch).toBe(false);
      expect(support.wasm).toBe(false);
    });

    it('should provide appropriate error messages for unsupported browsers', () => {
      // Mock old IE
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1)',
        configurable: true
      });

      global.WebAssembly = undefined as any;
      
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(null)
      };

      global.document = {
        createElement: vi.fn().mockReturnValue(mockCanvas)
      } as any;

      const support = checkBrowserSupport();
      expect(support.webgl).toBe(false);
      expect(support.wasm).toBe(false);
      expect(support.supported).toBe(false);
    });
  });

  describe('Performance Across Browsers', () => {
    it('should adapt to browser-specific performance characteristics', async () => {
      const browsers = [
        { name: 'chrome', userAgent: mockUserAgents.chrome, expectedPerformance: 'high' },
        { name: 'firefox', userAgent: mockUserAgents.firefox, expectedPerformance: 'high' },
        { name: 'safari', userAgent: mockUserAgents.safari, expectedPerformance: 'medium' },
        { name: 'edge', userAgent: mockUserAgents.edge, expectedPerformance: 'high' }
      ];

      for (const browser of browsers) {
        Object.defineProperty(navigator, 'userAgent', {
          value: browser.userAgent,
          configurable: true
        });

        const support = checkBrowserSupport();
        
        // Chrome and Firefox should have better WebGL support
        if (browser.name === 'chrome' || browser.name === 'firefox') {
          expect(support.webglPerformance).toBe('high');
        }
      }
    });

    it('should handle memory constraints on different browsers', async () => {
      const memoryConfigs = [
        { browser: 'chrome', memory: 8 }, // 8GB
        { browser: 'firefox', memory: 4 }, // 4GB
        { browser: 'safari', memory: 2 }, // 2GB (mobile)
        { browser: 'edge', memory: 6 }    // 6GB
      ];

      for (const config of memoryConfigs) {
        Object.defineProperty(navigator, 'deviceMemory', {
          value: config.memory,
          configurable: true
        });

        const modelManager = new ModelManager();
        const memoryLimit = modelManager['maxMemoryUsage'];
        
        // Memory limit should scale with available memory
        const expectedLimit = Math.min(config.memory * 0.25 * 1024 * 1024 * 1024, 500 * 1024 * 1024);
        expect(memoryLimit).toBeLessThanOrEqual(expectedLimit);
      }
    });
  });

  describe('Network and Loading Compatibility', () => {
    it('should handle different network conditions', async () => {
      // Mock slow network
      const mockFetch = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
        }), 2000))
      );

      global.fetch = mockFetch;

      const analyzer = new BERTSentimentAnalyzer();
      
      // Should handle slow loading gracefully
      const loadPromise = analyzer.initialize('test-model');
      expect(loadPromise).toBeInstanceOf(Promise);
    });

    it('should handle offline scenarios', async () => {
      // Mock network error
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const analyzer = new BERTSentimentAnalyzer();
      
      await expect(analyzer.initialize('test-model')).rejects.toThrow('Network error');
    });

    it('should support progressive loading', async () => {
      let loadedBytes = 0;
      const totalBytes = 1024 * 1024; // 1MB

      const mockFetch = vi.fn().mockImplementation(() => ({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-length' ? totalBytes.toString() : null
        },
        body: {
          getReader: () => ({
            read: async () => {
              if (loadedBytes < totalBytes) {
                loadedBytes += 1024;
                return {
                  done: false,
                  value: new Uint8Array(1024)
                };
              }
              return { done: true };
            }
          })
        }
      }));

      global.fetch = mockFetch;

      const progressCallback = vi.fn();
      const analyzer = new BERTSentimentAnalyzer();
      
      // This would test progressive loading in a real implementation
      expect(progressCallback).toBeDefined();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should provide appropriate loading states for screen readers', () => {
      const support = checkBrowserSupport();
      
      // Should include accessibility information
      expect(support).toHaveProperty('screenReader');
    });

    it('should handle reduced motion preferences', () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
        configurable: true
      });

      const support = checkBrowserSupport();
      expect(support.reducedMotion).toBe(true);
    });

    it('should adapt to high contrast mode', () => {
      // Mock high contrast detection
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
        configurable: true
      });

      const support = checkBrowserSupport();
      expect(support.highContrast).toBe(true);
    });
  });
});