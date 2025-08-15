/**
 * Browser Detection and Feature Support Utilities
 * Provides comprehensive browser detection and feature support checking
 */

export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  platform: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
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
  webGL2: boolean;
  serviceWorker: boolean;
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
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;
  
  return {
    name,
    version,
    engine,
    platform,
    isMobile,
    isTablet,
    isDesktop
  };
}

/**
 * Check CSS feature support
 */
export function checkCSSSupport(property: string, value?: string): boolean {
  if (typeof CSS === 'undefined' || !CSS.supports) {
    return false;
  }
  
  try {
    if (value) {
      return CSS.supports(property, value);
    }
    return CSS.supports(property);
  } catch {
    return false;
  }
}

/**
 * Check comprehensive feature support
 */
export function detectFeatureSupport(): FeatureSupport {
  return {
    // CSS Features
    cssGrid: checkCSSSupport('display', 'grid'),
    flexbox: checkCSSSupport('display', 'flex'),
    customProperties: checkCSSSupport('color', 'var(--test)'),
    backdropFilter: checkCSSSupport('backdrop-filter', 'blur(10px)'),
    clipPath: checkCSSSupport('clip-path', 'circle(50%)'),
    transforms3d: checkCSSSupport('transform', 'translateZ(0)'),
    animations: checkCSSSupport('animation', 'test 1s ease'),
    gradients: checkCSSSupport('background', 'linear-gradient(red, blue)'),
    
    // Image Formats
    webp: checkImageFormat('webp'),
    avif: checkImageFormat('avif'),
    
    // JavaScript APIs
    intersectionObserver: 'IntersectionObserver' in window,
    resizeObserver: 'ResizeObserver' in window,
    webGL: checkWebGLSupport(),
    webGL2: checkWebGL2Support(),
    serviceWorker: 'serviceWorker' in navigator,
    webAssembly: 'WebAssembly' in window,
    es6Modules: checkES6ModuleSupport(),
    asyncAwait: checkAsyncAwaitSupport()
  };
}

/**
 * Check image format support
 */
function checkImageFormat(format: string): boolean {
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
 * Check WebGL2 support
 */
function checkWebGL2Support(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    return !!gl;
  } catch {
    return false;
  }
}

/**
 * Check ES6 module support
 */
function checkES6ModuleSupport(): boolean {
  try {
    return 'noModule' in document.createElement('script');
  } catch {
    return false;
  }
}

/**
 * Check async/await support
 */
function checkAsyncAwaitSupport(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const asyncFunction = async () => {};
    return true;
  } catch {
    return false;
  }
}

/**
 * Get browser compatibility class names
 */
export function getBrowserClasses(): string[] {
  const browser = detectBrowser();
  const features = detectFeatureSupport();
  const classes: string[] = [];
  
  // Browser-specific classes
  classes.push(`browser-${browser.name.toLowerCase()}`);
  classes.push(`engine-${browser.engine.toLowerCase()}`);
  classes.push(`platform-${browser.platform.toLowerCase().replace(/\s+/g, '-')}`);
  
  // Device type classes
  if (browser.isMobile) classes.push('device-mobile');
  if (browser.isTablet) classes.push('device-tablet');
  if (browser.isDesktop) classes.push('device-desktop');
  
  // Feature support classes
  Object.entries(features).forEach(([feature, supported]) => {
    classes.push(supported ? `supports-${feature}` : `no-${feature}`);
  });
  
  // Version-specific classes for major browsers
  const version = parseInt(browser.version);
  if (!isNaN(version)) {
    if (browser.name === 'Chrome' && version < 88) {
      classes.push('chrome-legacy');
    }
    if (browser.name === 'Firefox' && version < 85) {
      classes.push('firefox-legacy');
    }
    if (browser.name === 'Safari' && version < 14) {
      classes.push('safari-legacy');
    }
    if (browser.name === 'Edge' && version < 88) {
      classes.push('edge-legacy');
    }
  }
  
  return classes;
}

/**
 * Apply browser compatibility classes to document
 */
