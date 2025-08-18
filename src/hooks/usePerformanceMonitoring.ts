/**
 * React hook for performance monitoring and optimization
 * Provides real-time performance metrics and device-aware optimizations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { performanceMonitor, PerformanceWarning, DeviceInfo } from '../utils/performanceMonitor';
import { modelManager } from '../utils/modelManager';

export interface PerformanceMetrics {
  memoryUsage: {
    used: number;
    total: number;
    limit: number;
    percentage: number;
    warningLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  deviceCapabilities: DeviceInfo;
  modelPerformance: Record<string, {
    averageLoadTime: number;
    averageInferenceTime: number;
    memoryFootprint: number;
    lastUsed: number;
  }>;
  warnings: PerformanceWarning[];
  recommendations: string[];
}

export interface PerformanceHookOptions {
  enableRealTimeMonitoring?: boolean;
  warningThreshold?: number;
  updateInterval?: number;
  trackModelPerformance?: boolean;
}

export const usePerformanceMonitoring = (options: PerformanceHookOptions = {}) => {
  const {
    enableRealTimeMonitoring = true,
    warningThreshold = 0.8,
    updateInterval = 2000,
    trackModelPerformance = true
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningListenerRef = useRef<((event: CustomEvent) => void) | null>(null);

  // Update performance metrics
  const updateMetrics = useCallback(() => {
    const memoryStats = performanceMonitor.getMemoryStats();
    const deviceCapabilities = performanceMonitor.getDeviceCapabilities();
    const warnings = performanceMonitor.getWarnings();
    const recommendations = performanceMonitor.getPerformanceRecommendations();

    let memoryUsage = {
      used: 0,
      total: 0,
      limit: 0,
      percentage: 0,
      warningLevel: 'low' as const
    };

    if (memoryStats) {
      const percentage = memoryStats.used / memoryStats.limit;
      memoryUsage = {
        used: memoryStats.used,
        total: memoryStats.total,
        limit: memoryStats.limit,
        percentage: percentage * 100,
        warningLevel: percentage > 0.95 ? 'critical' :
                     percentage > 0.8 ? 'high' :
                     percentage > 0.6 ? 'medium' : 'low'
      };
    }

    // Get model performance data
    const modelPerformance: Record<string, any> = {};
    if (trackModelPerformance && modelManager && typeof modelManager.getAllModelsInfo === 'function') {
      try {
        const loadedModels = modelManager.getAllModelsInfo();
        for (const model of loadedModels) {
          const perfData = performanceMonitor.getModelPerformance(model.name);
          if (perfData) {
            modelPerformance[model.name] = {
              averageLoadTime: perfData.averageLoadTime,
              averageInferenceTime: perfData.averageInferenceTime,
              memoryFootprint: perfData.memoryFootprint,
              lastUsed: perfData.lastUsed
            };
          }
        }
      } catch (error) {
        console.warn('Failed to get model performance data:', error);
      }
    }

    setMetrics({
      memoryUsage,
      deviceCapabilities,
      modelPerformance,
      warnings,
      recommendations
    });
  }, [trackModelPerformance]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    
    // Initial update
    updateMetrics();

    if (enableRealTimeMonitoring) {
      // Set up periodic updates
      intervalRef.current = setInterval(updateMetrics, updateInterval);

      // Listen for performance warnings
      warningListenerRef.current = (event: CustomEvent) => {
        updateMetrics(); // Refresh metrics when warnings occur
      };
      
      window.addEventListener('performanceWarning', warningListenerRef.current as EventListener);
    }
  }, [isMonitoring, enableRealTimeMonitoring, updateInterval, updateMetrics]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;

    setIsMonitoring(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (warningListenerRef.current) {
      window.removeEventListener('performanceWarning', warningListenerRef.current as EventListener);
      warningListenerRef.current = null;
    }
  }, [isMonitoring]);

  // Record model loading performance
  const recordModelLoad = useCallback((modelId: string, loadTime: number, memoryUsage: number) => {
    performanceMonitor.recordModelLoad(modelId, loadTime, memoryUsage);
    if (trackModelPerformance) {
      updateMetrics();
    }
  }, [trackModelPerformance, updateMetrics]);

  // Record inference performance
  const recordInference = useCallback((modelId: string, inferenceTime: number, batchSize: number = 1) => {
    performanceMonitor.recordInference(modelId, inferenceTime, batchSize);
    if (trackModelPerformance) {
      updateMetrics();
    }
  }, [trackModelPerformance, updateMetrics]);

  // Get optimal model suggestion
  const getOptimalModel = useCallback((availableModels: string[]): string => {
    return performanceMonitor.suggestOptimalModel(availableModels);
  }, []);

  // Check if device can handle model
  const canHandleModel = useCallback((modelSize: number, estimatedInferenceTime: number): boolean => {
    if (!metrics) return true;

    const { memoryUsage, deviceCapabilities } = metrics;
    
    // Check memory constraints
    const availableMemory = memoryUsage.limit - memoryUsage.used;
    if (modelSize > availableMemory * 0.8) {
      return false;
    }

    // Check performance constraints for low-end devices
    if (deviceCapabilities.hardwareConcurrency <= 2 && estimatedInferenceTime > 10000) {
      return false;
    }

    return true;
  }, [metrics]);

  // Get performance-optimized loading options
  const getOptimizedLoadingOptions = useCallback(() => {
    if (!metrics) return {};

    const { deviceCapabilities, memoryUsage } = metrics;
    const options: any = {};

    // Device selection
    if (deviceCapabilities.webglSupported && deviceCapabilities.hardwareConcurrency >= 4) {
      options.device = 'webgl';
    } else if (deviceCapabilities.wasmSupported) {
      options.device = 'wasm';
    } else {
      options.device = 'cpu';
    }

    // Quantization for low-memory devices
    if (memoryUsage.warningLevel === 'high' || memoryUsage.warningLevel === 'critical') {
      options.quantized = true;
    }

    // Priority based on memory usage
    if (memoryUsage.warningLevel === 'critical') {
      options.priority = 'high';
    } else if (memoryUsage.warningLevel === 'low') {
      options.priority = 'low';
    } else {
      options.priority = 'normal';
    }

    return options;
  }, [metrics]);

  // Clear warnings
  const clearWarnings = useCallback(() => {
    performanceMonitor.clearWarnings();
    updateMetrics();
  }, [updateMetrics]);

  // Export performance data
  const exportPerformanceData = useCallback(() => {
    return performanceMonitor.exportPerformanceData();
  }, []);

  // Auto-start monitoring on mount
  useEffect(() => {
    if (enableRealTimeMonitoring) {
      startMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [enableRealTimeMonitoring, startMonitoring, stopMonitoring]);

  return {
    // State
    metrics,
    isMonitoring,
    
    // Controls
    startMonitoring,
    stopMonitoring,
    updateMetrics,
    clearWarnings,
    
    // Performance tracking
    recordModelLoad,
    recordInference,
    
    // Optimization helpers
    getOptimalModel,
    canHandleModel,
    getOptimizedLoadingOptions,
    
    // Data export
    exportPerformanceData,
    
    // Computed values
    isLowEndDevice: metrics?.deviceCapabilities.hardwareConcurrency <= 2,
    isHighMemoryUsage: metrics?.memoryUsage.warningLevel === 'high' || metrics?.memoryUsage.warningLevel === 'critical',
    hasPerformanceWarnings: (metrics?.warnings.length || 0) > 0,
    shouldUseQuantizedModels: metrics?.memoryUsage.warningLevel === 'high' || metrics?.memoryUsage.warningLevel === 'critical',
    recommendedDevice: metrics?.deviceCapabilities.webglSupported ? 'webgl' : 
                      metrics?.deviceCapabilities.wasmSupported ? 'wasm' : 'cpu'
  };
};

export default usePerformanceMonitoring;