/**
 * Model Quantization Utilities
 * Provides support for model quantization to reduce memory usage and improve performance
 */

export interface QuantizationConfig {
  precision: 'int8' | 'int16' | 'float16' | 'float32';
  calibrationSamples?: number;
  enableDynamicQuantization?: boolean;
  targetMemoryReduction?: number; // Percentage
}

export interface QuantizedModel {
  model: any;
  originalSize: number;
  quantizedSize: number;
  compressionRatio: number;
  precision: string;
  performanceMetrics?: {
    loadTime: number;
    inferenceTime: number;
    accuracyLoss: number;
  };
}

export class ModelQuantizer {
  private static instance: ModelQuantizer;
  private quantizedModels: Map<string, QuantizedModel> = new Map();

  static getInstance(): ModelQuantizer {
    if (!ModelQuantizer.instance) {
      ModelQuantizer.instance = new ModelQuantizer();
    }
    return ModelQuantizer.instance;
  }

  /**
   * Quantize a model to reduce memory usage
   */
  async quantizeModel(
    modelId: string,
    model: any,
    config: QuantizationConfig
  ): Promise<QuantizedModel> {
    const startTime = performance.now();
    const originalSize = this.estimateModelSize(model);

    try {
      let quantizedModel: any;
      
      switch (config.precision) {
        case 'int8':
          quantizedModel = await this.quantizeToInt8(model, config);
          break;
        case 'int16':
          quantizedModel = await this.quantizeToInt16(model, config);
          break;
        case 'float16':
          quantizedModel = await this.quantizeToFloat16(model, config);
          break;
        default:
          quantizedModel = model; // No quantization
      }

      const quantizedSize = this.estimateModelSize(quantizedModel);
      const compressionRatio = originalSize / quantizedSize;
      const loadTime = performance.now() - startTime;

      const result: QuantizedModel = {
        model: quantizedModel,
        originalSize,
        quantizedSize,
        compressionRatio,
        precision: config.precision,
        performanceMetrics: {
          loadTime: Math.max(1, loadTime), // Ensure minimum 1ms
          inferenceTime: 0, // Will be measured during inference
          accuracyLoss: 0 // Will be measured during validation
        }
      };

      this.quantizedModels.set(modelId, result);
      return result;
    } catch (error) {
      console.error(`Failed to quantize model ${modelId}:`, error);
      throw new Error(`Model quantization failed: ${error.message}`);
    }
  }

  /**
   * Get quantized model if available
   */
  getQuantizedModel(modelId: string): QuantizedModel | null {
    return this.quantizedModels.get(modelId) || null;
  }

  /**
   * Check if quantization is supported for the current environment
   */
  isQuantizationSupported(): boolean {
    // Check for WebGL support for GPU quantization
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    // Check for WASM support for CPU quantization
    const wasmSupported = typeof WebAssembly === 'object';
    
    return !!(gl && wasmSupported);
  }

  /**
   * Recommend optimal quantization settings based on device capabilities
   */
  getRecommendedQuantization(deviceInfo: any): QuantizationConfig {
    const memoryMB = deviceInfo.memory || 4096; // Default to 4GB
    const isMobile = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent);
    
