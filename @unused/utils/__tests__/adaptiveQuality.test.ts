/**
 * Tests for Adaptive Quality utilities
 */

import { adaptiveQuality, QualitySettings } from '../adaptiveQuality';
import { deviceDetection } from '../deviceDetection';

// Mock device detection
jest.mock('../deviceDetection');

const mockDeviceDetection = deviceDetection as jest.Mocked<typeof deviceDetection>;

describe('Adaptive Quality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    adaptiveQuality.clearCache();
  });

  describe('getOptimalSettings', () => {
    it('should return high quality settings for high-end desktop', async () => {
      mockDeviceDetection.getDeviceCapabilities.mockResolvedValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        hasTouch: false,
        screenSize: 'large',
        memoryGB: 16,
        cores: 8,
        webglSupported: true,
        wasmSupported: true,
        performanceLevel: 'high'
      });

      mockDeviceDetection.getNetworkCapabilities.mockResolvedValue({
        effectiveType: '4g',
        downlink: 20,
        rtt: 50,
        saveData: false,
        isOnline: true,
        bandwidth: 'high'
      });

      const settings = await adaptiveQuality.getOptimalSettings('sentiment');

      expect(settings.modelVariant).toBe('full');
      expect(settings.precision).toBe('fp32');
      expect(settings.qualityLevel).toBe('high');
      expect(settings.cacheStrategy).toBe('aggressive');
      expect(settings.useWebGL).toBe(true);
      expect(settings.useWebAssembly).toBe(true);
    });

    it('should return mobile-optimized settings for mobile device', async () => {
      mockDeviceDetection.getDeviceCapabilities.mockResolvedValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        hasTouch: true,
        screenSize: 'small',
        memoryGB: 4,
        cores: 4,
        webglSupported: true,
        wasmSupported: true,
        performanceLevel: 'medium'
      });

      mockDeviceDetection.getNetworkCapabilities.mockResolvedValue({
        effectiveType: '3g',
        downlink: 2,
        rtt: 200,
        saveData: false,
        isOnline: true,
        bandwidth: 'medium'
      });

      const settings = await adaptiveQuality.getOptimalSettings('sentiment');

      expect(settings.modelVariant).toBe('distilled');
      expect(settings.precision).toBe('fp16');
      expect(settings.qualityLevel).toBe('medium');
      expect(settings.maxInputLength).toBeLessThanOrEqual(256);
      expect(settings.batchSize).toBe(1);
      expect(settings.processingTimeout).toBeLessThanOrEqual(8000);
    });

    it('should return low-end settings for low-performance device', async () => {
      mockDeviceDetection.getDeviceCapabilities.mockResolvedValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        hasTouch: true,
        screenSize: 'small',
        memoryGB: 2,
        cores: 2,
        webglSupported: false,
        wasmSupported: true,
        performanceLevel: 'low'
      });

      mockDeviceDetection.getNetworkCapabilities.mockResolvedValue({
        effectiveType: '2g',
        downlink: 0.5,
        rtt: 500,
        saveData: true,
        isOnline: true,
        bandwidth: 'low'
      });

      const settings = await adaptiveQuality.getOptimalSettings('sentiment');

      expect(settings.modelVariant).toBe('mobile');
      expect(settings.precision).toBe('int8');
      expect(settings.qualityLevel).toBe('low');
      expect(settings.cacheStrategy).toBe('minimal');
      expect(settings.batchSize).toBe(1);
      expect(settings.enableOptimizations).toBe(true);
    });

    it('should adjust for low memory devices', async () => {
      mockDeviceDetection.getDeviceCapabilities.mockResolvedValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        hasTouch: false,
        screenSize: 'large',
        memoryGB: 3, // Low memory
        cores: 4,
        webglSupported: true,
        wasmSupported: true,
        performanceLevel: 'medium'
      });

      mockDeviceDetection.getNetworkCapabilities.mockResolvedValue({
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
        isOnline: true,
        bandwidth: 'high'
      });

      const settings = await adaptiveQuality.getOptimalSettings('sentiment');

      expect(settings.modelVariant).toBe('mobile');
      expect(settings.cacheStrategy).toBe('minimal');
      expect(settings.batchSize).toBe(1);
    });

    it('should adjust for slow network conditions', async () => {
      mockDeviceDetection.getDeviceCapabilities.mockResolvedValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        hasTouch: false,
        screenSize: 'large',
        memoryGB: 8,
        cores: 4,
        webglSupported: true,
        wasmSupported: true,
        performanceLevel: 'high'
      });

      mockDeviceDetection.getNetworkCapabilities.mockResolvedValue({
        effectiveType: '2g',
        downlink: 0.3,
        rtt: 800,
        saveData: true,
        isOnline: true,
        bandwidth: 'low'
      });

      const settings = await adaptiveQuality.getOptimalSettings('sentiment');

      expect(settings.modelVariant).toBe('quantized'); // Smaller model for slow network
      expect(settings.cacheStrategy).toBe('aggressive');
      expect(settings.processingTimeout).toBeGreaterThan(10000);
    });

    it('should consider battery level for mobile devices', async () => {
      mockDeviceDetection.getDeviceCapabilities.mockResolvedValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        hasTouch: true,
        screenSize: 'small',
        memoryGB: 6,
        cores: 6,
        webglSupported: true,
        wasmSupported: true,
        performanceLevel: 'high',
        batteryLevel: 0.15, // Low battery
        isCharging: false
      });

      mockDeviceDetection.getNetworkCapabilities.mockResolvedValue({
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
        isOnline: true,
        bandwidth: 'high'
      });

      const settings = await adaptiveQuality.getOptimalSettings('sentiment');

      expect(settings.modelVariant).toBe('mobile');
      expect(settings.enableOptimizations).toBe(true);
      expect(settings.qualityLevel).toBe('low');
    });
  });

  describe('Model-specific adjustments', () => {
    it('should apply sentiment-specific optimizations', async () => {
      mockDeviceDetection.getDeviceCapabilities.mockResolvedValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        hasTouch: true,
        screenSize: 'small',
        memoryGB: 3,
        cores: 4,
        webglSupported: true,
        wasmSupported: true,
        performanceLevel: 'low'
      });

      mockDeviceDetection.getNetworkCapabilities.mockResolvedValue({
        effectiveType: '3g',
        downlink: 2,
        rtt: 200,
        saveData: false,
        isOnline: true,
        bandwidth: 'medium'
      });

      const settings = await adaptiveQuality.getOptimalSettings('sentiment');

      expect(settings.maxInputLength).toBe(128); // Reduced for low-end mobile
      expect(settings.useWebGL).toBe(false); // CPU-intensive task prefers WASM
    });

    it('should apply recommendation-specific optimizations', async () => {
      mockDeviceDetection.getDeviceCapabilities.mockResolvedValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        hasTouch: false,
        screenSize: 'large',
        memoryGB: 16,
        cores: 8,
        webglSupported: true,
        wasmSupported: true,
        performanceLevel: 'high'
      });

      mockDeviceDetection.getNetworkCapabilities.mockResolvedValue({
        effectiveType: '4g',
        downlink: 20,
        rtt: 50,
        saveData: false,
        isOnline: true,
        bandwidth: 'high'
      });

      const settings = await adaptiveQuality.getOptimalSettings('recommendation');

      expect(settings.batchSize).toBeGreaterThan(10); // Can handle larger batches
    });

    it('should apply image classification optimizations', async () => {
      mockDeviceDetection.getDeviceCapabilities.mockResolvedValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        hasTouch: false,
        screenSize: 'large',
        memoryGB: 8,
        cores: 6,
        webglSupported: true,
        wasmSupported: true,
        performanceLevel: 'medium'
      });

      mockDeviceDetection.getNetworkCapabilities.mockResolvedValue({
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
        isOnline: true,
        bandwidth: 'high'
      });

      const settings = await adaptiveQuality.getOptimalSettings('imageClassification');

      expect(settings.useWebGL).toBe(true); // Benefits from GPU acceleration
      expect(settings.precision).toBe('fp16'); // Good balance for images
    });
  });

  describe('Settings management', () => {
    it('should cache settings correctly', async () => {
      mockDeviceDetection.getDeviceCapabilities.mockResolvedValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        hasTouch: false,
        screenSize: 'large',
        memoryGB: 8,
        cores: 4,
        webglSupported: true,
        wasmSupported: true,
        performanceLevel: 'high'
      });

      mockDeviceDetection.getNetworkCapabilities.mockResolvedValue({
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
        isOnline: true,
        bandwidth: 'high'
      });

      // First call
      const settings1 = await adaptiveQuality.getOptimalSettings('sentiment');
      
      // Second call should use cache
      const settings2 = await adaptiveQuality.getOptimalSettings('sentiment');

      expect(settings1).toBe(settings2);
      expect(mockDeviceDetection.getDeviceCapabilities).toHaveBeenCalledTimes(1);
    });

    it('should update settings manually', async () => {
      mockDeviceDetection.getDeviceCapabilities.mockResolvedValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        hasTouch: false,
        screenSize: 'large',
        memoryGB: 8,
        cores: 4,
        webglSupported: true,
        wasmSupported: true,
        performanceLevel: 'high'
      });

      mockDeviceDetection.getNetworkCapabilities.mockResolvedValue({
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
        isOnline: true,
        bandwidth: 'high'
      });

      await adaptiveQuality.getOptimalSettings('sentiment');
      
      adaptiveQuality.updateSettings('sentiment', {
        modelVariant: 'mobile',
        qualityLevel: 'low'
      });

      const allSettings = adaptiveQuality.getAllSettings();
      const sentimentSettings = allSettings.get('sentiment');

      expect(sentimentSettings?.modelVariant).toBe('mobile');
      expect(sentimentSettings?.qualityLevel).toBe('low');
    });

    it('should reset to optimal settings', async () => {
      mockDeviceDetection.getDeviceCapabilities.mockResolvedValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        hasTouch: false,
        screenSize: 'large',
        memoryGB: 8,
        cores: 4,
        webglSupported: true,
        wasmSupported: true,
        performanceLevel: 'high'
      });

      mockDeviceDetection.getNetworkCapabilities.mockResolvedValue({
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
        isOnline: true,
        bandwidth: 'high'
      });

      // Get initial settings
      const initialSettings = await adaptiveQuality.getOptimalSettings('sentiment');
      
      // Update manually
      adaptiveQuality.updateSettings('sentiment', {
        modelVariant: 'mobile'
      });

      // Reset to optimal
      const resetSettings = await adaptiveQuality.resetToOptimal('sentiment');

      expect(resetSettings.modelVariant).toBe(initialSettings.modelVariant);
    });
  });

  describe('Performance estimation', () => {
    it('should provide accurate performance estimates', async () => {
      mockDeviceDetection.getDeviceCapabilities.mockResolvedValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        hasTouch: false,
        screenSize: 'large',
        memoryGB: 8,
        cores: 4,
        webglSupported: true,
        wasmSupported: true,
        performanceLevel: 'high'
      });

      mockDeviceDetection.getNetworkCapabilities.mockResolvedValue({
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
        isOnline: true,
        bandwidth: 'high'
      });

      const settings = await adaptiveQuality.getOptimalSettings('sentiment');
      const estimate = adaptiveQuality.getPerformanceEstimate('sentiment', settings);

      expect(estimate.estimatedLoadTime).toBeGreaterThan(0);
      expect(estimate.estimatedInferenceTime).toBeGreaterThan(0);
      expect(estimate.estimatedAccuracy).toBeGreaterThan(0);
      expect(estimate.memoryUsage).toBeGreaterThan(0);
      expect(estimate.qualityScore).toBeGreaterThan(0);
      expect(estimate.qualityScore).toBeLessThanOrEqual(100);
    });

    it('should calculate quality score correctly', async () => {
      mockDeviceDetection.getDeviceCapabilities.mockResolvedValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        hasTouch: false,
        screenSize: 'large',
        memoryGB: 16,
        cores: 8,
        webglSupported: true,
        wasmSupported: true,
        performanceLevel: 'high'
      });

      mockDeviceDetection.getNetworkCapabilities.mockResolvedValue({
        effectiveType: '4g',
        downlink: 20,
        rtt: 50,
        saveData: false,
        isOnline: true,
        bandwidth: 'high'
      });

      const highQualitySettings = await adaptiveQuality.getOptimalSettings('sentiment');
      const highQualityEstimate = adaptiveQuality.getPerformanceEstimate('sentiment', highQualitySettings);

      // Low quality settings
      const lowQualitySettings: QualitySettings = {
        modelVariant: 'mobile',
        maxInputLength: 128,
        batchSize: 1,
        precision: 'int8',
        enableOptimizations: false,
        useWebGL: false,
        useWebAssembly: false,
        cacheStrategy: 'minimal',
        processingTimeout: 5000,
        qualityLevel: 'low'
      };

      const lowQualityEstimate = adaptiveQuality.getPerformanceEstimate('sentiment', lowQualitySettings);

      expect(highQualityEstimate.qualityScore).toBeGreaterThan(lowQualityEstimate.qualityScore);
    });
  });
});