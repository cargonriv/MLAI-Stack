/**
 * Adaptive Quality Settings
 * Automatically adjusts model quality and processing parameters based on device capabilities
 */

import { DeviceCapabilities, NetworkCapabilities, deviceDetection } from './deviceDetection';

export interface QualitySettings {
  modelVariant: 'full' | 'quantized' | 'distilled' | 'mobile';
  maxInputLength: number;
  batchSize: number;
  precision: 'fp32' | 'fp16' | 'int8';
  enableOptimizations: boolean;
  useWebGL: boolean;
  useWebAssembly: boolean;
  cacheStrategy: 'aggressive' | 'moderate' | 'minimal';
  processingTimeout: number;
  qualityLevel: 'high' | 'medium' | 'low';
}

export interface ModelVariants {
  full: {
    size: number;
    accuracy: number;
    speed: number;
    memoryRequirement: number;
  };
  quantized: {
    size: number;
    accuracy: number;
    speed: number;
    memoryRequirement: number;
  };
  distilled: {
    size: number;
    accuracy: number;
    speed: number;
    memoryRequirement: number;
  };
  mobile: {
    size: number;
    accuracy: number;
    speed: number;
    memoryRequirement: number;
  };
}

export interface AdaptiveConfig {
  sentiment: {
    variants: ModelVariants;
    defaultSettings: QualitySettings;
  };
  recommendation: {
    variants: ModelVariants;
    defaultSettings: QualitySettings;
  };
  imageClassification: {
    variants: ModelVariants;
    defaultSettings: QualitySettings;
  };
}

class AdaptiveQualityService {
  private currentSettings = new Map<string, QualitySettings>();
  private modelConfigs: AdaptiveConfig;

  constructor() {
    this.modelConfigs = {
      sentiment: {
        variants: {
          full: { size: 440, accuracy: 0.95, speed: 0.3, memoryRequirement: 1000 },
          quantized: { size: 110, accuracy: 0.93, speed: 0.5, memoryRequirement: 500 },
          distilled: { size: 67, accuracy: 0.91, speed: 0.8, memoryRequirement: 300 },
          mobile: { size: 25, accuracy: 0.87, speed: 1.2, memoryRequirement: 150 }
        },
        defaultSettings: {
          modelVariant: 'distilled',
          maxInputLength: 512,
          batchSize: 1,
          precision: 'fp32',
          enableOptimizations: true,
          useWebGL: true,
          useWebAssembly: true,
          cacheStrategy: 'moderate',
          processingTimeout: 10000,
          qualityLevel: 'medium'
        }
      },
      recommendation: {
        variants: {
          full: { size: 50, accuracy: 0.92, speed: 0.4, memoryRequirement: 200 },
          quantized: { size: 25, accuracy: 0.90, speed: 0.6, memoryRequirement: 100 },
          distilled: { size: 15, accuracy: 0.87, speed: 0.8, memoryRequirement: 75 },
          mobile: { size: 8, accuracy: 0.82, speed: 1.0, memoryRequirement: 50 }
        },
        defaultSettings: {
          modelVariant: 'full',
          maxInputLength: 1000,
          batchSize: 10,
          precision: 'fp32',
          enableOptimizations: true,
          useWebGL: false,
          useWebAssembly: true,
          cacheStrategy: 'aggressive',
          processingTimeout: 5000,
          qualityLevel: 'high'
        }
      },
      imageClassification: {
        variants: {
          full: { size: 200, accuracy: 0.94, speed: 0.2, memoryRequirement: 800 },
          quantized: { size: 100, accuracy: 0.92, speed: 0.4, memoryRequirement: 400 },
          distilled: { size: 60, accuracy: 0.89, speed: 0.6, memoryRequirement: 250 },
          mobile: { size: 30, accuracy: 0.84, speed: 0.8, memoryRequirement: 150 }
        },
        defaultSettings: {
          modelVariant: 'quantized',
          maxInputLength: 224,
          batchSize: 1,
          precision: 'fp16',
          enableOptimizations: true,
          useWebGL: true,
          useWebAssembly: true,
          cacheStrategy: 'moderate',
          processingTimeout: 15000,
          qualityLevel: 'medium'
        }
      }
    };
  }

