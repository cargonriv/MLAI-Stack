/**
 * Browser Compatibility Detection and Testing Utilities
 * Provides comprehensive browser feature detection and compatibility testing
 */

export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  platform: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  supportsModernFeatures: boolean;
}

export interface FeatureSupport {
  cssGrid: boolean;
  flexbox: boolean;
  customProperties: boolean;
  backdropFilter: boolean;
  clipPath: boolean;
  transforms3d: boolean;
  animations: boolean;
  gradients: boolean;
  webp: boolean;
  avif: boolean;
  intersectionObserver: boolean;
  resizeObserver: boolean;
  webGL: boolean;
  serviceWorker: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  webAssembly: boolean;
  es6Modules: boolean;
  asyncAwait: boolean;
}

/**
 * Detect browser information
 */
export function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  
  let name = 'Unknown';
  let version = 'Unknown';
  let engine = 'Unknown';
  
  // Detect browser name and version
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    name = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    engine = 'Blink';
  } else if (userAgent.includes('Firefox')) {
    name = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    engine = 'Gecko';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    name = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    engine = 'WebKit';
  } else if (userAgent.includes('Edg')) {
    name = 'Edge';
    const match = userAgent.match(/Edg\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    engine = 'Blink';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    name = 'Opera';
    const match = userAgent.match(/(?:Opera|OPR)\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    engine = 'Blink';
  }
  
  // Detect device type
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?=.*Mobile)/i.test(userAgent) && window.innerWidth >= 768;
  const isDesktop = !isMobile && !isTablet;
  
  // Check if browser supports modern features
  const supportsModernFeatures = checkModernFeatureSupport();
  
  return {
    name,
    version,
    engine,
    platform,
    isMobile,
    isTablet,
    isDesktop,
    supportsModernFeatures
  };
}

/**
 * Check support for modern web features
 */
function checkModernFeatureSupport(): boolean {
  try {
    // Check for essential modern features
    const hasES6 = typeof Symbol !== 'undefined';
    const hasAsyncAwait = (async () => {}).constructor === (async function(){}).constructor;
    const hasCustomProperties = CSS.supports('color', 'var(--test)');
    const hasGrid = CSS.supports('display', 'grid');
    const hasFetch = typeof fetch !== 'undefined';
    
    return hasES6 && hasAsyncAwait && hasCustomProperties && hasGrid && hasFetch;
  } catch {
    return false;
  }
}

/**
 * Comprehensive feature detection
 */
export function detectFeatureSupport(): FeatureSupport {
  const support: FeatureSupport = {
    cssGrid: false,
    flexbox: false,
    customProperties: false,
    backdropFilter: false,
    clipPath: false,
    transforms3d: false,
    animations: false,
    gradients: false,
    webp: false,
    avif: false,
    intersectionObserver: false,
    resizeObserver: false,
    webGL: false,
    serviceWorker: false,
    localStorage: false,
    sessionStorage: false,
    indexedDB: false,
    webAssembly: false,
    es6Modules: false,
    asyncAwait: false
  };

  try {
    // CSS Feature Detection
    if (typeof CSS !== 'undefined' && CSS.supports) {
      support.cssGrid = CSS.supports('display', 'grid');
      support.flexbox = CSS.supports('display', 'flex');
      support.customProperties = CSS.supports('color', 'var(--test)');
      support.backdropFilter = CSS.supports('backdrop-filter', 'blur(1px)') || 
                              CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
      support.clipPath = CSS.supports('clip-path', 'circle(50%)');
      support.transforms3d = CSS.supports('transform', 'translateZ(0)');
      support.animations = CSS.supports('animation', 'test 1s ease');
      support.gradients = CSS.supports('background', 'linear-gradient(red, blue)');
    }

    // Image Format Support
    support.webp = checkImageFormatSupport('webp');
    support.avif = checkImageFormatSupport('avif');

    // JavaScript API Support
    support.intersectionObserver = 'IntersectionObserver' in window;
    support.resizeObserver = 'ResizeObserver' in window;
    support.serviceWorker = 'serviceWorker' in navigator;
    support.localStorage = typeof Storage !== 'undefined' && 'localStorage' in window;
    support.sessionStorage = typeof Storage !== 'undefined' && 'sessionStorage' in window;
    support.indexedDB = 'indexedDB' in window;
    support.webAssembly = 'WebAssembly' in window;

    // WebGL Support
    support.webGL = checkWebGLSupport();

    // ES6+ Features
    support.es6Modules = 'noModule' in HTMLScriptElement.prototype;
    support.asyncAwait = (async () => {}).constructor === (async function(){}).constructor;

  } catch (error) {
    console.warn('Feature detection failed:', error);
  }

  return support;
}

/**
 * Check image format support
 */
function checkImageFormatSupport(format: 'webp' | 'avif'): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  try {
    const dataURL = canvas.toDataURL(`image/${format}`);
    return dataURL.startsWith(`data:image/${format}`);
  } catch {
    return false;
  }
}

/**
 * Check WebGL support
 */
