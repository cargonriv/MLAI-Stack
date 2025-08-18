/**
 * Test Utilities
 * Common utilities and helpers for testing ML components and functions
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';
import { defaultTestConfig, TestConfig } from './test-config';

// Mock implementations for ML models
export const mockSentimentResult = {
  label: 'POSITIVE' as const,
  confidence: 0.85,
  scores: {
    positive: 0.85,
    negative: 0.15
  },
  processingTime: 150,
  modelInfo: {
    name: 'distilbert-base-uncased-finetuned-sst-2-english',
    size: '67MB',
    architecture: 'DistilBERT'
  }
};

export const mockRecommendationResult = [
  {
    movieId: 1,
    title: 'The Matrix',
    predictedRating: 4.5,
    confidence: 0.85,
    genres: ['Action', 'Sci-Fi'],
    explanation: 'Based on your ratings of similar sci-fi movies',
    similarUsers: [123, 456]
  },
  {
    movieId: 2,
    title: 'Inception',
    predictedRating: 4.2,
    confidence: 0.78,
    genres: ['Action', 'Thriller'],
    explanation: 'Users with similar tastes also enjoyed this',
    similarUsers: [789, 101]
  }
];

export const mockModelInfo = {
  name: 'test-model',
  size: 67 * 1024 * 1024,
  architecture: 'DistilBERT',
  loadTime: 2500,
  memoryUsage: 67 * 1024 * 1024,
  device: 'cpu'
};

/**
 * Create a mock performance timer
 */
export function createMockPerformanceTimer() {
  let currentTime = 0;
  return vi.fn(() => {
    currentTime += 10;
    return currentTime;
  });
}

/**
 * Create a mock progress callback
 */
export function createMockProgressCallback() {
  const callback = vi.fn();
  const progressValues: number[] = [];
  
  callback.mockImplementation((progress: number) => {
    progressValues.push(progress);
  });
  
  return { callback, progressValues };
}

/**
 * Mock browser environment
 */
export function mockBrowserEnvironment(config: {
  userAgent?: string;
  webglSupported?: boolean;
  wasmSupported?: boolean;
  deviceMemory?: number;
  hardwareConcurrency?: number;
}) {
  // Mock user agent
  if (config.userAgent) {
    Object.defineProperty(navigator, 'userAgent', {
      value: config.userAgent,
      configurable: true
    });
  }
  
  // Mock device capabilities
  if (config.deviceMemory !== undefined) {
    Object.defineProperty(navigator, 'deviceMemory', {
      value: config.deviceMemory,
      configurable: true
    });
  }
  
  if (config.hardwareConcurrency !== undefined) {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      value: config.hardwareConcurrency,
      configurable: true
    });
  }
  
  // Mock WebGL support
  if (config.webglSupported !== undefined) {
    const mockCanvas = {
      getContext: vi.fn().mockImplementation((type: string) => {
        if ((type === 'webgl' || type === 'webgl2') && config.webglSupported) {
          return {
            getParameter: vi.fn(),
            getExtension: vi.fn()
          };
        }
        return null;
      })
    };
    
    global.document.createElement = vi.fn().mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return mockCanvas;
      }
      return document.createElement(tagName);
    });
  }
  
  // Mock WebAssembly support
  if (config.wasmSupported !== undefined) {
    if (config.wasmSupported) {
      global.WebAssembly = {
        instantiate: vi.fn().mockResolvedValue({
          instance: { exports: {} },
          module: {}
        }),
        compile: vi.fn().mockResolvedValue({})
      } as any;
    } else {
      global.WebAssembly = undefined as any;
    }
  }
}

/**
 * Mock network conditions
 */
export function mockNetworkConditions(config: {
  delay?: number;
  bandwidth?: number;
  offline?: boolean;
  errorRate?: number;
}) {
  const originalFetch = global.fetch;
  
  global.fetch = vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
    // Simulate offline
    if (config.offline) {
      throw new Error('Network error: offline');
    }
    
    // Simulate error rate
    if (config.errorRate && Math.random() < config.errorRate) {
      throw new Error('Network error: random failure');
    }
    
    // Simulate network delay
    if (config.delay) {
      await new Promise(resolve => setTimeout(resolve, config.delay));
    }
    
    // Mock response based on bandwidth
    const responseSize = config.bandwidth ? Math.min(config.bandwidth * 1024, 1024 * 1024) : 1024 * 1024;
    
    return {
      ok: true,
      status: 200,
      headers: {
        get: (name: string) => name === 'content-length' ? responseSize.toString() : null
      },
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(responseSize)),
      json: () => Promise.resolve({}),
      text: () => Promise.resolve('mock response')
    };
  });
  
  return () => {
    global.fetch = originalFetch;
  };
}

/**
 * Wait for async operations to complete
 */
