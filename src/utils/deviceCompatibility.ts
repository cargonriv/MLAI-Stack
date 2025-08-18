/**
 * Device compatibility checker and browser support detection
 */

import { DeviceInfo } from './mlUtils';

export interface CompatibilityReport {
  isSupported: boolean;
  supportLevel: 'full' | 'partial' | 'minimal' | 'none';
  features: {
    webgl: boolean;
    webassembly: boolean;
    webworkers: boolean;
    indexeddb: boolean;
    serviceworker: boolean;
  };
  performance: {
    isLowEnd: boolean;
    memoryEstimate: number;
    cpuCores: number;
    estimatedSpeed: 'fast' | 'medium' | 'slow';
  };
  browser: {
    name: string;
    version: string;
    isSupported: boolean;
    limitations: string[];
  };
  recommendations: {
    device: 'webgl' | 'wasm' | 'cpu';
    modelSize: 'large' | 'medium' | 'small';
    batchSize: number;
    warnings: string[];
  };
}

export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  isSupported: boolean;
  limitations: string[];
}

export class DeviceCompatibilityChecker {
  private static instance: DeviceCompatibilityChecker;
  private compatibilityReport: CompatibilityReport | null = null;

  private constructor() {}

  static getInstance(): DeviceCompatibilityChecker {
    if (!DeviceCompatibilityChecker.instance) {
      DeviceCompatibilityChecker.instance = new DeviceCompatibilityChecker();
    }
    return DeviceCompatibilityChecker.instance;
  }

  /**
   * Perform comprehensive compatibility check
   */
  async checkCompatibility(): Promise<CompatibilityReport> {
    if (this.compatibilityReport) {
      return this.compatibilityReport;
    }

    console.log('Performing device compatibility check...');

    const features = await this.checkFeatureSupport();
    const performance = await this.assessPerformance();
    const browser = this.detectBrowser();
    const recommendations = this.generateRecommendations(features, performance, browser);

    const supportLevel = this.calculateSupportLevel(features, performance, browser);
    const isSupported = supportLevel !== 'none';

    this.compatibilityReport = {
      isSupported,
      supportLevel,
      features,
      performance,
      browser,
      recommendations
    };

    console.log('Compatibility check complete:', this.compatibilityReport);
    return this.compatibilityReport;
  }

  /**
   * Check browser and API feature support
   */
  private async checkFeatureSupport(): Promise<CompatibilityReport['features']> {
    const features = {
      webgl: false,
      webassembly: false,
      webworkers: false,
      indexeddb: false,
      serviceworker: false
    };

    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      features.webgl = !!gl;
      
      if (gl) {
        // Check for specific WebGL extensions needed for ML
        const extensions = [
          'OES_texture_float',
          'OES_texture_half_float',
          'WEBGL_color_buffer_float'
        ];
        
        const supportedExtensions = extensions.filter(ext => gl.getExtension(ext));
        console.log('WebGL extensions supported:', supportedExtensions);
      }
    } catch (error) {
      console.warn('WebGL check failed:', error);
      features.webgl = false;
    }

    // Check WebAssembly support
    try {
      features.webassembly = typeof WebAssembly === 'object' && 
                            typeof WebAssembly.instantiate === 'function';
      
      if (features.webassembly) {
        // Test basic WASM functionality
        const wasmCode = new Uint8Array([
          0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00
        ]);
        await WebAssembly.instantiate(wasmCode);
      }
    } catch (error) {
      console.warn('WebAssembly check failed:', error);
      features.webassembly = false;
    }

    // Check Web Workers support
    features.webworkers = typeof Worker !== 'undefined';

    // Check IndexedDB support
    features.indexeddb = 'indexedDB' in window;

    // Check Service Worker support
    features.serviceworker = 'serviceWorker' in navigator;