  async getOptimalSettings(modelType: keyof AdaptiveConfig): Promise<QualitySettings> {
    const cacheKey = modelType;
    
    // Return cached settings if available
    if (this.currentSettings.has(cacheKey)) {
      return this.currentSettings.get(cacheKey)!;
    }

    // Get device and network capabilities
    const [deviceCaps, networkCaps] = await Promise.all([
      deviceDetection.getDeviceCapabilities(),
      deviceDetection.getNetworkCapabilities()
    ]);

    // Calculate optimal settings
    const settings = this.calculateOptimalSettings(modelType, deviceCaps, networkCaps);
    
    // Cache the settings
    this.currentSettings.set(cacheKey, settings);
    
    return settings;
  }

  private calculateOptimalSettings(
    modelType: keyof AdaptiveConfig,
    deviceCaps: DeviceCapabilities,
    networkCaps: NetworkCapabilities
  ): QualitySettings {
    const config = this.modelConfigs[modelType];
    const baseSettings = { ...config.defaultSettings };

    // Adjust based on device performance level
    switch (deviceCaps.performanceLevel) {
      case 'low':
        baseSettings.modelVariant = 'mobile';
        baseSettings.precision = 'int8';
        baseSettings.batchSize = 1;
        baseSettings.enableOptimizations = true;
        baseSettings.cacheStrategy = 'minimal';
        baseSettings.processingTimeout *= 2;
        baseSettings.qualityLevel = 'low';
        break;
        
      case 'medium':
        baseSettings.modelVariant = deviceCaps.isMobile ? 'distilled' : 'quantized';
        baseSettings.precision = 'fp16';
        baseSettings.enableOptimizations = true;
        baseSettings.cacheStrategy = 'moderate';
        baseSettings.qualityLevel = 'medium';
        break;
        
      case 'high':
        baseSettings.modelVariant = 'full';
        baseSettings.precision = 'fp32';
        baseSettings.batchSize = Math.min(baseSettings.batchSize * 2, 10);
        baseSettings.cacheStrategy = 'aggressive';
        baseSettings.qualityLevel = 'high';
        break;
    }

    // Adjust based on memory constraints
    if (deviceCaps.memoryGB && deviceCaps.memoryGB < 4) {
      baseSettings.modelVariant = 'mobile';
      baseSettings.cacheStrategy = 'minimal';
      baseSettings.batchSize = 1;
    } else if (deviceCaps.memoryGB && deviceCaps.memoryGB < 8) {
      if (baseSettings.modelVariant === 'full') {
        baseSettings.modelVariant = 'quantized';
      }
      baseSettings.cacheStrategy = 'moderate';
    }

    // Adjust based on network conditions
    if (networkCaps.bandwidth === 'low' || networkCaps.saveData) {
      // Prefer smaller models for slow networks
      if (baseSettings.modelVariant === 'full') {
        baseSettings.modelVariant = 'quantized';
      } else if (baseSettings.modelVariant === 'quantized') {
        baseSettings.modelVariant = 'distilled';
      }
      baseSettings.cacheStrategy = 'aggressive'; // Cache more aggressively
      baseSettings.processingTimeout *= 1.5;
    }

    // Adjust based on mobile-specific constraints
    if (deviceCaps.isMobile) {
      baseSettings.maxInputLength = Math.min(baseSettings.maxInputLength, 256);
      baseSettings.batchSize = 1;
      baseSettings.processingTimeout = Math.min(baseSettings.processingTimeout, 8000);
      
      // Consider battery level if available
      if (deviceCaps.batteryLevel && deviceCaps.batteryLevel < 0.2 && !deviceCaps.isCharging) {
        baseSettings.modelVariant = 'mobile';
        baseSettings.enableOptimizations = true;
        baseSettings.qualityLevel = 'low';
      }
    }

    // Adjust WebGL/WASM usage based on support
    baseSettings.useWebGL = baseSettings.useWebGL && deviceCaps.webglSupported;
    baseSettings.useWebAssembly = baseSettings.useWebAssembly && deviceCaps.wasmSupported;

    // Model-specific adjustments
    this.applyModelSpecificAdjustments(modelType, baseSettings, deviceCaps);

    return baseSettings;
  }

