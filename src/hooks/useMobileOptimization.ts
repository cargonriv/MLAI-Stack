/**
 * Mobile Optimization Hook
 * Provides mobile-specific optimizations and adaptive behavior
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { deviceDetection, DeviceCapabilities, NetworkCapabilities } from '../utils/deviceDetection';
import { adaptiveQuality, QualitySettings } from '../utils/adaptiveQuality';
import { progressiveLoader, LoadingProgress } from '../utils/progressiveLoader';

export interface MobileOptimizationState {
  isMobile: boolean;
  isTablet: boolean;
  hasTouch: boolean;
  performanceLevel: 'low' | 'medium' | 'high';
  networkBandwidth: 'low' | 'medium' | 'high';
  batteryLevel?: number;
  isCharging?: boolean;
  shouldOptimize: boolean;
  qualitySettings: QualitySettings | null;
  isLoading: boolean;
  error: string | null;
}

export interface MobileOptimizationOptions {
  enableBatteryOptimization?: boolean;
  enableNetworkOptimization?: boolean;
  enablePerformanceOptimization?: boolean;
  autoAdjustQuality?: boolean;
  modelType?: 'sentiment' | 'recommendation' | 'imageClassification';
}

export const useMobileOptimization = (options: MobileOptimizationOptions = {}) => {
  const {
    enableBatteryOptimization = true,
    enableNetworkOptimization = true,
    enablePerformanceOptimization = true,
    autoAdjustQuality = true,
    modelType = 'sentiment'
  } = options;

  const [state, setState] = useState<MobileOptimizationState>({
    isMobile: false,
    isTablet: false,
    hasTouch: false,
    performanceLevel: 'medium',
    networkBandwidth: 'medium',
    shouldOptimize: false,
    qualitySettings: null,
    isLoading: true,
    error: null
  });

  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null);
  const deviceCapsRef = useRef<DeviceCapabilities | null>(null);
  const networkCapsRef = useRef<NetworkCapabilities | null>(null);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  // Initialize device and network detection
  useEffect(() => {
    const initializeOptimization = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Get device and network capabilities
        const [deviceCaps, networkCaps] = await Promise.all([
          deviceDetection.getDeviceCapabilities(),
          deviceDetection.getNetworkCapabilities()
        ]);

        deviceCapsRef.current = deviceCaps;
        networkCapsRef.current = networkCaps;

        // Get optimal quality settings if auto-adjust is enabled
        let qualitySettings: QualitySettings | null = null;
        if (autoAdjustQuality) {
          qualitySettings = await adaptiveQuality.getOptimalSettings(modelType);
        }

        // Determine if optimization should be enabled
        const shouldOptimize = 
          deviceCaps.isMobile || 
          deviceCaps.performanceLevel === 'low' ||
          networkCaps.bandwidth === 'low' ||
          (enableBatteryOptimization && deviceCaps.batteryLevel && deviceCaps.batteryLevel < 0.3);

        setState({
          isMobile: deviceCaps.isMobile,
          isTablet: deviceCaps.isTablet,
          hasTouch: deviceCaps.hasTouch,
          performanceLevel: deviceCaps.performanceLevel,
          networkBandwidth: networkCaps.bandwidth,
          batteryLevel: deviceCaps.batteryLevel,
          isCharging: deviceCaps.isCharging,
          shouldOptimize,
          qualitySettings,
          isLoading: false,
          error: null
        });

      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to initialize mobile optimization'
        }));
      }
    };

    initializeOptimization();
  }, [enableBatteryOptimization, autoAdjustQuality, modelType]);

  // Set up network change monitoring
  useEffect(() => {
    if (!enableNetworkOptimization) return;

    const cleanup = deviceDetection.onNetworkChange(async (networkInfo) => {
      networkCapsRef.current = networkInfo;
      
      setState(prev => ({
        ...prev,
        networkBandwidth: networkInfo.bandwidth
      }));

      // Re-evaluate quality settings if auto-adjust is enabled
      if (autoAdjustQuality && deviceCapsRef.current) {
        try {
          const newQualitySettings = await adaptiveQuality.getOptimalSettings(modelType);
          setState(prev => ({
            ...prev,
            qualitySettings: newQualitySettings
          }));
        } catch (error) {
          console.warn('Failed to update quality settings:', error);
        }
      }
    });

    cleanupFunctionsRef.current.push(cleanup);

    return () => {
      cleanup();
    };
  }, [enableNetworkOptimization, autoAdjustQuality, modelType]);

  // Battery monitoring (if available)
  useEffect(() => {
    if (!enableBatteryOptimization || typeof navigator === 'undefined' || !('getBattery' in navigator)) {
      return;
    }

    let batteryUpdateInterval: NodeJS.Timeout;

    const setupBatteryMonitoring = async () => {
      try {
        const battery = await (navigator as any).getBattery();
        
        const updateBatteryInfo = () => {
          setState(prev => ({
            ...prev,
            batteryLevel: battery.level,
            isCharging: battery.charging,
            shouldOptimize: prev.shouldOptimize || (battery.level < 0.3 && !battery.charging)
          }));
        };

        // Initial update
        updateBatteryInfo();

        // Set up periodic updates
        batteryUpdateInterval = setInterval(updateBatteryInfo, 30000); // Every 30 seconds

        // Listen for battery events
        battery.addEventListener('levelchange', updateBatteryInfo);
        battery.addEventListener('chargingchange', updateBatteryInfo);

        cleanupFunctionsRef.current.push(() => {
          if (batteryUpdateInterval) {
            clearInterval(batteryUpdateInterval);
          }
          battery.removeEventListener('levelchange', updateBatteryInfo);
          battery.removeEventListener('chargingchange', updateBatteryInfo);
        });

      } catch (error) {
        console.warn('Battery API not available:', error);
      }
    };

    setupBatteryMonitoring();

    return () => {
      if (batteryUpdateInterval) {
        clearInterval(batteryUpdateInterval);
      }
    };
  }, [enableBatteryOptimization]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupFunctionsRef.current.forEach(cleanup => cleanup());
      cleanupFunctionsRef.current = [];
    };
  }, []);

  // Progressive loading with mobile optimizations
  const loadModelProgressively = useCallback(async (
    modelConfig: {
      modelId: string;
      baseUrl: string;
      files: string[];
      totalSize: number;
    }
  ) => {
    if (!deviceCapsRef.current || !networkCapsRef.current) {
      throw new Error('Device capabilities not initialized');
    }

    const optimizedConfig = {
      ...modelConfig,
      minChunkSize: state.networkBandwidth === 'low' ? 256 * 1024 : 512 * 1024, // 256KB or 512KB
      maxChunkSize: state.networkBandwidth === 'high' ? 2 * 1024 * 1024 : 1024 * 1024, // 1MB or 2MB
      priority: state.shouldOptimize ? 'low' as const : 'medium' as const
    };

    return progressiveLoader.loadModelProgressively(
      optimizedConfig,
      (progress) => setLoadingProgress(progress)
    );
  }, [state.networkBandwidth, state.shouldOptimize]);

  // Get mobile-specific recommendations
  const getMobileRecommendations = useCallback(() => {
    const recommendations: string[] = [];

    if (state.isMobile) {
      recommendations.push('Using mobile-optimized interface');
      
      if (state.performanceLevel === 'low') {
        recommendations.push('Reduced model complexity for better performance');
      }
      
      if (state.networkBandwidth === 'low') {
        recommendations.push('Progressive loading enabled for slow networks');
      }
      
      if (state.batteryLevel && state.batteryLevel < 0.3 && !state.isCharging) {
        recommendations.push('Battery optimization active - reduced processing');
      }
    }

    if (state.hasTouch) {
      recommendations.push('Touch-optimized controls available');
    }

    return recommendations;
  }, [state]);

  // Update quality settings manually
  const updateQualitySettings = useCallback(async (updates: Partial<QualitySettings>) => {
    if (!state.qualitySettings) return;

    const newSettings = { ...state.qualitySettings, ...updates };
    adaptiveQuality.updateSettings(modelType, updates);
    
    setState(prev => ({
      ...prev,
      qualitySettings: newSettings
    }));
  }, [state.qualitySettings, modelType]);

  // Reset to optimal settings
  const resetToOptimal = useCallback(async () => {
    try {
      const optimalSettings = await adaptiveQuality.resetToOptimal(modelType);
      setState(prev => ({
        ...prev,
        qualitySettings: optimalSettings
      }));
    } catch (error) {
      console.error('Failed to reset to optimal settings:', error);
    }
  }, [modelType]);

  // Get performance estimate
  const getPerformanceEstimate = useCallback(() => {
    if (!state.qualitySettings) return null;

    return adaptiveQuality.getPerformanceEstimate(modelType, state.qualitySettings);
  }, [state.qualitySettings, modelType]);

  // Check if feature should be disabled for optimization
  const shouldDisableFeature = useCallback((feature: 'animations' | 'realtime' | 'batch' | 'caching') => {
    if (!state.shouldOptimize) return false;

    switch (feature) {
      case 'animations':
        return state.performanceLevel === 'low' || (state.batteryLevel && state.batteryLevel < 0.2);
      case 'realtime':
        return state.networkBandwidth === 'low' || state.performanceLevel === 'low';
      case 'batch':
        return false; // Batch processing is usually beneficial for mobile
      case 'caching':
        return false; // Caching is usually beneficial for mobile
      default:
        return false;
    }
  }, [state.shouldOptimize, state.performanceLevel, state.networkBandwidth, state.batteryLevel]);

  // Get touch-optimized settings
  const getTouchSettings = useCallback(() => {
    if (!state.hasTouch) return null;

    return {
      enableSwipeGestures: true,
      increaseTouchTargets: true,
      enableHapticFeedback: 'vibrate' in navigator,
      optimizeScrolling: true,
      enablePullToRefresh: state.isMobile
    };
  }, [state.hasTouch, state.isMobile]);

  return {
    // State
    ...state,
    loadingProgress,
    
    // Actions
    loadModelProgressively,
    updateQualitySettings,
    resetToOptimal,
    
    // Utilities
    getMobileRecommendations,
    getPerformanceEstimate,
    shouldDisableFeature,
    getTouchSettings,
    
    // Device info
    deviceCapabilities: deviceCapsRef.current,
    networkCapabilities: networkCapsRef.current
  };
};