/**
 * Integration tests for performance monitoring system
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

// Simple integration test that doesn't rely on complex mocking
describe('Performance Monitoring Integration', () => {
  test('should be able to import performance monitoring modules', async () => {
    // Test that modules can be imported without errors
    const { performanceMonitor } = await import('../performanceMonitor');
    const { modelCache } = await import('../modelCache');
    const { usePerformanceMonitoring } = await import('../../hooks/usePerformanceMonitoring');
    
    expect(performanceMonitor).toBeDefined();
    expect(modelCache).toBeDefined();
    expect(usePerformanceMonitoring).toBeDefined();
  });

  test('should have basic performance monitoring functionality', async () => {
    const { performanceMonitor } = await import('../performanceMonitor');
    
    // Test basic functionality without complex browser APIs
    expect(typeof performanceMonitor.getPerformanceRecommendations).toBe('function');
    expect(typeof performanceMonitor.clearWarnings).toBe('function');
    expect(typeof performanceMonitor.exportPerformanceData).toBe('function');
    
    // Test that we can get recommendations
    const recommendations = performanceMonitor.getPerformanceRecommendations();
    expect(Array.isArray(recommendations)).toBe(true);
  });

  test('should have basic cache functionality', async () => {
    const { modelCache } = await import('../modelCache');
    
    // Test basic functionality
    expect(typeof modelCache.getStats).toBe('function');
    expect(typeof modelCache.getConfig).toBe('function');
    expect(typeof modelCache.updateConfig).toBe('function');
    
    // Test that we can get stats
    const stats = modelCache.getStats();
    expect(typeof stats.totalSize).toBe('number');
    expect(typeof stats.entryCount).toBe('number');
    expect(typeof stats.hitRate).toBe('number');
  });

  test('should export performance data in correct format', async () => {
    const { performanceMonitor } = await import('../performanceMonitor');
    
    const exportedData = performanceMonitor.exportPerformanceData();
    expect(typeof exportedData).toBe('string');
    
    // Should be valid JSON
    const parsedData = JSON.parse(exportedData);
    expect(parsedData).toHaveProperty('deviceInfo');
    expect(parsedData).toHaveProperty('modelMetrics');
    expect(parsedData).toHaveProperty('warnings');
    expect(parsedData).toHaveProperty('timestamp');
  });
});