  private applyModelSpecificAdjustments(
    modelType: keyof AdaptiveConfig,
    settings: QualitySettings,
    deviceCaps: DeviceCapabilities
  ): void {
    switch (modelType) {
      case 'sentiment':
        // Sentiment analysis is CPU-intensive, prefer WASM over WebGL
        if (deviceCaps.performanceLevel === 'low') {
          settings.maxInputLength = 128;
          settings.useWebGL = false;
        }
        break;
        
      case 'recommendation':
        // Recommendation systems can benefit from larger batch sizes
        if (deviceCaps.performanceLevel === 'high' && !deviceCaps.isMobile) {
          settings.batchSize = Math.min(settings.batchSize * 2, 20);
        }
        break;
        
      case 'imageClassification':
        // Image classification benefits from WebGL acceleration
        if (deviceCaps.webglSupported && deviceCaps.performanceLevel !== 'low') {
          settings.useWebGL = true;
          settings.precision = 'fp16'; // Good balance for image processing
        }
        break;
    }
  }

  // Get model variant information
  getModelVariantInfo(modelType: keyof AdaptiveConfig, variant: QualitySettings['modelVariant']) {
    return this.modelConfigs[modelType].variants[variant];
  }

  // Update settings manually (for user preferences)
  updateSettings(modelType: keyof AdaptiveConfig, updates: Partial<QualitySettings>): void {
    const currentSettings = this.currentSettings.get(modelType);
    if (currentSettings) {
      const newSettings = { ...currentSettings, ...updates };
      this.currentSettings.set(modelType, newSettings);
    }
  }

  // Reset to optimal settings
  async resetToOptimal(modelType: keyof AdaptiveConfig): Promise<QualitySettings> {
    this.currentSettings.delete(modelType);
    return this.getOptimalSettings(modelType);
  }

  // Get performance estimate for current settings
  getPerformanceEstimate(modelType: keyof AdaptiveConfig, settings: QualitySettings) {
    const variantInfo = this.getModelVariantInfo(modelType, settings.modelVariant);
    
    return {
      estimatedLoadTime: variantInfo.size / 10, // Rough estimate: 10MB/s
      estimatedInferenceTime: variantInfo.speed * 1000, // Convert to ms
      estimatedAccuracy: variantInfo.accuracy,
      memoryUsage: variantInfo.memoryRequirement,
      qualityScore: this.calculateQualityScore(settings, variantInfo)
    };
  }

  private calculateQualityScore(settings: QualitySettings, variantInfo: any): number {
    let score = variantInfo.accuracy * 100;
    
    // Adjust based on precision
    if (settings.precision === 'fp32') score += 5;
    else if (settings.precision === 'int8') score -= 5;
    
    // Adjust based on optimizations
    if (settings.enableOptimizations) score += 3;
    
    // Adjust based on acceleration
    if (settings.useWebGL) score += 2;
    if (settings.useWebAssembly) score += 1;
    
    return Math.min(Math.max(score, 0), 100);
  }

  // Clear all cached settings
  clearCache(): void {
    this.currentSettings.clear();
  }

  // Get all current settings
  getAllSettings(): Map<string, QualitySettings> {
    return new Map(this.currentSettings);
  }
}

export const adaptiveQuality = new AdaptiveQualityService();