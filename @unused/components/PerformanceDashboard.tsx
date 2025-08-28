/**
 * Performance monitoring dashboard for ML models
 * Displays real-time metrics, warnings, and device capabilities
 */

import React, { useState, useEffect } from 'react';
import { performanceMonitor, PerformanceWarning, DeviceInfo } from '../utils/performanceMonitor';
import { modelManager } from '../utils/modelManager';
import { modelCache } from '../utils/modelCache';

interface PerformanceDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ 
  isVisible, 
  onClose 
}) => {
  const [warnings, setWarnings] = useState<PerformanceWarning[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [memoryStats, setMemoryStats] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [modelStats, setModelStats] = useState<any[]>([]);

  useEffect(() => {
    if (!isVisible) return;

    // Initial load
    loadPerformanceData();

    // Set up real-time updates
    const interval = setInterval(loadPerformanceData, 2000);

    // Listen for performance warnings
    const handleWarning = (event: CustomEvent) => {
      setWarnings(prev => [...prev, event.detail]);
    };

    window.addEventListener('performanceWarning', handleWarning as EventListener);

    return () => {
      clearInterval(interval);
      window.removeEventListener('performanceWarning', handleWarning as EventListener);
    };
  }, [isVisible]);

  const loadPerformanceData = () => {
    try {
      setDeviceInfo(performanceMonitor.getDeviceCapabilities());
      setWarnings(performanceMonitor.getWarnings());
      setMemoryStats(performanceMonitor.getMemoryStats());
      setCacheStats(modelCache.getStats());
      
      if (modelManager && typeof modelManager.getAllModelsInfo === 'function') {
        setModelStats(modelManager.getAllModelsInfo());
      } else {
        setModelStats([]);
      }
    } catch (error) {
      console.warn('Failed to load performance data:', error);
      setModelStats([]);
    }
  };

  const clearWarnings = () => {
    performanceMonitor.clearWarnings();
    setWarnings([]);
  };

  const clearCache = async () => {
    await modelCache.clear();
    modelManager.clearCache();
    loadPerformanceData();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getWarningColor = (severity: string): string => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getMemoryWarningColor = (level: string): string => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Device Capabilities</h3>
              {deviceInfo && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>CPU Cores:</span>
                    <span className="font-mono">{deviceInfo.hardwareConcurrency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Device Memory:</span>
                    <span className="font-mono">
                      {deviceInfo.deviceMemory ? `${deviceInfo.deviceMemory}GB` : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>WebGL Support:</span>
                    <span className={`font-mono ${deviceInfo.webglSupported ? 'text-green-600' : 'text-red-600'}`}>
                      {deviceInfo.webglSupported ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>WASM Support:</span>
                    <span className={`font-mono ${deviceInfo.wasmSupported ? 'text-green-600' : 'text-red-600'}`}>
                      {deviceInfo.wasmSupported ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {deviceInfo.connection && (
                    <>
                      <div className="flex justify-between">
                        <span>Connection:</span>
                        <span className="font-mono">{deviceInfo.connection.effectiveType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Downlink:</span>
                        <span className="font-mono">{deviceInfo.connection.downlink} Mbps</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Memory Usage */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Memory Usage</h3>
              {memoryStats && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Used:</span>
                    <span className="font-mono">{formatBytes(memoryStats.used)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total:</span>
                    <span className="font-mono">{formatBytes(memoryStats.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Limit:</span>
                    <span className="font-mono">{formatBytes(memoryStats.limit)}</span>
                  </div>
                  
                  {/* Memory usage bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Memory Usage</span>
                      <span>{Math.round((memoryStats.used / memoryStats.limit) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          getMemoryWarningColor(
                            memoryStats.used / memoryStats.limit > 0.9 ? 'critical' :
                            memoryStats.used / memoryStats.limit > 0.8 ? 'high' :
                            memoryStats.used / memoryStats.limit > 0.6 ? 'medium' : 'low'
                          )
                        }`}
                        style={{ width: `${Math.min((memoryStats.used / memoryStats.limit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cache Statistics */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Cache Statistics</h3>
              {cacheStats && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Size:</span>
                    <span className="font-mono">{formatBytes(cacheStats.totalSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entry Count:</span>
                    <span className="font-mono">{cacheStats.entryCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hit Rate:</span>
                    <span className="font-mono">{(cacheStats.hitRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Evictions:</span>
                    <span className="font-mono">{cacheStats.evictionCount}</span>
                  </div>
                </div>
              )}
              <button
                onClick={clearCache}
                className="mt-3 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
              >
                Clear Cache
              </button>
            </div>

            {/* Performance Recommendations */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
              <div className="space-y-2">
                {performanceMonitor.getPerformanceRecommendations().map((recommendation, index) => (
                  <div key={index} className="text-sm text-gray-700 bg-blue-50 p-2 rounded">
                    {recommendation}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Loaded Models */}
          {modelStats.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Loaded Models</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Load Time</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Memory</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {modelStats.map((model, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{model.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500 font-mono">{formatBytes(model.size)}</td>
                        <td className="px-4 py-2 text-sm text-gray-500 font-mono">{formatTime(model.loadTime)}</td>
                        <td className="px-4 py-2 text-sm text-gray-500 font-mono">{formatBytes(model.memoryUsage)}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{model.device}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            model.isLoaded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {model.isLoaded ? 'Loaded' : 'Unloaded'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Performance Warnings */}
          {warnings.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">Performance Warnings</h3>
                <button
                  onClick={clearWarnings}
                  className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                >
                  Clear Warnings
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {warnings.slice(-10).reverse().map((warning, index) => (
                  <div key={index} className={`p-3 rounded-lg ${getWarningColor(warning.severity)}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{warning.message}</div>
                        <div className="text-sm mt-1">{warning.suggestion}</div>
                      </div>
                      <div className="text-xs opacity-75">
                        {new Date(warning.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;