function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTester {
  private static instance: PerformanceTester;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceTester {
    if (!PerformanceTester.instance) {
      PerformanceTester.instance = new PerformanceTester();
    }
    return PerformanceTester.instance;
  }

  /**
   * Measure animation frame rate
   */
  measureFPS(duration: number = 1000): Promise<number> {
    return new Promise((resolve) => {
      let frames = 0;
      const startTime = performance.now();
      
      const countFrames = () => {
        frames++;
        const currentTime = performance.now();
        
        if (currentTime - startTime < duration) {
          requestAnimationFrame(countFrames);
        } else {
          const fps = Math.round((frames * 1000) / (currentTime - startTime));
          resolve(fps);
        }
      };
      
      requestAnimationFrame(countFrames);
    });
  }

  /**
   * Measure paint timing
   */
  measurePaintTiming(): { fcp?: number; lcp?: number } {
    const timing: { fcp?: number; lcp?: number } = {};
    
    try {
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        timing.fcp = fcpEntry.startTime;
      }

      // LCP requires PerformanceObserver
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          timing.lcp = lastEntry.startTime;
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      }
    } catch (error) {
      console.warn('Paint timing measurement failed:', error);
    }
    
    return timing;
  }

  /**
   * Measure memory usage (if available)
   */
  measureMemoryUsage(): { used?: number; total?: number; limit?: number } {
    const memory: { used?: number; total?: number; limit?: number } = {};
    
    try {
      // @ts-expect-error - performance.memory is not in all browsers
      if (performance.memory) {
        // @ts-expect-error
        memory.used = performance.memory.usedJSHeapSize;
        // @ts-expect-error
        memory.total = performance.memory.totalJSHeapSize;
        // @ts-expect-error
        memory.limit = performance.memory.jsHeapSizeLimit;
      }
    } catch (error) {
      console.warn('Memory measurement failed:', error);
    }
    
    return memory;
  }

  /**
   * Test CSS animation performance
   */
  async testAnimationPerformance(element: HTMLElement, duration: number = 1000): Promise<number> {
    return new Promise((resolve) => {
      let frameCount = 0;
      const startTime = performance.now();
      
      // Add a test animation
      element.style.animation = 'spin 1s linear infinite';
      
      const measureFrames = () => {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - startTime < duration) {
          requestAnimationFrame(measureFrames);
        } else {
          // Clean up
          element.style.animation = '';
          const fps = Math.round((frameCount * 1000) / (currentTime - startTime));
          resolve(fps);
        }
      };
      
      requestAnimationFrame(measureFrames);
    });
  }
}

/**
 * Accessibility testing utilities
 */
export class AccessibilityTester {
  /**
   * Check color contrast ratio
   */
  static checkColorContrast(foreground: string, background: string): number {
    const getLuminance = (color: string): number => {
      // Convert color to RGB values
      const rgb = this.hexToRgb(color);
      if (!rgb) return 0;
      
      // Calculate relative luminance
      const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    
    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Convert hex color to RGB
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Check if element has proper ARIA labels
   */
  static checkAriaLabels(element: HTMLElement): boolean {
    const interactiveElements = ['button', 'a', 'input', 'select', 'textarea'];
    const tagName = element.tagName.toLowerCase();
    
    if (interactiveElements.includes(tagName)) {
      return !!(
        element.getAttribute('aria-label') ||
        element.getAttribute('aria-labelledby') ||
        element.getAttribute('title') ||
        element.textContent?.trim()
      );
    }
    
    return true;
  }

  /**
   * Check keyboard navigation
   */
  static checkKeyboardNavigation(container: HTMLElement): boolean {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    return Array.from(focusableElements).every(element => {
      const tabIndex = element.getAttribute('tabindex');
      return tabIndex !== '-1';
    });
  }
}

/**
 * Initialize browser compatibility features
 */
export function initializeBrowserCompatibility(): void {
  const browserInfo = detectBrowser();
  const featureSupport = detectFeatureSupport();
  
  // Add browser classes to document
  document.documentElement.classList.add(
    `browser-${browserInfo.name.toLowerCase()}`,
    `engine-${browserInfo.engine.toLowerCase()}`,
    browserInfo.isMobile ? 'is-mobile' : 'is-desktop'
  );
  
  // Add feature support classes
  Object.entries(featureSupport).forEach(([feature, supported]) => {
    document.documentElement.classList.add(
      supported ? `supports-${feature}` : `no-${feature}`
    );
  });
  
  // Initialize CSS custom properties polyfill for older browsers
  if (!featureSupport.customProperties) {
    import('css-vars-ponyfill').then(({ default: cssVars }) => {
      cssVars({
        watch: true,
        variables: {
          '--accent-primary': '#6366f1',
          '--accent-secondary': '#8b5cf6',
          '--background-primary': '#0f0f23',
          '--foreground-primary': '#f8fafc'
        }
      });
    }).catch(console.warn);
  }
  
  // Initialize Intersection Observer polyfill if needed
  if (!featureSupport.intersectionObserver) {
    import('intersection-observer').catch(console.warn);
  }
  
  // Initialize ResizeObserver polyfill if needed
  if (!featureSupport.resizeObserver) {
    import('@juggle/resize-observer').then(({ ResizeObserver }) => {
      window.ResizeObserver = ResizeObserver;
    }).catch(console.warn);
  }
  
  console.log('Browser compatibility initialized:', {
    browser: browserInfo,
    features: featureSupport
  });
}

/**
 * Export browser and feature information for use in components
 */
export const browserInfo = detectBrowser();
export const featureSupport = detectFeatureSupport();