    return features;
  }

  /**
   * Assess device performance characteristics
   */
  private async assessPerformance(): Promise<CompatibilityReport['performance']> {
    const cpuCores = navigator.hardwareConcurrency || 1;
    let memoryEstimate = 0;
    let isLowEnd = false;
    let estimatedSpeed: 'fast' | 'medium' | 'slow' = 'medium';

    // Get memory information (Chrome only)
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      memoryEstimate = memInfo.jsHeapSizeLimit || 0;
    } else {
      // Estimate memory based on other factors
      memoryEstimate = this.estimateMemoryFromDevice();
    }

    // Perform CPU benchmark
    const cpuScore = await this.benchmarkCPU();
    
    // Determine if device is low-end
    const lowEndIndicators = [
      cpuCores <= 2,
      memoryEstimate < 2 * 1024 * 1024 * 1024, // Less than 2GB
      cpuScore < 100, // Low CPU benchmark score
      /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) && cpuCores <= 4
    ];

    isLowEnd = lowEndIndicators.filter(Boolean).length >= 2;

    // Estimate processing speed
    if (cpuScore > 200 && cpuCores >= 4 && memoryEstimate >= 4 * 1024 * 1024 * 1024) {
      estimatedSpeed = 'fast';
    } else if (cpuScore < 50 || cpuCores <= 2 || memoryEstimate < 1024 * 1024 * 1024) {
      estimatedSpeed = 'slow';
    }

    return {
      isLowEnd,
      memoryEstimate,
      cpuCores,
      estimatedSpeed
    };
  }

  /**
   * Estimate memory from device characteristics
   */
  private estimateMemoryFromDevice(): number {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Mobile devices typically have less memory
    if (/mobile|android|iphone|ipad/i.test(userAgent)) {
      if (/iphone|ipad/i.test(userAgent)) {
        // iOS devices - estimate based on model if possible
        return 3 * 1024 * 1024 * 1024; // 3GB estimate
      } else {
        // Android devices
        return 2 * 1024 * 1024 * 1024; // 2GB estimate
      }
    }

    // Desktop devices
    const cores = navigator.hardwareConcurrency || 1;
    if (cores >= 8) {
      return 8 * 1024 * 1024 * 1024; // 8GB estimate
    } else if (cores >= 4) {
      return 4 * 1024 * 1024 * 1024; // 4GB estimate
    } else {
      return 2 * 1024 * 1024 * 1024; // 2GB estimate
    }
  }

  /**
   * Simple CPU benchmark
   */
  private async benchmarkCPU(): Promise<number> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      let iterations = 0;
      const maxTime = 100; // 100ms benchmark
      
      const benchmark = () => {
        const batchStart = performance.now();
        
        // Perform some CPU-intensive calculations
        for (let i = 0; i < 10000; i++) {
          Math.sqrt(Math.random() * 1000);
          iterations++;
        }
        
        const elapsed = performance.now() - startTime;
        if (elapsed < maxTime) {
          setTimeout(benchmark, 0);
        } else {
          const score = Math.round(iterations / elapsed * 1000); // Operations per second
          resolve(score);
        }
      };
      
      benchmark();
    });
  }

  /**
   * Detect browser information
   */
  private detectBrowser(): BrowserInfo {
    const userAgent = navigator.userAgent;
    const limitations: string[] = [];
    let name = 'Unknown';
    let version = 'Unknown';
    let engine = 'Unknown';
    let isSupported = true;

    // Chrome
    if (/Chrome\/(\d+)/.test(userAgent) && !/Edge|Edg/.test(userAgent)) {
      name = 'Chrome';
      version = RegExp.$1;
      engine = 'Blink';
      
      if (parseInt(version) < 80) {
        isSupported = false;
        limitations.push('Chrome version too old (minimum: 80)');
      }
    }
    // Firefox
    else if (/Firefox\/(\d+)/.test(userAgent)) {
      name = 'Firefox';
      version = RegExp.$1;
      engine = 'Gecko';
      
      if (parseInt(version) < 78) {
        isSupported = false;
        limitations.push('Firefox version too old (minimum: 78)');
      }
      
      limitations.push('WebGL performance may be limited');
    }
    // Safari
    else if (/Safari\/(\d+)/.test(userAgent) && !/Chrome/.test(userAgent)) {
      name = 'Safari';
      engine = 'WebKit';
      
      // Extract Safari version from Version/ string
      if (/Version\/(\d+)/.test(userAgent)) {
        version = RegExp.$1;
        
        if (parseInt(version) < 14) {
          isSupported = false;
          limitations.push('Safari version too old (minimum: 14)');
        }
      }
      
      limitations.push('WebAssembly performance may be limited');
      limitations.push('Some WebGL features may not be available');
    }
    // Edge
    else if (/Edg\/(\d+)/.test(userAgent)) {
      name = 'Edge';
      version = RegExp.$1;
      engine = 'Blink';
      
      if (parseInt(version) < 80) {
        isSupported = false;
        limitations.push('Edge version too old (minimum: 80)');
      }
    }
    // Unsupported browsers
    else {
      isSupported = false;
      limitations.push('Unsupported browser');
    }

    // Mobile browser limitations
    if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
      limitations.push('Mobile performance may be limited');
      limitations.push('Large models may cause memory issues');
    }

    return {
      name,
      version,
      engine,
      isSupported,
      limitations
    };
  }

  /**
   * Calculate overall support level
   */
  private calculateSupportLevel(
    features: CompatibilityReport['features'],
    performance: CompatibilityReport['performance'],
    browser: BrowserInfo
  ): CompatibilityReport['supportLevel'] {
    if (!browser.isSupported) {
      return 'none';
    }

    const featureScore = Object.values(features).filter(Boolean).length;
    const maxFeatures = Object.keys(features).length;

    if (featureScore === maxFeatures && !performance.isLowEnd) {
      return 'full';
    } else if (featureScore >= maxFeatures * 0.8 && performance.estimatedSpeed !== 'slow') {
      return 'partial';
    } else if (features.webassembly || features.webgl) {
      return 'minimal';
    } else {
      return 'none';
    }
  }

  /**
   * Generate recommendations based on compatibility
   */
  private generateRecommendations(
    features: CompatibilityReport['features'],
    performance: CompatibilityReport['performance'],
    browser: BrowserInfo
  ): CompatibilityReport['recommendations'] {
    const warnings: string[] = [];
    let device: 'webgl' | 'wasm' | 'cpu' = 'cpu';
    let modelSize: 'large' | 'medium' | 'small' = 'medium';
    let batchSize = 1;

    // Device recommendation
    if (features.webgl && performance.estimatedSpeed !== 'slow') {
      device = 'webgl';
      batchSize = 4;
    } else if (features.webassembly) {
      device = 'wasm';
      batchSize = 2;
    } else {
      device = 'cpu';
      warnings.push('Limited to CPU processing - performance may be slow');
    }

    // Model size recommendation
    if (performance.isLowEnd || performance.memoryEstimate < 2 * 1024 * 1024 * 1024) {
      modelSize = 'small';
      warnings.push('Using smaller models due to memory constraints');
    } else if (performance.estimatedSpeed === 'fast' && performance.memoryEstimate >= 4 * 1024 * 1024 * 1024) {
      modelSize = 'large';
    }

    // Browser-specific warnings
    warnings.push(...browser.limitations);

    // Performance warnings
    if (performance.isLowEnd) {
      warnings.push('Device performance is limited - expect slower processing');
    }

    if (performance.cpuCores <= 2) {
      warnings.push('Limited CPU cores - consider reducing batch size');
      batchSize = Math.max(1, Math.floor(batchSize / 2));
    }

    return {
      device,
      modelSize,
      batchSize,
      warnings
    };
  }

  /**
   * Get cached compatibility report
   */
  getCompatibilityReport(): CompatibilityReport | null {
    return this.compatibilityReport;
  }

  /**
   * Clear cached compatibility report
   */
  clearCache(): void {
    this.compatibilityReport = null;
  }

  /**
   * Check if specific feature is supported
   */
  async isFeatureSupported(feature: keyof CompatibilityReport['features']): Promise<boolean> {
    const report = await this.checkCompatibility();
    return report.features[feature];
  }

  /**
   * Get performance tier
   */
  async getPerformanceTier(): Promise<'high' | 'medium' | 'low'> {
    const report = await this.checkCompatibility();
    
    if (report.performance.estimatedSpeed === 'fast' && !report.performance.isLowEnd) {
      return 'high';
    } else if (report.performance.estimatedSpeed === 'slow' || report.performance.isLowEnd) {
      return 'low';
    } else {
      return 'medium';
    }
  }

  /**
   * Get recommended model configuration
   */
  async getRecommendedConfig(): Promise<{
    device: string;
    quantized: boolean;
    batchSize: number;
    timeout: number;
  }> {
    const report = await this.checkCompatibility();
    
    return {
      device: report.recommendations.device,
      quantized: report.recommendations.modelSize !== 'large',
      batchSize: report.recommendations.batchSize,
      timeout: report.performance.isLowEnd ? 120000 : 60000 // 2 minutes for low-end devices
    };
  }
}

// Export singleton instance
export const deviceCompatibility = DeviceCompatibilityChecker.getInstance();

export default DeviceCompatibilityChecker;