export async function waitForAsyncOperations(timeout = 5000) {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Async operations did not complete within ${timeout}ms`));
    }, timeout);
    
    // Wait for next tick and resolve
    setTimeout(() => {
      clearTimeout(timeoutId);
      resolve();
    }, 0);
  });
}

/**
 * Create a test wrapper with providers
 */
interface TestWrapperProps {
  children: React.ReactNode;
}

function TestWrapper({ children }: TestWrapperProps) {
  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  );
}

/**
 * Custom render function with test wrapper
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: TestWrapper, ...options });
}

/**
 * Performance measurement utilities
 */
export class PerformanceMeasurer {
  private startTime: number = 0;
  private measurements: { [key: string]: number } = {};
  
  start(label: string = 'default') {
    this.startTime = performance.now();
    return label;
  }
  
  end(label: string = 'default') {
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    this.measurements[label] = duration;
    return duration;
  }
  
  getMeasurement(label: string = 'default') {
    return this.measurements[label];
  }
  
  getAllMeasurements() {
    return { ...this.measurements };
  }
  
  clear() {
    this.measurements = {};
  }
}

/**
 * Memory usage tracker
 */
export class MemoryTracker {
  private snapshots: { [key: string]: number } = {};
  
  snapshot(label: string) {
    // Mock memory usage (in real browser, would use performance.memory)
    const mockMemoryUsage = Math.random() * 100 * 1024 * 1024; // Random value up to 100MB
    this.snapshots[label] = mockMemoryUsage;
    return mockMemoryUsage;
  }
  
  getDifference(startLabel: string, endLabel: string) {
    const start = this.snapshots[startLabel] || 0;
    const end = this.snapshots[endLabel] || 0;
    return end - start;
  }
  
  getAllSnapshots() {
    return { ...this.snapshots };
  }
  
  clear() {
    this.snapshots = {};
  }
}

/**
 * Accuracy measurement utilities
 */
export class AccuracyMeasurer {
  private predictions: Array<{ expected: any; actual: any }> = [];
  
  addPrediction(expected: any, actual: any) {
    this.predictions.push({ expected, actual });
  }
  
  calculateAccuracy() {
    if (this.predictions.length === 0) return 0;
    
    const correct = this.predictions.filter(p => p.expected === p.actual).length;
    return correct / this.predictions.length;
  }
  
  calculateMAE() {
    if (this.predictions.length === 0) return 0;
    
    const errors = this.predictions.map(p => Math.abs(p.expected - p.actual));
    return errors.reduce((sum, error) => sum + error, 0) / errors.length;
  }
  
  calculateRMSE() {
    if (this.predictions.length === 0) return 0;
    
    const squaredErrors = this.predictions.map(p => Math.pow(p.expected - p.actual, 2));
    const mse = squaredErrors.reduce((sum, error) => sum + error, 0) / squaredErrors.length;
    return Math.sqrt(mse);
  }
  
  getPredictions() {
    return [...this.predictions];
  }
  
  clear() {
    this.predictions = [];
  }
}

/**
 * Test data generators
 */
export function generateTestText(length: number = 50): string {
  const words = [
    'amazing', 'great', 'excellent', 'wonderful', 'fantastic', 'brilliant',
    'terrible', 'awful', 'horrible', 'worst', 'disappointing', 'frustrating',
    'okay', 'fine', 'average', 'decent', 'acceptable', 'standard',
    'product', 'service', 'experience', 'quality', 'performance', 'design',
    'customer', 'support', 'delivery', 'price', 'value', 'functionality'
  ];
  
  const result = [];
  for (let i = 0; i < length; i++) {
    result.push(words[Math.floor(Math.random() * words.length)]);
  }
  
  return result.join(' ');
}

export function generateMovieRatings(count: number = 10) {
  const movies = [
    { id: 1, title: 'The Matrix', genres: ['Action', 'Sci-Fi'] },
    { id: 2, title: 'Titanic', genres: ['Romance', 'Drama'] },
    { id: 3, title: 'The Hangover', genres: ['Comedy'] },
    { id: 4, title: 'The Shining', genres: ['Horror', 'Thriller'] },
    { id: 5, title: 'Inception', genres: ['Action', 'Sci-Fi'] },
    { id: 6, title: 'The Notebook', genres: ['Romance', 'Drama'] },
    { id: 7, title: 'Superbad', genres: ['Comedy'] },
    { id: 8, title: 'It', genres: ['Horror', 'Thriller'] }
  ];
  
  const ratings = [];
  for (let i = 0; i < Math.min(count, movies.length); i++) {
    const movie = movies[i];
    ratings.push({
      movieId: movie.id,
      title: movie.title,
      rating: Math.floor(Math.random() * 5) + 1,
      genres: movie.genres
    });
  }
  
  return ratings;
}

/**
 * Assertion helpers
 */
export function expectPerformanceWithinLimits(
  actualTime: number,
  maxTime: number,
  operation: string
) {
  if (actualTime > maxTime) {
    throw new Error(
      `Performance assertion failed: ${operation} took ${actualTime}ms, expected < ${maxTime}ms`
    );
  }
}

export function expectAccuracyAboveThreshold(
  accuracy: number,
  threshold: number,
  context: string
) {
  if (accuracy < threshold) {
    throw new Error(
      `Accuracy assertion failed: ${context} achieved ${(accuracy * 100).toFixed(1)}% accuracy, expected > ${(threshold * 100).toFixed(1)}%`
    );
  }
}

export function expectMemoryUsageWithinLimits(
  actualUsage: number,
  maxUsage: number,
  context: string
) {
  if (actualUsage > maxUsage) {
    const actualMB = (actualUsage / (1024 * 1024)).toFixed(1);
    const maxMB = (maxUsage / (1024 * 1024)).toFixed(1);
    throw new Error(
      `Memory assertion failed: ${context} used ${actualMB}MB, expected < ${maxMB}MB`
    );
  }
}

// Export commonly used test configuration
export { defaultTestConfig };
export type { TestConfig };