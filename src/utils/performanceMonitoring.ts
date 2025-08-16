/**
 * Performance monitoring utilities for Core Web Vitals and optimization
 */

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  
  // Other important metrics
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  fmp?: number; // First Meaningful Paint
  
  // Custom metrics
  pageLoadTime?: number;
  domContentLoaded?: number;
  resourceLoadTime?: number;
  
  // Bundle metrics
  jsSize?: number;
  cssSize?: number;
  imageSize?: number;
  totalSize?: number;
}

export interface PerformanceThresholds {
  lcp: { good: number; needsImprovement: number };
  fid: { good: number; needsImprovement: number };
  cls: { good: number; needsImprovement: number };
  fcp: { good: number; needsImprovement: number };
  ttfb: { good: number; needsImprovement: number };
}

// Performance thresholds based on Core Web Vitals
export const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  lcp: { good: 2500, needsImprovement: 4000 },
  fid: { good: 100, needsImprovement: 300 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  fcp: { good: 1800, needsImprovement: 3000 },
  ttfb: { good: 800, needsImprovement: 1800 },
};

/**
 * Performance monitoring class
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: Map<string, PerformanceObserver> = new Map();
  private startTime: number = performance.now();

  constructor() {
    this.initializeObservers();
    this.measureBasicMetrics();
  }

  private initializeObservers() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
            startTime: number;
          };
          this.metrics.lcp = lastEntry.startTime;
          this.reportMetric('lcp', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported:', e);
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const fidEntry = entry as PerformanceEntry & {
              processingStart: number;
              startTime: number;
            };
            const fid = fidEntry.processingStart - fidEntry.startTime;
            this.metrics.fid = fid;
            this.reportMetric('fid', fid);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (e) {
        console.warn('FID observer not supported:', e);
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const layoutShiftEntry = entry as PerformanceEntry & {
              value: number;
              hadRecentInput: boolean;
            };
            if (!layoutShiftEntry.hadRecentInput) {
              clsValue += layoutShiftEntry.value;
            }
          });
          this.metrics.cls = clsValue;
          this.reportMetric('cls', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported:', e);
      }

      // First Contentful Paint (FCP)
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = entry.startTime;
              this.reportMetric('fcp', entry.startTime);
            }
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('fcp', fcpObserver);
      } catch (e) {
        console.warn('FCP observer not supported:', e);
      }

      // Resource timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          this.analyzeResourceTiming(entries as PerformanceResourceTiming[]);
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
      } catch (e) {
        console.warn('Resource observer not supported:', e);
      }
    }
  }

  private measureBasicMetrics() {
    // Measure basic timing metrics
    if (performance.timing) {
      const timing = performance.timing;
      this.metrics.ttfb = timing.responseStart - timing.navigationStart;
      this.metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
      this.metrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
    }

    // Use Navigation Timing API Level 2 if available
    if (performance.getEntriesByType) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const entry = navigationEntries[0];
        this.metrics.ttfb = entry.responseStart - entry.fetchStart;
        this.metrics.domContentLoaded = entry.domContentLoadedEventEnd - entry.fetchStart;
        this.metrics.pageLoadTime = entry.loadEventEnd - entry.fetchStart;
      }
    }
  }

  private analyzeResourceTiming(entries: PerformanceResourceTiming[]) {
    let jsSize = 0;
    let cssSize = 0;
    let imageSize = 0;
    let totalSize = 0;

    entries.forEach((entry) => {
      const size = entry.transferSize || 0;
      totalSize += size;

      if (entry.name.includes('.js')) {
        jsSize += size;
      } else if (entry.name.includes('.css')) {
        cssSize += size;
      } else if (entry.name.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/i)) {
        imageSize += size;
      }
    });

    this.metrics.jsSize = jsSize;
    this.metrics.cssSize = cssSize;
    this.metrics.imageSize = imageSize;
    this.metrics.totalSize = totalSize;
  }

  private reportMetric(name: string, value: number) {
    // Report to analytics service (placeholder)
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Google Analytics, DataDog, etc.
      console.log(`Performance metric - ${name}: ${value}`);
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance score based on Core Web Vitals
   */
  getPerformanceScore(): {
    score: number;
    grade: 'good' | 'needs-improvement' | 'poor';
    details: Record<string, { value: number; status: string }>;
  } {
    const details: Record<string, { value: number; status: string }> = {};
    let totalScore = 0;
    let metricCount = 0;

    // Evaluate LCP
    if (this.metrics.lcp !== undefined) {
      const lcp = this.metrics.lcp;
      let status = 'good';
      let score = 100;

      if (lcp > PERFORMANCE_THRESHOLDS.lcp.needsImprovement) {
        status = 'poor';
        score = 0;
      } else if (lcp > PERFORMANCE_THRESHOLDS.lcp.good) {
        status = 'needs-improvement';
        score = 50;
      }

      details.lcp = { value: lcp, status };
      totalScore += score;
      metricCount++;
    }

    // Evaluate FID
    if (this.metrics.fid !== undefined) {
      const fid = this.metrics.fid;
      let status = 'good';
      let score = 100;

      if (fid > PERFORMANCE_THRESHOLDS.fid.needsImprovement) {
        status = 'poor';
        score = 0;
      } else if (fid > PERFORMANCE_THRESHOLDS.fid.good) {
        status = 'needs-improvement';
        score = 50;
      }

      details.fid = { value: fid, status };
      totalScore += score;
      metricCount++;
    }

    // Evaluate CLS
    if (this.metrics.cls !== undefined) {
      const cls = this.metrics.cls;
      let status = 'good';
      let score = 100;

      if (cls > PERFORMANCE_THRESHOLDS.cls.needsImprovement) {
        status = 'poor';
        score = 0;
      } else if (cls > PERFORMANCE_THRESHOLDS.cls.good) {
        status = 'needs-improvement';
        score = 50;
      }

      details.cls = { value: cls, status };
      totalScore += score;
      metricCount++;
    }

    const averageScore = metricCount > 0 ? totalScore / metricCount : 0;
    let grade: 'good' | 'needs-improvement' | 'poor' = 'good';

    if (averageScore < 50) {
      grade = 'poor';
    } else if (averageScore < 90) {
      grade = 'needs-improvement';
    }

    return {
      score: Math.round(averageScore),
      grade,
      details,
    };
  }

  /**
   * Measure custom timing
   */
  measureCustomTiming(name: string, startTime?: number): number {
    const endTime = performance.now();
    const duration = endTime - (startTime || this.startTime);
    
    // Store custom metric
    (this.metrics as any)[name] = duration;
    this.reportMetric(name, duration);
    
    return duration;
  }

  /**
   * Start measuring a custom operation
   */
  startMeasurement(name: string): () => number {
    const startTime = performance.now();
    
    return () => {
      return this.measureCustomTiming(name, startTime);
    };
  }

  /**
   * Measure bundle sizes
   */
  async measureBundleSizes(): Promise<{
    js: number;
    css: number;
    images: number;
    total: number;
  }> {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    let jsSize = 0;
    let cssSize = 0;
    let imageSize = 0;
    let totalSize = 0;

    resources.forEach((resource) => {
      const size = resource.transferSize || 0;
      totalSize += size;

      if (resource.name.includes('.js')) {
        jsSize += size;
      } else if (resource.name.includes('.css')) {
        cssSize += size;
      } else if (resource.name.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/i)) {
        imageSize += size;
      }
    });

    const sizes = {
      js: Math.round(jsSize / 1024), // KB
      css: Math.round(cssSize / 1024), // KB
      images: Math.round(imageSize / 1024), // KB
      total: Math.round(totalSize / 1024), // KB
    };

    console.log('Bundle sizes:', sizes);
    return sizes;
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const metrics = this.getMetrics();
    const score = this.getPerformanceScore();
    
    let report = '=== Performance Report ===\n\n';
    
    report += `Overall Score: ${score.score}/100 (${score.grade})\n\n`;
    
    report += 'Core Web Vitals:\n';
    if (metrics.lcp) report += `  LCP: ${Math.round(metrics.lcp)}ms\n`;
    if (metrics.fid) report += `  FID: ${Math.round(metrics.fid)}ms\n`;
    if (metrics.cls) report += `  CLS: ${metrics.cls.toFixed(3)}\n`;
    
    report += '\nOther Metrics:\n';
    if (metrics.fcp) report += `  FCP: ${Math.round(metrics.fcp)}ms\n`;
    if (metrics.ttfb) report += `  TTFB: ${Math.round(metrics.ttfb)}ms\n`;
    if (metrics.pageLoadTime) report += `  Page Load: ${Math.round(metrics.pageLoadTime)}ms\n`;
    
    report += '\nBundle Sizes:\n';
    if (metrics.jsSize) report += `  JavaScript: ${Math.round(metrics.jsSize / 1024)}KB\n`;
    if (metrics.cssSize) report += `  CSS: ${Math.round(metrics.cssSize / 1024)}KB\n`;
    if (metrics.imageSize) report += `  Images: ${Math.round(metrics.imageSize / 1024)}KB\n`;
    if (metrics.totalSize) report += `  Total: ${Math.round(metrics.totalSize / 1024)}KB\n`;
    
    return report;
  }

  /**
   * Cleanup observers
   */
  disconnect() {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-generate report after page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      console.log(performanceMonitor.generateReport());
    }, 2000);
  });
}