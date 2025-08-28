// Core Web Vitals monitoring utilities

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface WebVitalsThresholds {
  lcp: { good: number; poor: number };
  fid: { good: number; poor: number };
  cls: { good: number; poor: number };
  fcp: { good: number; poor: number };
  ttfb: { good: number; poor: number };
}

// Web Vitals thresholds (in milliseconds for timing metrics)
const THRESHOLDS: WebVitalsThresholds = {
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  fcp: { good: 1800, poor: 3000 },
  ttfb: { good: 800, poor: 1800 },
};

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observer: PerformanceObserver | null = null;

  constructor() {
    this.initializeObserver();
    this.measureInitialMetrics();
  }

  private initializeObserver() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processEntry(entry);
        }
      });

      // Observe different types of performance entries
      this.observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (error) {
      console.warn('Performance monitoring not supported:', error);
    }
  }

  private processEntry(entry: PerformanceEntry) {
    const timestamp = Date.now();

    switch (entry.entryType) {
      case 'navigation':
        this.recordNavigationMetrics(entry as PerformanceNavigationTiming, timestamp);
        break;
      case 'paint':
        this.recordPaintMetrics(entry as PerformancePaintTiming, timestamp);
        break;
      case 'largest-contentful-paint':
        this.recordLCPMetric(entry as any, timestamp);
        break;
      case 'first-input':
        this.recordFIDMetric(entry as any, timestamp);
        break;
      case 'layout-shift':
        this.recordCLSMetric(entry as any, timestamp);
        break;
    }
  }

  private recordNavigationMetrics(entry: PerformanceNavigationTiming, timestamp: number) {
    const ttfb = entry.responseStart - entry.requestStart;
    this.addMetric('TTFB', ttfb, this.getRating('ttfb', ttfb), timestamp);
  }

  private recordPaintMetrics(entry: PerformancePaintTiming, timestamp: number) {
    if (entry.name === 'first-contentful-paint') {
      this.addMetric('FCP', entry.startTime, this.getRating('fcp', entry.startTime), timestamp);
    }
  }

  private recordLCPMetric(entry: any, timestamp: number) {
    this.addMetric('LCP', entry.startTime, this.getRating('lcp', entry.startTime), timestamp);
  }

  private recordFIDMetric(entry: any, timestamp: number) {
    const fid = entry.processingStart - entry.startTime;
    this.addMetric('FID', fid, this.getRating('fid', fid), timestamp);
  }

  private recordCLSMetric(entry: any, timestamp: number) {
    if (!entry.hadRecentInput) {
      this.addMetric('CLS', entry.value, this.getRating('cls', entry.value), timestamp);
    }
  }

  private measureInitialMetrics() {
    // Measure initial page load metrics
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const timestamp = Date.now();
        
        // DOM Content Loaded
        const dcl = navigation.domContentLoadedEventEnd - navigation.navigationStart;
        this.addMetric('DCL', dcl, dcl < 1500 ? 'good' : dcl < 3000 ? 'needs-improvement' : 'poor', timestamp);
        
        // Load Complete
        const loadComplete = navigation.loadEventEnd - navigation.navigationStart;
        this.addMetric('Load', loadComplete, loadComplete < 2500 ? 'good' : loadComplete < 4000 ? 'needs-improvement' : 'poor', timestamp);
      }
    }
  }

  private getRating(metric: keyof WebVitalsThresholds, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = THRESHOLDS[metric];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private addMetric(name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor', timestamp: number) {
    const metric: PerformanceMetric = { name, value, rating, timestamp };
    this.metrics.push(metric);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${value.toFixed(2)}ms (${rating})`);
    }
    
    // Emit custom event for external monitoring
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('web-vital', { detail: metric }));
    }
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getLatestMetric(name: string): PerformanceMetric | undefined {
    return this.metrics
      .filter(m => m.name === name)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
  }

  public getMetricsSummary() {
    const summary: Record<string, { latest: number; rating: string; count: number }> = {};
    
    for (const metric of this.metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = { latest: metric.value, rating: metric.rating, count: 1 };
      } else {
        summary[metric.name].latest = metric.value;
        summary[metric.name].rating = metric.rating;
        summary[metric.name].count++;
      }
    }
    
    return summary;
  }

  public dispose() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Animation performance utilities
export const optimizeAnimation = (element: HTMLElement, property: string) => {
  // Force hardware acceleration for better performance
  if (property === 'transform' || property === 'opacity') {
    element.style.willChange = property;
    element.style.transform = element.style.transform || 'translateZ(0)';
  }
};

export const cleanupAnimation = (element: HTMLElement) => {
  element.style.willChange = 'auto';
};

// Debounced resize handler for performance
export const createDebouncedResizeHandler = (callback: () => void, delay: number = 100) => {
  let timeoutId: NodeJS.Timeout;
  
  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
  };
};

// Memory usage monitoring
export const getMemoryUsage = () => {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
    };
  }
  return null;
};

// Frame rate monitoring
export class FrameRateMonitor {
  private frames: number[] = [];
  private lastTime = performance.now();
  private isRunning = false;
  private animationId: number | null = null;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.tick();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private tick = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;

    const fps = 1000 / delta;
    this.frames.push(fps);

    // Keep only last 60 frames (1 second at 60fps)
    if (this.frames.length > 60) {
      this.frames.shift();
    }

    this.animationId = requestAnimationFrame(this.tick);
  };

  getAverageFPS(): number {
    if (this.frames.length === 0) return 0;
    const sum = this.frames.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.frames.length);
  }

  getCurrentFPS(): number {
    return this.frames.length > 0 ? Math.round(this.frames[this.frames.length - 1]) : 0;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Hook for React components
export const usePerformanceMonitor = () => {
  return {
    getMetrics: () => performanceMonitor.getMetrics(),
    getMetricsSummary: () => performanceMonitor.getMetricsSummary(),
    getLatestMetric: (name: string) => performanceMonitor.getLatestMetric(name),
  };
};