    if (isMobile || memoryMB < 2048) {
      return {
        precision: 'int8',
        enableDynamicQuantization: true,
        targetMemoryReduction: 75
      };
    } else if (memoryMB < 4096) {
      return {
        precision: 'int16',
        enableDynamicQuantization: true,
        targetMemoryReduction: 50
      };
    } else {
      return {
        precision: 'float16',
        enableDynamicQuantization: false,
        targetMemoryReduction: 25
      };
    }
  }

  private async quantizeToInt8(model: any, config: QuantizationConfig): Promise<any> {
    // Simulate INT8 quantization
    // In a real implementation, this would use ONNX Runtime or TensorFlow.js quantization
    if (model.weights) {
      const quantizedWeights = new Map();
      
      for (const [key, weights] of model.weights.entries()) {
        if (weights instanceof Float32Array) {
          // Convert float32 to int8 with scaling
          const scale = this.calculateQuantizationScale(weights);
          const quantized = new Int8Array(weights.length);
          
          for (let i = 0; i < weights.length; i++) {
            quantized[i] = Math.round(weights[i] / scale);
          }
          
          quantizedWeights.set(key, { data: quantized, scale });
        } else {
          quantizedWeights.set(key, weights);
        }
      }
      
      return { ...model, weights: quantizedWeights, quantized: true, precision: 'int8' };
    }
    
    return { ...model, quantized: true, precision: 'int8' };
  }

  private async quantizeToInt16(model: any, config: QuantizationConfig): Promise<any> {
    // Similar to INT8 but with 16-bit precision
    if (model.weights) {
      const quantizedWeights = new Map();
      
      for (const [key, weights] of model.weights.entries()) {
        if (weights instanceof Float32Array) {
          const scale = this.calculateQuantizationScale(weights);
          const quantized = new Int16Array(weights.length);
          
          for (let i = 0; i < weights.length; i++) {
            quantized[i] = Math.round(weights[i] / scale);
          }
          
          quantizedWeights.set(key, { data: quantized, scale });
        } else {
          quantizedWeights.set(key, weights);
        }
      }
      
      return { ...model, weights: quantizedWeights, quantized: true, precision: 'int16' };
    }
    
    return { ...model, quantized: true, precision: 'int16' };
  }

  private async quantizeToFloat16(model: any, config: QuantizationConfig): Promise<any> {
    // Float16 quantization (half precision)
    return { ...model, quantized: true, precision: 'float16' };
  }

  private calculateQuantizationScale(weights: Float32Array): number {
    let min = Infinity;
    let max = -Infinity;
    
    for (let i = 0; i < weights.length; i++) {
      min = Math.min(min, weights[i]);
      max = Math.max(max, weights[i]);
    }
    
    // Calculate scale for symmetric quantization
    const absMax = Math.max(Math.abs(min), Math.abs(max));
    return absMax / 127; // For int8: -128 to 127
  }

  private estimateModelSize(model: any): number {
    if (!model) return 0;
    
    let size = 0;
    
    // Estimate based on model structure
    if (model.weights) {
      for (const weights of model.weights.values()) {
        if (weights instanceof Float32Array) {
          size += weights.length * 4; // 4 bytes per float32
        } else if (weights instanceof Int8Array) {
          size += weights.length * 1; // 1 byte per int8
        } else if (weights instanceof Int16Array) {
          size += weights.length * 2; // 2 bytes per int16
        } else if (weights && weights.data) {
          const bytesPerElement = weights.data.BYTES_PER_ELEMENT || 4;
          size += weights.data.length * bytesPerElement;
        } else if (typeof weights === 'object' && weights !== null) {
          // Handle quantized weights with scale
          size += JSON.stringify(weights).length;
        }
      }
    }
    
    // Add overhead for model structure (minimum 100 bytes)
    const structureSize = Math.max(100, JSON.stringify(model).length);
    size += structureSize;
    
    return size;
  }

  /**
   * Clear quantized model cache
   */
  clearCache(): void {
    this.quantizedModels.clear();
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    totalOriginalSize: number;
    totalQuantizedSize: number;
    totalSavings: number;
    modelsCount: number;
  } {
    let totalOriginalSize = 0;
    let totalQuantizedSize = 0;
    
    for (const quantizedModel of this.quantizedModels.values()) {
      totalOriginalSize += quantizedModel.originalSize;
      totalQuantizedSize += quantizedModel.quantizedSize;
    }
    
    return {
      totalOriginalSize,
      totalQuantizedSize,
      totalSavings: totalOriginalSize - totalQuantizedSize,
      modelsCount: this.quantizedModels.size
    };
  }
}

export const modelQuantizer = ModelQuantizer.getInstance();