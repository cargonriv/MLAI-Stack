/**
 * Device Detection and Capability Assessment
 * Provides utilities for detecting device capabilities and optimizing ML model loading
 */

export interface DeviceCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  screenSize: 'small' | 'medium' | 'large';
  memoryGB: number | null;
  cores: number;
  webglSupported: boolean;
  wasmSupported: boolean;
  performanceLevel: 'low' | 'medium' | 'high';
  batteryLevel?: number;
  isCharging?: boolean;
}

export interface NetworkCapabilities {
  effectiveType: '2g' | '3g' | '4g' | 'unknown';
  downlink: number; // Mbps
  rtt: number; // ms
  saveData: boolean;
  isOnline: boolean;
  bandwidth: 'low' | 'medium' | 'high';
}

class DeviceDetectionService {
  private capabilities: DeviceCapabilities | null = null;
  private networkInfo: NetworkCapabilities | null = null;

  async getDeviceCapabilities(): Promise<DeviceCapabilities> {
    if (this.capabilities) {
      return this.capabilities;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
    const isDesktop = !isMobile && !isTablet;

    // Screen size detection
    const screenWidth = window.screen.width;
    let screenSize: 'small' | 'medium' | 'large' = 'medium';
    if (screenWidth < 768) screenSize = 'small';
    else if (screenWidth > 1200) screenSize = 'large';

    // Memory detection (if available)
    let memoryGB: number | null = null;
    if ('memory' in navigator) {
      memoryGB = (navigator as any).memory.jsHeapSizeLimit / (1024 * 1024 * 1024);
    }

    // Hardware concurrency
    const cores = navigator.hardwareConcurrency || 4;

    // WebGL support
    const webglSupported = this.checkWebGLSupport();

    // WebAssembly support
    const wasmSupported = typeof WebAssembly === 'object';

    // Performance level estimation
    const performanceLevel = this.estimatePerformanceLevel(cores, memoryGB, isMobile);

    // Battery API (if available)
    let batteryLevel: number | undefined;
    let isCharging: boolean | undefined;
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        batteryLevel = battery.level;
        isCharging = battery.charging;
      }
    } catch (error) {
      // Battery API not available or blocked
    }

    this.capabilities = {
      isMobile,
      isTablet,
      isDesktop,
      hasTouch: 'ontouchstart' in window,
      screenSize,
      memoryGB,
      cores,
      webglSupported,
      wasmSupported,
      performanceLevel,
      batteryLevel,
      isCharging
    };

    return this.capabilities;
  }

  async getNetworkCapabilities(): Promise<NetworkCapabilities> {
    if (this.networkInfo) {
      return this.networkInfo;
    }

    let effectiveType: '2g' | '3g' | '4g' | 'unknown' = 'unknown';
    let downlink = 10; // Default to 10 Mbps
    let rtt = 100; // Default to 100ms
    let saveData = false;

    // Network Information API (if available)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      effectiveType = connection.effectiveType || 'unknown';
      downlink = connection.downlink || 10;
      rtt = connection.rtt || 100;
      saveData = connection.saveData || false;
    }

    // Bandwidth classification
    let bandwidth: 'low' | 'medium' | 'high' = 'medium';
    if (downlink < 1.5 || effectiveType === '2g') bandwidth = 'low';
    else if (downlink > 10 || effectiveType === '4g') bandwidth = 'high';

    this.networkInfo = {
      effectiveType,
      downlink,
      rtt,
      saveData,
      isOnline: navigator.onLine,
      bandwidth
    };

    return this.networkInfo;
  }

  private checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (error) {
      return false;
    }
  }

  private estimatePerformanceLevel(
    cores: number, 
    memoryGB: number | null, 
    isMobile: boolean
  ): 'low' | 'medium' | 'high' {
    if (isMobile) {
      // Mobile devices generally have lower performance
      if (cores <= 4 && (memoryGB === null || memoryGB < 4)) return 'low';
      if (cores <= 6 && (memoryGB === null || memoryGB < 6)) return 'medium';
      return 'high';
    } else {
      // Desktop devices
      if (cores <= 2 && (memoryGB === null || memoryGB < 4)) return 'low';
      if (cores <= 4 && (memoryGB === null || memoryGB < 8)) return 'medium';
      return 'high';
    }
  }

  // Reset cached capabilities (useful for testing or when conditions change)
  reset(): void {
    this.capabilities = null;
    this.networkInfo = null;
  }

  // Listen for network changes
  onNetworkChange(callback: (networkInfo: NetworkCapabilities) => void): () => void {
    const updateNetworkInfo = async () => {
      this.networkInfo = null; // Reset cache
      const networkInfo = await this.getNetworkCapabilities();
      callback(networkInfo);
    };

    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);

    // Network Information API change events
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', updateNetworkInfo);
    }

    // Return cleanup function
    return () => {
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }
}

export const deviceDetection = new DeviceDetectionService();

// Utility functions for common checks
export const isMobileDevice = async (): Promise<boolean> => {
  const capabilities = await deviceDetection.getDeviceCapabilities();
  return capabilities.isMobile;
};

export const isLowEndDevice = async (): Promise<boolean> => {
  const capabilities = await deviceDetection.getDeviceCapabilities();
  return capabilities.performanceLevel === 'low';
};

export const hasSlowNetwork = async (): Promise<boolean> => {
  const network = await deviceDetection.getNetworkCapabilities();
  return network.bandwidth === 'low' || network.saveData;
};

export const shouldUseProgressiveLoading = async (): Promise<boolean> => {
  const [isLowEnd, hasSlowNet] = await Promise.all([
    isLowEndDevice(),
    hasSlowNetwork()
  ]);
  return isLowEnd || hasSlowNet;
};