export function applyBrowserClasses(): void {
  const classes = getBrowserClasses();
  document.documentElement.classList.add(...classes);
}

/**
 * Check if browser needs polyfills
 */
export function needsPolyfills(): boolean {
  const features = detectFeatureSupport();
  return !features.intersectionObserver || 
         !features.resizeObserver || 
         !features.customProperties ||
         !features.es6Modules;
}

/**
 * Load polyfills dynamically if needed
 */
export async function loadPolyfills(): Promise<void> {
  const features = detectFeatureSupport();
  const polyfills: Promise<void>[] = [];
  
  // Intersection Observer polyfill
  if (!features.intersectionObserver) {
    polyfills.push(
      import('intersection-observer').then(() => {
        console.log('Intersection Observer polyfill loaded');
      }).catch(() => {
        console.warn('Failed to load Intersection Observer polyfill');
      })
    );
  }
  
  // ResizeObserver polyfill
  if (!features.resizeObserver) {
    polyfills.push(
      import('@juggle/resize-observer').then(({ ResizeObserver }) => {
        if (!window.ResizeObserver) {
          window.ResizeObserver = ResizeObserver;
        }
        console.log('ResizeObserver polyfill loaded');
      }).catch(() => {
        console.warn('Failed to load ResizeObserver polyfill');
      })
    );
  }
  
  // CSS Custom Properties polyfill for older browsers
  if (!features.customProperties) {
    polyfills.push(
      import('css-vars-ponyfill').then(({ default: cssVars }) => {
        cssVars({
          include: 'style,link[rel="stylesheet"]',
          onlyLegacy: true,
          watch: true
        });
        console.log('CSS Custom Properties polyfill loaded');
      }).catch(() => {
        console.warn('Failed to load CSS Custom Properties polyfill');
      })
    );
  }
  
  await Promise.all(polyfills);
}

/**
 * Performance monitoring for different browsers
 */
export function monitorPerformance(): void {
  if ('performance' in window && 'measure' in performance) {
    const browser = detectBrowser();
    
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log(`LCP (${browser.name}):`, lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            console.log(`FID (${browser.name}):`, entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        
        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              console.log(`CLS (${browser.name}):`, entry.value);
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('Performance monitoring not available:', error);
      }
    }
  }
}

/**
 * Get recommended optimizations for current browser
 */
export function getOptimizationRecommendations(): string[] {
  const browser = detectBrowser();
  const features = detectFeatureSupport();
  const recommendations: string[] = [];
  
  // Browser-specific optimizations
  if (browser.name === 'Safari') {
    recommendations.push('Use -webkit-transform for better performance');
    recommendations.push('Avoid backdrop-filter on older versions');
  }
  
  if (browser.name === 'Firefox') {
    recommendations.push('Use will-change property sparingly');
    recommendations.push('Prefer transform over changing layout properties');
  }
  
  if (browser.name === 'Chrome' && parseInt(browser.version) < 90) {
    recommendations.push('Consider using transform3d for hardware acceleration');
  }
  
  // Feature-based recommendations
  if (!features.webGL) {
    recommendations.push('Disable WebGL-based features');
  }
  
  if (!features.backdropFilter) {
    recommendations.push('Use alternative blur effects');
  }
  
  if (browser.isMobile) {
    recommendations.push('Reduce animation complexity on mobile');
    recommendations.push('Use touch-action for better scroll performance');
  }
  
  return recommendations;
}

// Initialize browser detection on module load
let browserInfo: BrowserInfo | null = null;
let featureSupport: FeatureSupport | null = null;

export function initializeBrowserDetection(): void {
  if (typeof window !== 'undefined') {
    browserInfo = detectBrowser();
    featureSupport = detectFeatureSupport();
    applyBrowserClasses();
    monitorPerformance();
  }
}

// Export cached results
export function getBrowserInfo(): BrowserInfo | null {
  return browserInfo;
}

export function getFeatureSupport(): FeatureSupport | null {
  return featureSupport;
}