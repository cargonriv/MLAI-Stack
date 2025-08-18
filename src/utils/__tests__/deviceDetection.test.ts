/**
 * Tests for Device Detection utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deviceDetection, isMobileDevice, isLowEndDevice, hasSlowNetwork, shouldUseProgressiveLoading } from '../deviceDetection';

// Mock navigator properties
const mockNavigator = {
  userAgent: '',
  hardwareConcurrency: 4,
  onLine: true,
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: false
  }
};

// Mock screen properties
const mockScreen = {
  width: 1920,
  height: 1080
};

// Mock window properties
const mockWindow = {
  screen: mockScreen
};

describe('Device Detection', () => {
  beforeEach(() => {
    // Reset device detection cache
    deviceDetection.reset();
    
    // Mock global objects
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true
    });
    
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true
    });
    
    Object.defineProperty(global, 'WebAssembly', {
      value: { compile: vi.fn() },
      writable: true
    });
  });

  describe('getDeviceCapabilities', () => {
    it('should detect desktop device correctly', async () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      
      const capabilities = await deviceDetection.getDeviceCapabilities();
      
      expect(capabilities.isMobile).toBe(false);
      expect(capabilities.isTablet).toBe(false);
      expect(capabilities.isDesktop).toBe(true);
      expect(capabilities.screenSize).toBe('large');
      expect(capabilities.cores).toBe(4);
      expect(capabilities.wasmSupported).toBe(true);
    });

    it('should detect mobile device correctly', async () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      mockScreen.width = 375;
      
      const capabilities = await deviceDetection.getDeviceCapabilities();
      
      expect(capabilities.isMobile).toBe(true);
      expect(capabilities.isTablet).toBe(false);
      expect(capabilities.isDesktop).toBe(false);
      expect(capabilities.screenSize).toBe('small');
    });

    it('should detect tablet device correctly', async () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)';
      mockScreen.width = 768;
      
      const capabilities = await deviceDetection.getDeviceCapabilities();
      
      expect(capabilities.isMobile).toBe(false);
      expect(capabilities.isTablet).toBe(true);
      expect(capabilities.isDesktop).toBe(false);
      expect(capabilities.screenSize).toBe('medium');
    });

    it('should estimate performance level correctly', async () => {
      // High-end desktop
      mockNavigator.hardwareConcurrency = 8;
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      
      const capabilities = await deviceDetection.getDeviceCapabilities();
      expect(capabilities.performanceLevel).toBe('high');
    });

    it('should detect low-end mobile device', async () => {
      mockNavigator.hardwareConcurrency = 2;
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X)';
      
      const capabilities = await deviceDetection.getDeviceCapabilities();
      expect(capabilities.performanceLevel).toBe('low');
    });
  });

  describe('getNetworkCapabilities', () => {
    it('should detect fast network correctly', async () => {
      mockNavigator.connection.effectiveType = '4g';
      mockNavigator.connection.downlink = 15;
      mockNavigator.connection.rtt = 50;
      
      const network = await deviceDetection.getNetworkCapabilities();
      
      expect(network.effectiveType).toBe('4g');
      expect(network.downlink).toBe(15);
      expect(network.bandwidth).toBe('high');
      expect(network.isOnline).toBe(true);
    });

    it('should detect slow network correctly', async () => {
      mockNavigator.connection.effectiveType = '2g';
      mockNavigator.connection.downlink = 0.5;
      mockNavigator.connection.rtt = 500;
      
      const network = await deviceDetection.getNetworkCapabilities();
      
      expect(network.effectiveType).toBe('2g');
      expect(network.bandwidth).toBe('low');
    });

    it('should handle save-data preference', async () => {
      mockNavigator.connection.saveData = true;
      
      const network = await deviceDetection.getNetworkCapabilities();
      
      expect(network.saveData).toBe(true);
    });

    it('should handle offline status', async () => {
      mockNavigator.onLine = false;
      
      const network = await deviceDetection.getNetworkCapabilities();
      
      expect(network.isOnline).toBe(false);
    });
  });

  describe('Utility functions', () => {
    it('should correctly identify mobile device', async () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      
      const isMobile = await isMobileDevice();
      expect(isMobile).toBe(true);
    });

    it('should correctly identify low-end device', async () => {
      mockNavigator.hardwareConcurrency = 2;
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X)';
      
      const isLowEnd = await isLowEndDevice();
      expect(isLowEnd).toBe(true);
    });

    it('should correctly identify slow network', async () => {
      mockNavigator.connection.effectiveType = '2g';
      mockNavigator.connection.downlink = 0.5;
      
      const slowNetwork = await hasSlowNetwork();
      expect(slowNetwork).toBe(true);
    });

    it('should recommend progressive loading for low-end devices', async () => {
      mockNavigator.hardwareConcurrency = 2;
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X)';
      mockNavigator.connection.effectiveType = '2g';
      
      const shouldUseProgressive = await shouldUseProgressiveLoading();
      expect(shouldUseProgressive).toBe(true);
    });

    it('should not recommend progressive loading for high-end devices', async () => {
      mockNavigator.hardwareConcurrency = 8;
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      mockNavigator.connection.effectiveType = '4g';
      mockNavigator.connection.downlink = 20;
      
      const shouldUseProgressive = await shouldUseProgressiveLoading();
      expect(shouldUseProgressive).toBe(false);
    });
  });

  describe('Network change monitoring', () => {
    it('should call callback on network change', async () => {
      const callback = vi.fn();
      const cleanup = deviceDetection.onNetworkChange(callback);
      
      // Simulate network change
      const event = new Event('online');
      window.dispatchEvent(event);
      
      // Wait for async callback
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(callback).toHaveBeenCalled();
      
      cleanup();
    });
  });

  describe('WebGL support detection', () => {
    it('should detect WebGL support', async () => {
      // Mock canvas and WebGL context
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue({})
      };
      
      Object.defineProperty(global.document, 'createElement', {
        value: vi.fn().mockReturnValue(mockCanvas),
        writable: true
      });
      
      const capabilities = await deviceDetection.getDeviceCapabilities();
      expect(capabilities.webglSupported).toBe(true);
    });

    it('should handle WebGL not supported', async () => {
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(null)
      };
      
      Object.defineProperty(global.document, 'createElement', {
        value: vi.fn().mockReturnValue(mockCanvas),
        writable: true
      });
      
      const capabilities = await deviceDetection.getDeviceCapabilities();
      expect(capabilities.webglSupported).toBe(false);
    });
  });

  describe('Battery API integration', () => {
    it('should handle battery information when available', async () => {
      const mockBattery = {
        level: 0.8,
        charging: false
      };
      
      mockNavigator.getBattery = vi.fn().mockResolvedValue(mockBattery);
      
      const capabilities = await deviceDetection.getDeviceCapabilities();
      
      expect(capabilities.batteryLevel).toBe(0.8);
      expect(capabilities.isCharging).toBe(false);
    });

    it('should handle battery API not available', async () => {
      delete mockNavigator.getBattery;
      
      const capabilities = await deviceDetection.getDeviceCapabilities();
      
      expect(capabilities.batteryLevel).toBeUndefined();
      expect(capabilities.isCharging).toBeUndefined();
    });
  });
});